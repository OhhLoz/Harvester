import { validateAction, harvestAction, addEffect, addItemsToActor } from "../../module.js";
import { CONSTANTS } from "../constants.js";
import { RequestorHelpers } from "../requestor-helpers.js";
import { SETTINGS } from "../settings.js";
import { harvesterAndLootingSocket } from "../socket.js";
import Logger from "./Logger.js";
import BetterRollTablesHelpers from "./better-rolltables-helpers.js";
import ItemPilesHelpers from "./item-piles-helpers.js";
import { checkItemSourceLabel, parseAsArray } from "./lib.js";
import { RetrieveHelpers } from "./retrieve-helpers.js";

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
        if (!targetedToken) {
            Logger.warn(`HarvestingHelpers | NO targeted token is been found`, true);
            return;
        }

        let controlledToken =
            canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ??
            canvas.tokens.controlled[0];
        if (!controlledToken) {
            Logger.warn(`HarvestingHelpers | NO controlled token is been found`, true);
            return;
        }

        let controlActor = game.actors.get(controlledToken.actor?.id ?? controlledToken.document?.actorId);
        let targetedActor = game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
        let actorName = SETTINGS.forceToUseAlwaysActorName
            ? targetedActor
                ? targetedActor.name
                : targetedToken.name
            : targetedToken.name;

        let rollTablesMatched = [];
        Logger.debug(`HarvestingHelpers | Searching RollTablesMatched`);
        rollTablesMatched = BetterRollTablesHelpers.retrieveTablesHarvestWithBetterRollTables(
            actorName,
            harvestAction.name || item.name,
        );
        Logger.debug(`HarvestingHelpers | Found RollTablesMatched (${rollTablesMatched?.length})`, rollTablesMatched);

        if (rollTablesMatched.length === 0) {
            Logger.debug(`HarvestingHelpers | RollTablesMatched is empty`);
            Logger.debug(
                `HarvestingHelpers | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
            );
            await RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, game.user.id, {
                chatTitle: "Harvesting valuable from corpses.",
                chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                chatButtonLabel: undefined,
                chatWhisper: undefined,
                chatSpeaker: undefined,
                chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
            });
        } else {
            Logger.debug(`HarvestingHelpers | RollTablesMatched is not empty`);
            const rollTableChosenHarvester = rollTablesMatched[0];
            Logger.info(`HarvestingHelpers | RollTablesMatched chosen '${rollTableChosenHarvester.name}'`);
            let harvestMessage = targetedToken.name;
            if (harvestMessage !== actorName) {
                harvestMessage += ` (${actorName})`;
            }

            Logger.debug(`HarvestingHelpers | BRT is enable`);
            let skillCheckVerbose;
            if (game.modules.get("better-rolltables")?.active) {
                skillCheckVerbose = getProperty(rollTableChosenHarvester, `flags.better-rolltables.brt-skill-value`);
            } else {
                // let skillDenomination = getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`); // TODO make this better
                // let skillCheck = skillCheckVerbose ? skillCheckVerbose : "nat"; // TODO make this better maybe with requestor
                // item.setFlag(CONSTANTS.MODULE_ID, "skillCheck", skillCheck);
                // item.update({ system: { formula: `1d20 + @skills.${skillCheck}.total` } });
                skillCheckVerbose = getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`) || "nat"; // TODO make this better
            }
            if (!skillCheckVerbose) {
                Logger.warn(
                    `HarvestingHelpers | ATTENTION: No 'flags.better-rolltables.brt-skill-value' is been setted on table '${rollTableChosenHarvester.name}'`,
                    true,
                    rollTableChosenHarvester,
                );
                return;
            }

            let skillCheckVerboseArr = parseAsArray(skillCheckVerbose);
            const skillCheckVerboseList = [];
            for (const skill of skillCheckVerboseArr) {
                skillCheckVerboseList.push({
                    skillControlledTokenUuid: controlledToken.uuid || controlledToken.id,
                    skillTargetedTokenUuid: targetedToken.uuid || targetedToken.id,
                    skillRollTableUuid: rollTableChosenHarvester.uuid,
                    skillDenomination: skill,
                    skillItem: item.uuid,
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
                    game.user.id,
                    {
                        chatTitle: `Harvesting Skill Check (${skillCheckVerboseArr.join(",")})`,
                        chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`,
                        chatButtonLabel: `Harvesting '${actorName}' with '${skillCheckVerboseTmp.skillDenomination}'`,
                        chatWhisper: undefined,
                        chatSpeaker: undefined,
                        chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
                    },
                    {
                        skillControlledTokenUuid: skillCheckVerboseTmp.skillControlledTokenUuid,
                        skillTargetedTokenUuid: skillCheckVerboseTmp.skillTargetedTokenUuid,
                        skillRollTableUuid: skillCheckVerboseTmp.skillRollTableUuid,
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
                    game.user.id,
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
    }

    static async handlePostRollHarvestAction(options) {
        Logger.debug(`HarvestingHelpers | START handlePostRollHarvestAction`);
        const {
            token,
            character,
            actor,
            event,
            data,
            roll,
            skillControlledTokenUuid,
            skillTargetedTokenUuid,
            skillRollTableUuid,
            skillDenomination,
            item,
        } = options;

        if (!item) {
            Logger.warn(`HarvestingHelpers | Something go wrong the 'skillItem' cannot be undefined`, true);
            return;
        }
        const itemTmp = await RetrieveHelpers.getItemAsync(item);
        if (!itemTmp) {
            Logger.warn(`HarvestingHelpers | Something go wrong the 'item' cannot be undefined`, true);
            return;
        }
        if (!checkItemSourceLabel(itemTmp, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
            Logger.debug(`HarvestingHelpers | NO '${CONSTANTS.SOURCE_REFERENCE_MODULE}' found it on item`, itemTmp);
            return;
        }
        if (!skillControlledTokenUuid) {
            Logger.warn(
                `HarvestingHelpers | Something go wrong the 'skillControlledTokenUuid' cannot be undefined`,
                true,
            );
            return;
        }
        if (!skillTargetedTokenUuid) {
            Logger.warn(
                `HarvestingHelpers | Something go wrong the 'skillTargetedTokenUuid' cannot be undefined`,
                true,
            );
            return;
        }
        let targetedToken = RetrieveHelpers.getTokenSync(skillTargetedTokenUuid);
        if (!targetedToken) {
            Logger.warn(`HarvestingHelpers | NO targeted token is been found`, true);
            return;
        }

        let controlledToken = RetrieveHelpers.getTokenSync(skillControlledTokenUuid);
        if (!controlledToken) {
            Logger.warn(`HarvestingHelpers | NO controlled token is been found`, true);
            return;
        }

        // Reset flags
        await itemTmp.setFlag(CONSTANTS.MODULE_ID, "controlId", "");
        await itemTmp.setFlag(CONSTANTS.MODULE_ID, "targetId", "");

        let targetedActor = await game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
        let actorName = SETTINGS.forceToUseAlwaysActorName
            ? targetedActor
                ? targetedActor.name
                : targetedToken.name
            : targetedToken.name;

        if (!validateAction(controlledToken, targetedToken, itemTmp.name)) {
            Logger.warn(`HarvestingHelpers | NO valid action is been found on '${itemTmp.name}'`, true);
            return false;
        }

        let result = roll;
        if (!result) {
            Logger.warn(`HarvestingHelpers | Something go wrong the 'result' cannot be undefined`, true);
            return;
        }

        if (!skillRollTableUuid) {
            Logger.warn(`HarvestingHelpers | Something go wrong the 'skillRollTableUuid' cannot be undefined`, true);
            return;
        }
        if (!skillDenomination) {
            Logger.warn(`HarvestingHelpers | Something go wrong the 'skillDenomination' cannot be undefined`, true);
            return;
        }

        let harvesterMessage = "";
        let matchedItems = [];

        let rollTableChosenHarvester = await RetrieveHelpers.getRollTableAsync(options?.skillRollTableUuid);

        await harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);

        Logger.debug(`HarvestingHelpers | is enable, and has a rollTable`);
        matchedItems = await BetterRollTablesHelpers.retrieveItemsDataHarvestWithBetterRollTables(
            rollTableChosenHarvester,
            actorName,
            itemTmp.name,
            result.total,
            skillDenomination,
        );

        if (!matchedItems || matchedItems.length === 0) {
            Logger.debug(`HarvestingHelpers | MatchedItems is empty`);
            if (game.modules.get("better-rolltables")?.active) {
                Logger.debug(
                    `HarvestingHelpers | BRT | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                );
                const minimalDC = await game.modules
                    .get("better-rolltables")
                    .api.retrieveMinDCOnTable(rollTableChosenHarvester);
                const isDcEnough = result.total > minimalDC;
                if (isDcEnough) {
                    await RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, game.user.id, {
                        chatTitle: "Harvesting valuable from corpses.",
                        chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                        chatButtonLabel: undefined,
                        chatWhisper: undefined,
                        chatSpeaker: undefined,
                        chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
                    });
                } else {
                    Logger.info(
                        `The rolled dc '${result.total}' is not enough for this table '${rollTableChosenHarvester.name}' the minimal DC is '${minimalDC}'`,
                    );
                    await RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, game.user.id, {
                        chatTitle: "Harvesting valuable from corpses.",
                        chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' try is best to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                        chatButtonLabel: undefined,
                        chatWhisper: undefined,
                        chatSpeaker: undefined,
                        chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
                    });
                }
            } else {
                Logger.debug(
                    `HarvestingHelpers | STANDARD | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                );
                await RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, game.user.id, {
                    chatTitle: "Harvesting valuable from corpses.",
                    chatDescription: `<h3>Harvesting</h3>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                    chatButtonLabel: undefined,
                    chatWhisper: undefined,
                    chatSpeaker: undefined,
                    chatImg: "icons/tools/cooking/knife-cleaver-steel-grey.webp",
                });
            }
        } else {
            matchedItems.forEach((item) => {
                Logger.debug(`HarvestingHelpers | check matchedItem`, item);
                harvesterMessage += `<li>@UUID[${item.uuid}] x ${item.system?.quantity || 1}</li>`;
                Logger.debug(`HarvestingHelpers | the item ${item.name} is been added as success`);
                Logger.debug(`HarvestingHelpers | matchedItems`, matchedItems);
            });

            harvesterMessage = `<h3>Harvesting</h3><ul>${harvesterMessage}</ul>`;

            if (SETTINGS.autoAddItems) {
                Logger.debug(`HarvestingHelpers | FINAL | autoAddItems enable and matchedItems is not empty`);
                // await HarvestingHelpers.addItemsToActorHarvesterOption(
                //     controlledToken.actor.id,
                //     targetedToken.id,
                //     matchedItems,
                //     harvesterMessage,
                //     game.user.id
                // );
                await harvesterAndLootingSocket.executeAsGM(
                    HarvestingHelpers.addItemsToActorHarvesterOption,
                    controlledToken.actor.id,
                    targetedToken.id,
                    matchedItems,
                    harvesterMessage,
                    game.user.id,
                );
            } else {
                let messageData = { content: "", whisper: {} };
                if (SETTINGS.gmOnly) {
                    messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
                }

                messageData.content = `${harvesterMessage}`;

                Logger.debug(`HarvestingHelpers | FINAL | create the message`);
                ChatMessage.create(messageData);
            }
        }

        return false;
    }

    static async addItemsToActorHarvesterOption(actorId, targetedTokenId, itemsToAdd, harvesterMessage, userId) {
        const actor = await RetrieveHelpers.getActorAsync(actorId);
        if (game.modules.get("item-piles")?.active) {
            const targetedToken = RetrieveHelpers.getTokenSync(targetedTokenId);
            if (SETTINGS.harvestAddItemsMode === "ShareItOrKeepIt") {
                Logger.debug(
                    `HarvestingHelpers | SHARE IT OR KEEP IT | Add items with ITEMPILES to ${actor.name}`,
                    itemsToAdd,
                );
                await RequestorHelpers.requestHarvestMessage(actor, undefined, userId, itemsToAdd, targetedToken, {
                    popout: game.settings.get(CONSTANTS.MODULE_ID, "requestorPopout"),
                });
            } else if (SETTINGS.harvestAddItemsMode === "ShareIt") {
                Logger.debug(`HarvestingHelpers | SHARE IT | Add items with ITEMPILES to ${actor.name}`, itemsToAdd);
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
                Logger.debug(`HarvestingHelpers | SHARE IT | create the message`);
                ChatMessage.create(messageData);
            } else if (SETTINGS.harvestAddItemsMode === "KeepIt") {
                Logger.debug(`HarvestingHelpers | KEEP IT | Add items with ITEMPILES to ${actor.name}`, itemsToAdd);
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
                Logger.debug(`HarvestingHelpers | KEEP IT | create the message`);
                ChatMessage.create(messageData);
            } else {
                Logger.error(`HarvestingHelpers | KEEP IT | Something went wrong with the harvester code`, true);
            }
        } else {
            Logger.debug(`HarvestingHelpers | KEEP IT | Add items with STANDARD to ${actor.name}`, itemsToAdd);
            await addItemsToActor(actor, itemsToAdd);
            let messageData = { content: "", whisper: {} };
            if (SETTINGS.gmOnly) {
                messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
            }
            if (harvesterMessage) {
                messageData.content = `${harvesterMessage}`;
            }
            Logger.debug(`HarvestingHelpers | KEEP IT | create the message`);
            ChatMessage.create(messageData);
        }
    }
}
