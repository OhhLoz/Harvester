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
  addItemsToActorWithItemPiles,
  addItemsToActor,
} from "../../module.js";
import { CONSTANTS } from "../constants.js";
import { RequestorHelpers } from "../requestor-helpers.js";
import { SETTINGS } from "../settings.js";
import Logger from "./Logger.js";
import { checkItemSourceLabel } from "./lib.js";

export class LootingHelpers {
  static async handlePreRollLootAction(options) {
    const { item } = options;
    if (!checkItemSourceLabel(item, "Harvester")) {
      return;
    }
    let targetedToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`)) ?? game.user.targets.first();
    let targetedActor = game.actors.get(targetedToken.document.actorId);
    let controlledToken = canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`));
    let controlActor = game.actors.get(controlledToken.document.actorId);

    let matchedItems = [];
    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
      // TODO
      //matchedItems = retrieveTablesLootWithBetterRollTables(targetedActor, lootAction.name || item.name);
      matchedItems = searchCompendium(targetedActor, lootAction.name || item.name);
    } else {
      matchedItems = searchCompendium(targetedActor, lootAction.name || item.name);
    }

    if (matchedItems.length === 0) {
      RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, {
        chatTitle: "Looting valuable from corpses.",
        chatDescription: `<h3>Looting</h3><ul>'${controlledToken.name}' attempted to loot resources from '${targetedToken.name}' but failed to find anything for this creature.`,
        chatButtonLabel: undefined,
        chatWhisper: undefined,
        chatSpeaker: undefined,
        chatImg: "icons/skills/social/theft-pickpocket-bribery-brown.webp",
      });
    } else {
      let normalLoot = matchedItems[0].description;
      if (normalLoot === "false" && !SETTINGS.lootBeasts) {
        ChatMessage.create(messageData);
        return;
      }

      matchedItems[0].description = ""; //remove the boolean present in the description which describes if the entry is a beast that doesn't normally have loot

      matchedItems[0].roll({ async: false }).then((result) => {
        let rollMap = LootingHelpers.formatLootRoll(result.results[0].text);
        let lootMessage = "";

        currencyFlavors.forEach((currency) => {
          if (!rollMap.has(currency)) return;

          let roll = new Roll(rollMap.get(currency));
          let rollResult = roll.roll({ async: false });
          lootMessage += `<li>${rollResult.total} ${currency}</li>`;
          if (SETTINGS.autoAddItems) {
            LootingHelpers.updateActorCurrency(controlActor, currency, rollResult.total);
          }
        });

        let messageData = { content: "", whisper: {} };
        if (SETTINGS.gmOnly) {
          messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
        }
        messageData.content = `<h3>Looting</h3>After examining the corpse you find:<ul>${lootMessage}</ul>`;

        ChatMessage.create(messageData);
      });
    }

    item.setFlag(CONSTANTS.MODULE_ID, "targetId", "");
    harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, lootAction.name);
  }
  /*
  static async handlePostRollLootAction(options) {
    const { actor, item, roll } = options;
    if (!checkItemSourceLabel(item, "Harvester")) {
      return;
    }
    let targetedToken = canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`));
    let targetedActor = await game.actors.get(targetedToken.document.actorId);
    let controlledToken = canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`));

    if (!validateAction(controlledToken, targetedToken, item.name)) {
      return false;
    }

    let result = roll;
    let lootMessage = "";
    let successArr = [];
    let messageData = { content: "", whisper: {} };
    if (SETTINGS.gmOnly) {
      messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
    }

    let matchedItems = [];

    // harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, lootAction.name);

    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables && item.name === harvestAction.name) {
      matchedItems = await retrieveItemsLootWithBetterRollTables(
        targetedActor,
        item.name,
        result.total,
        getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`)
      );

      matchedItems.forEach((item) => {
        if (item.type === "loot") {
          lootMessage += `<li>@UUID[${item.uuid}]</li>`;
          successArr.push(item);
        }
      });
    } else {
      matchedItems = await searchCompendium(targetedActor, item.name);

      if (matchedItems[0].compendium.metadata.id === CONSTANTS.customCompendiumId) {
        matchedItems = matchedItems[0].items;
      }
      matchedItems.forEach((item) => {
        if (item.type === "loot") {
          let itemDC = 0;
          if (item.compendium.metadata.id === CONSTANTS.harvestCompendiumId) {
            itemDC = parseInt(item.system.description.chat);
          } else {
            itemDC = retrieveItemSourceLabelDC(item); //item.system.source.label.match(/\d+/g)[0];
          }
          if (itemDC <= result.total) {
            lootMessage += `<li>@UUID[${item.uuid}]</li>`;
            successArr.push(item.toObject());
          }
        }
      });
    }

    if (SETTINGS.autoAddItems && successArr?.length > 0) {
      if (SETTINGS.autoAddItemPiles && game.modules.get("item-piles")?.active) {
        await addItemsToActorWithItemPiles(controlledToken.actor, successArr);
      } else {
        await addItemsToActor(controlledToken.actor, successArr);
      }
    } else {
      lootMessage = `After examining the corpse you realise there is nothing you can looting.`;
    }

    if (lootMessage) {
      messageData.content = `<h3>Harvesting</h3><ul>${lootMessage}</ul>`;
    }

    ChatMessage.create(messageData);

    return false;
  }
  */
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
