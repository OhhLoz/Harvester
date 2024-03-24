import {
    searchCompendium,
    validateAction,
    actionCompendium,
    harvestCompendium,
    lootCompendium,
    customCompendium,
    customLootCompendium,
    harvestBetterRollCompendium,
    harvestAction,
    lootAction,
    harvesterAndLootingSocket,
    currencyFlavors,
    hasBetterRollTables,
    addEffect,
    addItemsToActor,
} from "../../module.js";
import { CONSTANTS } from "../constants.js";
import { RequestorHelpers } from "../requestor-helpers.js";
import { SETTINGS } from "../settings.js";
import Logger from "./Logger.js";
import BetterRollTablesHelpers from "./better-rolltables-helpers.js";
import ItemPilesHelpers from "./item-piles-helpers.js";
import {
    checkItemSourceLabel,
    retrieveItemSourceLabelDC,
    retrieveItemSourceLabel,
    formatDragon,
    isRealBoolean,
} from "./lib.js";

export class HarvestingHelpers {
    static async handlePreRollHarvestAction(options) {
        Logger.debug(`HarvestingHelpers | START handlePreRollHarvestAction`);
        const { item } = options;
        if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
            Logger.debug(`HarvestingHelpers | NO '${CONSTANTS.SOURCE_REFERENCE_MODULE}' found it on item`, item);
            return;
        }

        let targetedToken =
            canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`)) ?? game.user.targets.first();
        let targetedActor = game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
        let controlledToken =
            canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ??
            canvas.tokens.controlled[0];
        let controlActor = game.actors.get(controlledToken.actor?.id ?? controlledToken.document?.actorId);

        if (!targetedToken) {
            Logger.warn(`HarvestingHelpers | NO targeted token is been found`, true);
            return;
        }

        let actorName = targetedActor ? targetedActor.name : targetedToken.name;

        if (!controlledToken) {
            Logger.warn(`HarvestingHelpers | NO controlled token is been found`, true);
            return;
        }

        let matchedItems = [];
        if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
            Logger.debug(`HarvestingHelpers | Searching MatchedItems with BRT`);
            matchedItems = BetterRollTablesHelpers.retrieveTablesHarvestWithBetterRollTables(
                actorName,
                harvestAction.name || item.name,
            );
            Logger.debug(`HarvestingHelpers | Found MatchedItems with BRT (${matchedItems?.length})`, matchedItems);
        } else {
            Logger.debug(`HarvestingHelpers | Searching MatchedItems with STANDARD`);
            matchedItems = searchCompendium(actorName, harvestAction.name || item.name);
            Logger.debug(
                `HarvestingHelpers | Found MatchedItems with STANDARD (${matchedItems?.length})`,
                matchedItems,
            );
        }

        let skillDenomination = getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`); // TODO make this better
        let skillCheck = "Nature"; // TODO make this better
        if (matchedItems.length === 0) {
            Logger.debug(`HarvestingHelpers | MatchedItems is empty`);
            Logger.debug(
                `HarvestingHelpers | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
            );
            RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, {
                chatTitle: "Harvesting valuable from corpses.",
                chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                chatButtonLabel: undefined,
                chatWhisper: undefined,
                chatSpeaker: undefined,
                chatImg: "icons/skills/social/theft-pickpocket-bribery-brown.webp",
            });
        } else {
            Logger.debug(`HarvestingHelpers | MatchedItems is not empty`);

            let harvestMessage = targetedToken.name;
            if (harvestMessage !== actorName) {
                harvestMessage += ` (${actorName})`;
            }
            if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
                Logger.debug(`HarvestingHelpers | BRT is enable`);
                let skillCheckVerbose = getProperty(matchedItems[0], `flags.better-rolltables.brt-skill-value`);
                skillCheck = skillCheckVerbose;
            } else {
                Logger.debug(`HarvestingHelpers | STANDARD is enable`);
                let skillCheckVerbose;
                if (matchedItems[0].compendium.metadata.id === CONSTANTS.harvestCompendiumId) {
                    if (matchedItems[0]?.system?.unidentified?.description) {
                        skillCheckVerbose = matchedItems[0]?.system.unidentified.description;
                    } else {
                        skillCheckVerbose = matchedItems[0]?.system.description.unidentified;
                    }
                } else {
                    Logger.debug(
                        `HarvestingHelpers | STANDARD no matchedItems[0].compendium.metadata.id === CONSTANTS.harvestCompendiumId`,
                        CONSTANTS.harvestCompendiumId,
                    );
                    skillCheckVerbose = matchedItems[0].items.find((element) => element.type === "feat").name;
                }
                skillCheck = CONSTANTS.skillMap.get(skillCheckVerbose);
            }

            item.setFlag(CONSTANTS.MODULE_ID, "skillCheck", skillCheck);
            item.update({ system: { formula: `1d20 + @skills.${skillCheck}.total` } });

            Logger.debug(
                `HarvestingHelpers | Harvesting '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`,
            );

            RequestorHelpers.requestRollSkill(
                controlledToken.actor,
                undefined,
                {
                    chatTitle: `Harvesting Skill Check (${skillDenomination})`,
                    chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`,
                    chatButtonLabel: `Attempting to Harvest ${harvestMessage}`,
                    chatWhisper: undefined,
                    chatSpeaker: undefined,
                    chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
                },
                {
                    skillDenomination: skillDenomination,
                    skillItem: item,
                    skillCallback: "handlePostRollHarvestAction",
                    skillChooseModifier: SETTINGS.allowAbilityChange,
                },
                {
                    popout: game.settings.get(CONSTANTS.MODULE_ID, "requestorPopout"),
                },
            );
        }

        item.setFlag(CONSTANTS.MODULE_ID, "targetId", "");
        // harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);
    }

    static async handlePostRollHarvestAction(options) {
        Logger.debug(`HarvestingHelpers | START handlePostRollHarvestAction`);
        const { actor, item, roll } = options;
        if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
            Logger.debug(`HarvestingHelpers | NO '${CONSTANTS.SOURCE_REFERENCE_MODULE}' found it on item`, item);
            return;
        }
        let targetedToken =
            canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`)) ?? game.user.targets.first();
        let targetedActor = await game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
        let controlledToken =
            canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ??
            canvas.tokens.controlled[0];

        if (!targetedToken) {
            Logger.warn(`HarvestingHelpers | NO targeted token is been found`, true);
            return;
        }

        let actorName = targetedActor ? targetedActor.name : targetedToken.name;

        if (!controlledToken) {
            Logger.warn(`HarvestingHelpers | NO controlled token is been found`, true);
            return;
        }

        if (!validateAction(controlledToken, targetedToken, item.name)) {
            Logger.warn(`HarvestingHelpers | NO valid action is been found`, true);
            return false;
        }

        let result = roll;
        let harvesterMessage = "";
        let successArr = [];

        let matchedItems = [];

        harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);

        if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables && item.name === harvestAction.name) {
            Logger.debug(`HarvestingHelpers | BRT is enable, and has a rollTable`);
            matchedItems = await BetterRollTablesHelpers.retrieveItemsHarvestWithBetterRollTables(
                actorName,
                item.name,
                result.total,
                getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`),
            );

            matchedItems.forEach((item) => {
                Logger.debug(`HarvestingHelpers | BRT check matchedItem`, item);
                // if (item.type === "loot") {
                harvesterMessage += `<li>@UUID[${item.uuid}] x ${item.system?.quantity || 1}</li>`;
                Logger.debug(`HarvestingHelpers | BRT the item ${item.name} is been added as success`);
                successArr.push(item);
                // } else {
                //   Logger.warn(`HarvestingHelpers | BRT the type item is not 'loot'`);
                // }
                Logger.debug(`HarvestingHelpers | BRT successArr`, successArr);
            });
        } else {
            matchedItems = await searchCompendium(actorName, item.name);
            if (matchedItems[0].compendium.metadata.id === CONSTANTS.customCompendiumId) {
                matchedItems = matchedItems[0].items;
            }
            matchedItems.forEach((item) => {
                Logger.debug(`HarvestingHelpers | STANDARD check matchedItem`, item);
                // if (item.type === "loot") {
                let itemDC = 0;
                if (item.compendium.metadata.id === CONSTANTS.harvestCompendiumId) {
                    itemDC = parseInt(item.system.description.chat);
                } else {
                    itemDC = retrieveItemSourceLabelDC(item);
                }
                if (itemDC <= result.total) {
                    harvesterMessage += `<li>@UUID[${item.uuid}] x ${item.system?.quantity || 1}</li>`;
                    Logger.debug(`HarvestingHelpers | STANDARD the item ${item.name} is been added as success`);
                    successArr.push(item.toObject());
                }
                // } else {
                //   Logger.warn(`HarvestingHelpers | STANDARD the type item is not 'loot'`);
                // }
                Logger.debug(`HarvestingHelpers | STANDARD successArr`, successArr);
            });
        }

        if (SETTINGS.autoAddItems && successArr?.length > 0) {
            Logger.debug(`HarvestingHelpers | FINAL autoAddItems enable and successArr is not empty`);
            await HarvestingHelpers.addItemsToActorHarvesterOption(controlledToken.actor, targetedToken, successArr);
        } else {
            Logger.debug(`HarvestingHelpers | FINAL autoAddItems is ${SETTINGS.autoAddItems ? "enable" : "disable"}`);
            Logger.debug(
                `HarvestingHelpers | FINAL successArr is empty ? ${successArr?.length > 0 ? "false" : "true"}`,
            );
            Logger.debug(
                `HarvestingHelpers | FINAL After examining the corpse ${controlledToken.name} realise there is nothing to harvest from ${targetedToken.name}.`,
            );
            if (successArr?.length <= 0) {
                harvesterMessage = `After examining the corpse ${controlledToken.name} realise there is nothing to harvest from ${targetedToken.name}.`;
            }
        }

        let messageData = { content: "", whisper: {} };
        if (SETTINGS.gmOnly) {
            messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
        }
        if (harvesterMessage) {
            messageData.content = `<h3>Harvesting</h3><ul>${harvesterMessage}</ul>`;
        }
        Logger.debug(`HarvestingHelpers | FINAL create the message`);
        ChatMessage.create(messageData);

        return false;
    }

    static async addItemsToActorHarvesterOption(actor, targetedToken, itemsToAdd) {
        const shareIt = await RequestorHelpers.requestHarvestMessage(actor, undefined, itemsToAdd, targetedToken, {
            popout: game.settings.get(CONSTANTS.MODULE_ID, "requestorPopout"),
        });
        /*
        if(!isRealBoolean(shareIt)) {
            Logger.error(`Something went wrong with the harvester code`, true);
            return;
        }
        if (shareIt) {
            Logger.debug(`SHARE IT | Add items with ITEMPILES to ${actor.name}`, itemsToAdd);
            await ItemPilesHelpers.convertTokenToItemPilesContainer(targetedToken);
        } else {
            Logger.debug(`KEEP IT | Add items with ITEMPILES to ${actor.name}`, itemsToAdd);
            await ItemPilesHelpers.addItems(targetedToken, itemsToAdd, {
                mergeSimilarItems: true,
            });
        }
        */
    }
}
