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
import { checkItemSourceLabel, retrieveItemSourceLabelDC, retrieveItemSourceLabel } from "./lib.js";

export class HarvestingHelpers {
  static async handlePreRollHarvestAction(options) {
    const { item } = options;
    if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
      return;
    }
    let targetedToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`)) ?? game.user.targets.first();
    let targetedActor = game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
    let controlledToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ?? canvas.tokens.controlled[0];
    let controlActor = game.actors.get(controlledToken.actor?.id ?? controlledToken.document?.actorId);

    let matchedItems = [];
    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
      matchedItems = HarvestingHelpers.retrieveTablesHarvestWithBetterRollTables(
        targetedActor,
        harvestAction.name || item.name
      );
    } else {
      matchedItems = searchCompendium(targetedActor, harvestAction.name || item.name);
    }

    let skillDenomination = getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`); // TODO make this better
    let skillCheck = "Nature"; // TODO make this better
    if (matchedItems.length === 0) {
      RequestorHelpers.requestEmptyMessage(controlledToken.actor, undefined, {
        chatTitle: "Harvesting valuable from corpses.",
        chatDescription: `<h3>Looting</h3><ul>'${controlledToken.name}' attempted to loot resources from '${targetedToken.name}' but failed to find anything for this creature.`,
        chatButtonLabel: undefined,
        chatWhisper: undefined,
        chatSpeaker: undefined,
        chatImg: "icons/skills/social/theft-pickpocket-bribery-brown.webp",
      });
    } else {
      let skillCheckVerbose;

      let harvestMessage = targetedToken.name;
      if (harvestMessage !== targetedActor.name) {
        harvestMessage += ` (${targetedActor.name})`;
      }
      if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
        skillCheckVerbose = getProperty(matchedItems[0], `flags.better-rolltables.brt-skill-value`);
        skillCheck = skillCheckVerbose;
      } else {
        if (matchedItems[0].compendium.metadata.id === CONSTANTS.harvestCompendiumId) {
          skillCheckVerbose = matchedItems[0]?.system.description.unidentified;
        } else {
          skillCheckVerbose = matchedItems[0].items.find((element) => element.type === "feat").name;
        }
        skillCheck = CONSTANTS.skillMap.get(skillCheckVerbose);
      }

      item.setFlag(CONSTANTS.MODULE_ID, "skillCheck", skillCheck);
      item.update({ system: { formula: `1d20 + @skills.${skillCheck}.total` } });

      RequestorHelpers.requestRollSkill(
        controlledToken.actor,
        undefined,
        {
          chatTitle: `Harvesting Skill Check (${skillDenomination})`,
          chatDescription: `<h3>Harvesting</h3><ul>'${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`,
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
        }
      );
    }

    item.setFlag(CONSTANTS.MODULE_ID, "targetId", "");
    // harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);
  }

  static async handlePostRollHarvestAction(options) {
    const { actor, item, roll } = options;
    if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
      return;
    }
    let targetedToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.targetId`)) ?? game.user.targets.first();
    let targetedActor = await game.actors.get(targetedToken.actor?.id ?? targetedToken.document?.actorId);
    let controlledToken =
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ?? canvas.tokens.controlled[0];

    if (!validateAction(controlledToken, targetedToken, item.name)) {
      return false;
    }

    let result = roll;
    let harvesterMessage = "";
    let successArr = [];
    let messageData = { content: "", whisper: {} };
    if (SETTINGS.gmOnly) {
      messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
    }

    let matchedItems = [];

    harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);

    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables && item.name === harvestAction.name) {
      matchedItems = await HarvestingHelpers.retrieveItemsHarvestWithBetterRollTables(
        targetedActor,
        item.name,
        result.total,
        getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`)
      );

      matchedItems.forEach((item) => {
        if (item.type === "loot") {
          harvesterMessage += `<li>@UUID[${item.uuid}]</li>`;
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
            itemDC = retrieveItemSourceLabelDC(item);
          }
          if (itemDC <= result.total) {
            harvesterMessage += `<li>@UUID[${item.uuid}]</li>`;
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
      harvesterMessage = `After examining the corpse you realise there is nothing you can harvest.`;
    }

    if (harvesterMessage) {
      messageData.content = `<h3>Harvesting</h3><ul>${harvesterMessage}</ul>`;
    }

    ChatMessage.create(messageData);

    return false;
  }

  static retrieveTablesHarvestWithBetterRollTables(targetedActor, actionName) {
    let actorName = targetedActor.name;
    if (actorName.includes("Dragon")) {
      actorName = formatDragon(actorName);
    }
    if (actionName === harvestAction.name) {
      // const dcValue = getProperty(xxx, `system.description.chat`);
      // const skillValue = getProperty(xxx, `system.description.unidentified`);
      const sourceValue = actorName ?? ""; // getProperty(xxx, `system.source`);
      // let compendium = game.packs.get(betterRollTableId);
      // const docs = compendium.contents;
      const docs = harvestBetterRollCompendium;
      let tablesChecked = [];
      // Try with the compendium first
      for (const doc of docs) {
        if (sourceValue.trim() === getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim()) {
          tablesChecked.push(doc);
        }
      }
      // Try on the tables imported
      if (!tablesChecked || tablesChecked.length === 0) {
        tablesChecked = game.tables.contents.filter((doc) => {
          return sourceValue.trim() === getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim();
        });
      }
      // We juts get the first
      if (!tablesChecked || tablesChecked.length === 0) {
        Logger.warn(`No rolltable found for metadata sourceId '${sourceValue}'`, true);
        return [];
      }
      return tablesChecked;
    } else {
      return [];
    }
  }

  static async retrieveItemsHarvestWithBetterRollTables(targetedActor, actionName, dcValue = null, skillDenom = null) {
    let returnArr = [];
    if (actionName === harvestAction.name) {
      if (!dcValue) {
        dcValue = 0;
      }
      if (!skillDenom) {
        skillDenom = "";
      }

      const tablesChecked = HarvestingHelpers.retrieveTablesHarvestWithBetterRollTables(targetedActor, actionName);
      if (!tablesChecked || tablesChecked.length === 0) {
        return [];
      }
      const tableHarvester = tablesChecked[0];
      returnArr = await game.modules.get("better-rolltables").api.retrieveItemsDataFromRollTableResultSpecialHarvester({
        table: tableHarvester,
        options: {
          rollMode: "gmroll",
          dc: dcValue,
          skill: skillDenom,
        },
      });
    } else if (actionName === lootAction.name && !SETTINGS.disableLoot) {
      // TODO A INTEGRATION WITH THE LOOT TYPE TABLE
      returnArr = checkCompendium(customLootCompendium, "name", actor.name);

      if (returnArr.length !== 0) {
        return returnArr;
      }

      returnArr = checkCompendium(lootCompendium, "name", actorName);
    }

    return returnArr ?? [];
  }
}
