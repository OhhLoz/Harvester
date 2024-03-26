import {
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
    parseAsArray,
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

        let actorName = SETTINGS.forceToUseAlwaysActorName
            ? targetedActor
                ? targetedActor.name
                : targetedToken.name
            : targetedToken.name;

        if (!controlledToken) {
            Logger.warn(`HarvestingHelpers | NO controlled token is been found`, true);
            return;
        }

        let rollTablesMatched = [];
        Logger.debug(`HarvestingHelpers | Searching RollTablesMatched with BRT`);
        rollTablesMatched = BetterRollTablesHelpers.retrieveTablesHarvestWithBetterRollTables(
            actorName,
            harvestAction.name || item.name,
        );
        Logger.debug(
            `HarvestingHelpers | Found RollTablesMatched with BRT (${rollTablesMatched?.length})`,
            rollTablesMatched,
        );

        if (rollTablesMatched.length === 0) {
            Logger.debug(`HarvestingHelpers | RollTablesMatched is empty`);
            Logger.debug(
                `HarvestingHelpers | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
            );
            await RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, {
                chatTitle: "Harvesting valuable from corpses.",
                chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                chatButtonLabel: undefined,
                chatWhisper: undefined,
                chatSpeaker: undefined,
                chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
            });
        } else {
            Logger.debug(`HarvestingHelpers | RollTablesMatched is not empty`);

            let harvestMessage = targetedToken.name;
            if (harvestMessage !== actorName) {
                harvestMessage += ` (${actorName})`;
            }

            Logger.debug(`HarvestingHelpers | BRT is enable`);
            let skillCheckVerbose = getProperty(rollTablesMatched[0], `flags.better-rolltables.brt-skill-value`);
            if (!skillCheckVerbose) {
                Logger.warn(
                    `ATTENTION: No 'flags.better-rolltables.brt-skill-value' is been setted on table '${rollTablesMatched[0]}'`,
                    true,
                    rollTablesMatched[0],
                );
                return;
            }
            // let skillDenomination = getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`); // TODO make this better
            // let skillCheck = skillCheckVerbose ? skillCheckVerbose : "nat"; // TODO make this better maybe with requestor
            // item.setFlag(CONSTANTS.MODULE_ID, "skillCheck", skillCheck);
            // item.update({ system: { formula: `1d20 + @skills.${skillCheck}.total` } });

            let skillCheckVerboseArr = parseAsArray(skillCheckVerbose);
            const skillCheckVerboseList = [];
            for (const skill of skillCheckVerboseArr) {
                // let itemClone = new Item(item?.toObject());
                // // itemClone.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED;
                // itemClone.setFlag(CONSTANTS.MODULE_ID, "skillCheck", skill);
                // itemClone.update({ system: { formula: `1d20 + @skills.${skill}.total` } });
                skillCheckVerboseList.push({
                    skillDenomination: skill,
                    skillItem: item,
                    skillCallback: "handlePostRollHarvestAction",
                    skillChooseModifier: SETTINGS.allowAbilityChange,
                    skillButtonLabel: `Harvesting '${actorName}' with '${skill}'`,
                });
            }

            Logger.debug(
                `HarvestingHelpers | Harvesting '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`,
            );

            if (skillCheckVerboseArr.length === 1) {
                const skillCheckVerboseTmp = skillCheckVerboseList[0];
                await RequestorHelpers.requestRollSkill(
                    controlledToken.actor,
                    undefined,
                    {
                        chatTitle: `Harvesting Skill Check (${skillCheckVerboseArr.join(",")})`,
                        chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`,
                        chatButtonLabel: `Harvesting '${actorName}' with '${skillCheckVerboseTmp.skillDenomination}'`,
                        chatWhisper: undefined,
                        chatSpeaker: undefined,
                        chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
                    },
                    {
                        skillDenomination: skillCheckVerboseTmp.skillDenomination,
                        skillItem: skillCheckVerboseTmp.skillItem,
                        skillCallback: skillCheckVerboseTmp.skillCallback,
                        skillChooseModifier: skillCheckVerboseTmp.skillChooseModifier,
                        skillButtonLabel: skillCheckVerboseTmp.skillButtonLabel,
                    },
                    {
                        popout: game.settings.get(CONSTANTS.MODULE_ID, "requestorPopout"),
                    },
                );
            } else {
                await RequestorHelpers.requestRollSkillMultiple(
                    controlledToken.actor,
                    undefined,
                    {
                        chatTitle: `Harvesting Skill Check (${skillCheckVerboseArr.join(",")})`,
                        chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`,
                        chatButtonLabel: `Harvesting '${actorName}' with multiple skills`,
                        chatWhisper: undefined,
                        chatSpeaker: undefined,
                        chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
                    },
                    skillCheckVerboseList,
                    {
                        popout: game.settings.get(CONSTANTS.MODULE_ID, "requestorPopout"),
                    },
                );
            }
        }
        item.setFlag(CONSTANTS.MODULE_ID, "targetId", "");
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

        let actorName = SETTINGS.forceToUseAlwaysActorName
            ? targetedActor
                ? targetedActor.name
                : targetedToken.name
            : targetedToken.name;

        if (!controlledToken) {
            Logger.warn(`HarvestingHelpers | NO controlled token is been found`, true);
            return;
        }

        if (!validateAction(controlledToken, targetedToken, item.name)) {
            Logger.warn(`HarvestingHelpers | NO valid action is been found`, true);
            return false;
        }

        let result = roll;
        if (!result) {
            Logger.warn(`Something go wrong the result cannot be undefined`, true);
            return;
        }
        let harvesterMessage = "";
        let matchedItems = [];

        await harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);

        Logger.debug(`HarvestingHelpers | BRT is enable, and has a rollTable`);
        matchedItems = await BetterRollTablesHelpers.retrieveItemsDataHarvestWithBetterRollTables(
            actorName,
            item.name,
            result.total,
            getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`),
        );

        if (matchedItems.length === 0) {
            Logger.debug(`HarvestingHelpers | MatchedItems is empty`);
            Logger.debug(
                `HarvestingHelpers | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
            );
            await RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, {
                chatTitle: "Harvesting valuable from corpses.",
                chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                chatButtonLabel: undefined,
                chatWhisper: undefined,
                chatSpeaker: undefined,
                chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
            });
        } else {
            matchedItems.forEach((item) => {
                Logger.debug(`HarvestingHelpers | BRT check matchedItem`, item);
                harvesterMessage += `<li>@UUID[${item.uuid}] x ${item.system?.quantity || 1}</li>`;
                Logger.debug(`HarvestingHelpers | BRT the item ${item.name} is been added as success`);
                Logger.debug(`HarvestingHelpers | BRT matchedItems`, matchedItems);
            });

            harvesterMessage = `<h3>Harvesting</h3><ul>${harvesterMessage}</ul>`;

            if (SETTINGS.autoAddItems) {
                Logger.debug(`HarvestingHelpers | FINAL autoAddItems enable and matchedItems is not empty`);
                await HarvestingHelpers.addItemsToActorHarvesterOption(
                    controlledToken.actor,
                    targetedToken,
                    matchedItems,
                    harvesterMessage,
                );
            } else {
                let messageData = { content: "", whisper: {} };
                if (SETTINGS.gmOnly) {
                    messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
                }

                harvesterMessage = `<h3>Harvesting</h3><ul>${harvesterMessage}</ul>`;

                Logger.debug(`HarvestingHelpers | FINAL create the message`);
                ChatMessage.create(messageData);
            }
        }

        return false;
    }

    static async addItemsToActorHarvesterOption(actor, targetedToken, itemsToAdd, harvesterMessage) {
        if (SETTINGS.harvestAddItemsMode === "ShareItOrKeepIt") {
            Logger.debug(`SHARE IT OR KEEP IT | Add items with ITEMPILES to ${actor.name}`, itemsToAdd);
            await RequestorHelpers.requestHarvestMessage(actor, undefined, itemsToAdd, targetedToken, {
                popout: game.settings.get(CONSTANTS.MODULE_ID, "requestorPopout"),
            });
        } else if (SETTINGS.harvestAddItemsMode === "ShareIt") {
            Logger.debug(`SHARE IT | Add items with ITEMPILES to ${actor.name}`, itemsToAdd);
            // await warpgate.mutate(targetedToken.document, updates, {}, {}); // TODO NOT WORK...
            await ItemPilesHelpers.unlinkToken(targetedToken);
            await ItemPilesHelpers.addItems(targetedToken, itemsToAdd, {
                mergeSimilarItems: true,
                removeExistingActorItems: SETTINGS.harvestRemoveExistingActorItems,
            });
            await ItemPilesHelpers.convertTokenToItemPilesContainer(targetedToken);
            let messageData = { content: "", whisper: {} };
            if (SETTINGS.gmOnly) {
                messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
            }
            if (harvesterMessage) {
                messageData.content = `${harvesterMessage}`;
            }
            Logger.debug(`HarvestingHelpers | FINAL create the message`);
            ChatMessage.create(messageData);
        } else if (SETTINGS.harvestAddItemsMode === "KeepIt") {
            Logger.debug(`KEEP IT | Add items with ITEMPILES to ${actor.name}`, itemsToAdd);
            await ItemPilesHelpers.addItems(actor, itemsToAdd, {
                mergeSimilarItems: true,
            });
            let messageData = { content: "", whisper: {} };
            if (SETTINGS.gmOnly) {
                messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
            }
            if (harvesterMessage) {
                messageData.content = `${harvesterMessage}`;
            }
            Logger.debug(`HarvestingHelpers | FINAL create the message`);
            ChatMessage.create(messageData);
        } else {
            Logger.error(`Something went wrong with the harvester code`, true);
        }
    }
}
