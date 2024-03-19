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
import { checkItemSourceLabel, retrieveItemSourceLabelDC, retrieveItemSourceLabel, formatDragon } from "./lib.js";

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
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ?? canvas.tokens.controlled[0];
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
      matchedItems = HarvestingHelpers.retrieveTablesHarvestWithBetterRollTables(
        actorName,
        harvestAction.name || item.name
      );
      Logger.debug(`HarvestingHelpers | Found MatchedItems with BRT (${matchedItems?.length})`, matchedItems);
    } else {
      Logger.debug(`HarvestingHelpers | Searching MatchedItems with STANDARD`);
      matchedItems = searchCompendium(actorName, harvestAction.name || item.name);
      Logger.debug(`HarvestingHelpers | Found MatchedItems with STANDARD (${matchedItems?.length})`, matchedItems);
    }

    let skillDenomination = getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`); // TODO make this better
    let skillCheck = "Nature"; // TODO make this better
    if (matchedItems.length === 0) {
      Logger.debug(`HarvestingHelpers | MatchedItems is empty`);
      Logger.debug(
        `HarvestingHelpers | '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}' but failed to find anything for this creature.`
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
            CONSTANTS.harvestCompendiumId
          );
          skillCheckVerbose = matchedItems[0].items.find((element) => element.type === "feat").name;
        }
        skillCheck = CONSTANTS.skillMap.get(skillCheckVerbose);
      }

      item.setFlag(CONSTANTS.MODULE_ID, "skillCheck", skillCheck);
      item.update({ system: { formula: `1d20 + @skills.${skillCheck}.total` } });

      Logger.debug(
        `HarvestingHelpers | Harvesting '${controlledToken.name}' attempted to harvest resources from '${targetedToken.name}'.`
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
        }
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
      canvas.tokens.get(getProperty(item, `flags.${CONSTANTS.MODULE_ID}.controlId`)) ?? canvas.tokens.controlled[0];

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
      matchedItems = await HarvestingHelpers.retrieveItemsHarvestWithBetterRollTables(
        actorName,
        item.name,
        result.total,
        getProperty(item, `flags.${CONSTANTS.MODULE_ID}.skillCheck`)
      );

      matchedItems.forEach((item) => {
        Logger.debug(`HarvestingHelpers | BRT check matchedItem`, item);
        // if (item.type === "loot") {
        harvesterMessage += `<li>@UUID[${item.uuid}]</li>`;
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
          harvesterMessage += `<li>@UUID[${item.uuid}]</li>`;
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
      await addItemsToActor(controlledToken.actor, successArr);
    } else {
      Logger.debug(`HarvestingHelpers | FINAL autoAddItems is ${SETTINGS.autoAddItems ? "enable" : "disable"}`);
      Logger.debug(`HarvestingHelpers | FINAL successArr is empty ? ${successArr?.length > 0 ? "false" : "true"}`);
      Logger.debug(
        `HarvestingHelpers | FINAL After examining the corpse ${controlledToken.name} realise there is nothing to harvest from ${targetedToken.name}.`
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

  static retrieveTablesHarvestWithBetterRollTables(actorName, actionName) {
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
        Logger.warn(
          `retrieveTablesHarvestWithBetterRollTables | BRT No rolltable found for metadata sourceId '${sourceValue}'`,
          true
        );
        return [];
      }
      return tablesChecked;
    } else {
      Logger.warn(
        `retrieveTablesHarvestWithBetterRollTables | BRT No rolltable found for action '${harvestAction.name}'`,
        true
      );
      return [];
    }
  }

  static async retrieveItemsHarvestWithBetterRollTables(actorName, actionName, dcValue = null, skillDenom = null) {
    let returnArr = [];
    if (actionName === harvestAction.name) {
      if (!dcValue) {
        dcValue = 0;
      }
      if (!skillDenom) {
        skillDenom = "";
      }

      const tablesChecked = HarvestingHelpers.retrieveTablesHarvestWithBetterRollTables(actorName, actionName);
      if (!tablesChecked || tablesChecked.length === 0) {
        Logger.warn(
          `retrieveItemsHarvestWithBetterRollTables | BRT No rolltable found for action '${actionName}'`,
          true
        );
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
        Logger.warn(
          `retrieveItemsHarvestWithBetterRollTables | BRT No rolltable found for action '${actionName}'`,
          true
        );
        return returnArr;
      }

      returnArr = checkCompendium(lootCompendium, "name", actorName);
    }

    return returnArr ?? [];
  }
}
