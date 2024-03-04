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
import { checkItemSourceLabel, retrieveItemSourceLabelDC, retrieveItemSourceLabel } from "./lib.js";

export class LootingHelpers {
  static async handlePreRollLootAction(options) {
    Logger.debug(`LootingHelpers | START handlePreRollHarvestAction`);
    const { item } = options;
    if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
      Logger.debug(`LootingHelpers | NO '${CONSTANTS.SOURCE_REFERENCE_MODULE}' found it on item`, item);
      return;
    }

    let targetedToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`)) ?? game.user.targets.first();
    let targetedActor = game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
    let controlledToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ?? canvas.tokens.controlled[0];
    let controlActor = game.actors.get(controlledToken.actor?.id ?? controlledToken.document?.actorId);

    if (!targetedToken) {
      Logger.warn(`LootingHelpers | NO targeted token is been found`, true);
      return;
    }

    if (!controlledToken) {
      Logger.warn(`LootingHelpers | NO controlled token is been found`, true);
      return;
    }

    let matchedItems = [];
    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
      Logger.debug(`LootingHelpers | Searching MatchedItems with BRT`);
      // TODO
      //matchedItems = retrieveTablesLootWithBetterRollTables(targetedActor, lootAction.name || item.name);
      matchedItems = searchCompendium(targetedActor, lootAction.name || item.name);
      Logger.debug(`LootingHelpers | Found MatchedItems with BRT (${matchedItems?.length})`, matchedItems);
    } else {
      Logger.debug(`LootingHelpers | Searching MatchedItems with STANDARD`);
      matchedItems = searchCompendium(targetedActor, lootAction.name || item.name);
      Logger.debug(`LootingHelpers | Found MatchedItems with STANDARD (${matchedItems?.length})`, matchedItems);
    }

    if (matchedItems.length === 0) {
      Logger.debug(`LootingHelpers | MatchedItems is empty`);
      Logger.debug(
        `LootingHelpers | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`
      );
      RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, {
        chatTitle: "Looting valuable from corpses.",
        chatDescription: `<h3>Looting</h3>'${controlledToken.name}' attempted to loot resources from '${targetedToken.name}' but failed to find anything for this creature.`,
        chatButtonLabel: undefined,
        chatWhisper: undefined,
        chatSpeaker: undefined,
        chatImg: "icons/skills/social/theft-pickpocket-bribery-brown.webp",
      });
    } else {
      Logger.debug(`LootingHelpers | MatchedItems is not empty`);

      let lootMessage = targetedToken.name;
      if (lootMessage !== targetedActor.name) {
        lootMessage += ` (${targetedActor.name})`;
      }
      // TODO Loot integration with BRT
      if (false) {
        // if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
        Logger.debug(`HarvestingHelpers | BRT is enable`);
        // TODO
      } else {
        let normalLoot = matchedItems[0].description;
        if (normalLoot === "false" && !SETTINGS.lootBeasts) {
          let messageData = { content: "", whisper: {} };
          if (SETTINGS.gmOnly) {
            messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
          }
          messageData.content = `After examining the corpse ${controlledToken.name} realise there is nothing to loot from ${targetedToken.name}.`;
          ChatMessage.create(messageData);
          return;
        }

        matchedItems[0].description = ""; //remove the boolean present in the description which describes if the entry is a beast that doesn't normally have loot

        matchedItems[0].roll({ async: false }).then((result) => {
          let rollMap = LootingHelpers.formatLootRoll(result.results[0].text);
          let lootMessageList = "";

          currencyFlavors.forEach((currency) => {
            if (!rollMap.has(currency)) return;

            let roll = new Roll(rollMap.get(currency));
            let rollResult = roll.roll({ async: false });
            lootMessageList += `<li>${rollResult.total} ${currency}</li>`;
            if (SETTINGS.autoAddItems) {
              LootingHelpers.updateActorCurrency(controlActor, currency, rollResult.total);
            }
          });

          let messageDataList = { content: "", whisper: {} };
          if (SETTINGS.gmOnly) {
            messageDataList.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
          }
          messageDataList.content = `<h3>Looting</h3>After examining the corpse ${controlledToken.name} loot from ${targetedToken.name}:<ul>${lootMessageList}</ul>`;

          ChatMessage.create(messageDataList);
        });
      }
    }

    item.setFlag(CONSTANTS.MODULE_ID, "targetId", "");
    harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, lootAction.name);

    Logger.debug(
      `LootingHelpers | Harvesting '${controlledToken.name}' attempted to looting resources from '${targetedToken.name}'.`
    );
  }

  static async handlePostRollLootAction(options) {
    // NOTHING FOR NOW ???
    /*
    Logger.debug(`LootingHelpers | START handlePostRollHarvestAction`);
    const { actor, item, roll } = options;
    if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
      Logger.debug(`LootingHelpers | NO '${CONSTANTS.SOURCE_REFERENCE_MODULE}' found it on item`, item);
      return;
    }
    let targetedToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`)) ?? game.user.targets.first();
    let targetedActor = await game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
    let controlledToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ?? canvas.tokens.controlled[0];

    if (!targetedToken) {
      Logger.warn(`LootingHelpers | NO targeted token is been found`, true);
      return;
    }

    if (!controlledToken) {
      Logger.warn(`LootingHelpers | NO controlled token is been found`, true);
      return;
    }

    if (!validateAction(controlledToken, targetedToken, item.name)) {
      Logger.warn(`LootingHelpers | NO valid action is been found`, true);
      return false;
    }

    let result = roll;
    let lootMessage = "";
    let successArr = [];

    let matchedItems = [];

    // TODO ? harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, lootAction.name);

    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables && item.name === harvestAction.name) {
      Logger.debug(`LootingHelpers | BRT is enable, and has a rollTable`);
      matchedItems = await retrieveItemsLootWithBetterRollTables(
        targetedActor,
        item.name,
        result.total,
        getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`)
      );

      matchedItems.forEach((item) => {
        Logger.debug(`HarvestingHelpers | BRT check matchedItem`, item);
        if (item.type === "loot") {
          lootMessage += `<li>@UUID[${item.uuid}]</li>`;
          Logger.debug(`LootingHelpers | BRT the item ${item.name} is been added as success`);
          successArr.push(item);
        } else {
          Logger.warn(`LootingHelpers | BRT the type item is not 'loot'`);
        }
        Logger.debug(`LootingHelpers | BRT successArr`, successArr);
      });
    } else {
      matchedItems = await searchCompendium(targetedActor, item.name);
      if (matchedItems[0].compendium.metadata.id === CONSTANTS.customCompendiumId) {
        matchedItems = matchedItems[0].items;
      }
      matchedItems.forEach((item) => {
        Logger.debug(`LootingHelpers | STANDARD check matchedItem`, item);
        if (item.type === "loot") {
          let itemDC = 0;
          if (item.compendium.metadata.id === CONSTANTS.harvestCompendiumId) {
            itemDC = parseInt(item.system.description.chat);
          } else {
            itemDC = retrieveItemSourceLabelDC(item);
          }
          if (itemDC <= result.total) {
            lootMessage += `<li>@UUID[${item.uuid}]</li>`;
            Logger.debug(`LootingHelpers | STANDARD the item ${item.name} is been added as success`);
            successArr.push(item.toObject());
          }
        } else {
          Logger.warn(`LootingHelpers | STANDARD the type item is not 'loot'`);
        }
        Logger.debug(`LootingHelpers | STANDARD successArr`, successArr);
      });
    }

    if (SETTINGS.autoAddItems && successArr?.length > 0) {
      Logger.debug(`LootingHelpers | FINAL autoAddItems enable and successArr is not empty`);
      await addItemsToActor(controlledToken.actor, successArr);
    } else {
      Logger.debug(`LootingHelpers | FINAL autoAddItems is ${SETTINGS.autoAddItems ? "enable" : "disable"}`);
      Logger.debug(`LootingHelpers | FINAL successArr is empty`);
      Logger.debug(
        `LootingHelpers | FINAL After examining the corpse ${controlledToken.name} realise there is nothing to loot from ${targetedToken.name}.`
      );
      lootMessage = `After examining the corpse ${controlledToken.name} realise there is nothing to loot from ${targetedToken.name}.`;
    }

    let messageData = { content: "", whisper: {} };
    if (SETTINGS.gmOnly) {
      messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
    }
    if (lootMessage) {
      messageData.content = `<h3>Harvesting</h3>${lootMessage}</ul>`;
    }

    ChatMessage.create(messageData);

    */
    return false;
  }

  static formatLootRoll(result) {
    let rollTableResult = result.replace(/(\[\[\/r\s)?(\]\])?(\}$)?/g, "").split("}");
    let returnMap = new Map();

    for (let i = 0; i < rollTableResult.length; i++) {
      let extractedRoll = rollTableResult[i].split("{");
      returnMap.set(extractedRoll[1], extractedRoll[0]);
    }
    return returnMap;
  }

  static updateActorCurrency(actor, currencyLabel, toAdd) {
    let currencyRef = CONSTANTS.currencyMap.get(currencyLabel);
    let total = actor.system.currency[currencyRef] + toAdd;
    actor.update({
      system: {
        currency: {
          [currencyRef]: total,
        },
      },
    });
    Logger.log(`Added ${toAdd} ${currencyLabel} to: ${actor.name}`);
  }
}
