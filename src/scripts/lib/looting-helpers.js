import {
    validateAction,
    actionCompendium,
    harvestCompendium,
    lootCompendium,
    customCompendium,
    customLootCompendium,
    harvesterBetterRollCompendium,
    harvestAction,
    lootAction,
    currencyFlavors,
    addEffect,
    addItemsToActor,
} from "../../module.js";
import { CONSTANTS } from "../constants.js";
import { RequestorHelpers } from "../requestor-helpers.js";
import { SETTINGS } from "../settings.js";
import { harvesterAndLootingSocket } from "../socket.js";
import Logger from "./Logger.js";
import BetterRollTablesHelpers from "./better-rolltables-helpers.js";
import ItemPilesHelpers from "./item-piles-helpers.js";
import {
    checkItemSourceLabel,
    retrieveItemSourceLabelDC,
    retrieveItemSourceLabel,
    updateActorCurrencyNoDep,
} from "./lib.js";

export class LootingHelpers {
    static async handlePreRollLootAction(options) {
        Logger.debug(`LootingHelpers | START handlePreRollHarvestAction`);
        if (SETTINGS.disableLoot) {
            Logger.warn(`LootingHelpers | The Loot Action is been disabled by the module setting`, true);
            return;
        }
        const { item } = options;
        if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
            Logger.debug(`LootingHelpers | NO '${CONSTANTS.SOURCE_REFERENCE_MODULE}' found it on item`, item);
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
            Logger.warn(`LootingHelpers | NO targeted token is been found`, true);
            return;
        }

        let actorName = SETTINGS.forceToUseAlwaysActorName
            ? targetedActor
                ? targetedActor.name
                : targetedToken.name
            : targetedToken.name;

        if (!controlledToken) {
            Logger.warn(`LootingHelpers | NO controlled token is been found`, true);
            return;
        }

        let rollTablesMatched = [];
        Logger.debug(`LootingHelpers | Searching RollTablesMatched with BRT`);
        rollTablesMatched = BetterRollTablesHelpers.retrieveTablesLootWithBetterRollTables(
            actorName,
            lootAction.name || item.name,
        );
        Logger.debug(
            `LootingHelpers | Found RollTablesMatched with BRT (${rollTablesMatched?.length})`,
            rollTablesMatched,
        );

        const rollTableLoot = rollTablesMatched[0];

        /* TODO add the source reference field on loot table too ??
        if (rollTableLoot.description === "false") {
            Logger.warn(`Normal loot is been disabled for this roll table ${rollTableLoot.name}`, true);
            Logger.warn(`normalLoot=${normalLoot} and SETTINGS.lootBeasts=${SETTINGS.lootBeasts}`);
            let messageData = { content: "", whisper: {} };
            if (SETTINGS.gmOnly) {
                messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
            }
            messageData.content = `After examining the corpse ${controlledToken.name} realise there is nothing to loot from ${targetedToken.name}.`;
            ChatMessage.create(messageData);
            return;
        }
        */
        let matchedItems = [];
        Logger.debug(`LootingHelpersHelpers | BRT is enable, and has a rollTable '${rollTableLoot.name}'`);
        matchedItems = await BetterRollTablesHelpers.retrieveResultsDataLootWithBetterRollTables(
            rollTableLoot,
            actorName,
            item.name,
        );

        if (matchedItems.length === 0) {
            Logger.debug(`LootingHelpers | MatchedItems is empty`);
            Logger.debug(
                `LootingHelpers | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`,
            );
            await RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, game.user.id, {
                chatTitle: "Looting valuable from corpses.",
                chatDescription: `<h3>Looting</h3>'${controlledToken.name}' attempted to loot resources from '${targetedToken.name}' but failed to find anything for this creature.`,
                chatButtonLabel: undefined,
                chatWhisper: undefined,
                chatSpeaker: undefined,
                chatImg: "icons/skills/social/theft-pickpocket-bribery-brown.webp",
            });
        } else {
            Logger.debug(`LootingHelpers | RollTablesMatched is not empty`);

            let lootMessage = targetedToken.name;
            if (lootMessage !== actorName) {
                lootMessage += ` (${actorName})`;
            }
            let lootMessageList = "";
            for (const result of matchedItems) {
                const currencyLabel = ItemPilesHelpers.generateCurrenciesStringFromString(result.text);
                if (game.modules.get("item-piles")?.active) {
                    Logger.debug(`LootingHelpers | addCurrencies ITEM PILES ${currencyLabel}`);
                    if (SETTINGS.autoAddItems) {
                        await ItemPilesHelpers.addCurrencies(controlledToken, currencyLabel);
                    }
                    lootMessageList += `<li>${currencyLabel}</li>`; // TODO calculate the total to show to the message
                } else {
                    Logger.debug(`LootingHelpers | addCurrencies STANDARD ${currencyLabel}`);
                    if (SETTINGS.autoAddItems) {
                        await updateActorCurrencyNoDep(controlActor, currencyLabel);
                    }
                    // lootMessageList += `<li>${rollResult.total} ${currency}</li>`;
                    lootMessageList += `<li>${currencyLabel}</li>`; // TODO calculate the total to show to the message
                }
            }

            let messageDataList = { content: "", whisper: {} };
            if (SETTINGS.gmOnly) {
                messageDataList.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
            }
            messageDataList.content = `<h3>Looting</h3>After examining the corpse ${controlledToken.name} loot from ${targetedToken.name}:<ul>${lootMessageList}</ul>`;

            ChatMessage.create(messageDataList);

            Logger.debug(
                `LootingHelpers | LootingHelpers '${controlledToken.name}' attempted to looting resources from '${targetedToken.name}'.`,
            );
        }

        await item.setFlag(CONSTANTS.MODULE_ID, "targetId", "");
        await harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, lootAction.name);
        return false;
    }

    static async handlePostRollLootAction(options) {
        // NOTHING FOR NOW ???
        return false;
    }
}
