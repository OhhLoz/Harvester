import {
  retrieveTablesHarvestWithBetterRollTables,
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
} from "../../module";
import { CONSTANTS } from "../constants";
import { RequestorHelpers } from "../requestor-helpers";
import { SETTINGS } from "../settings";
import Logger from "./Logger";
import { checkItemSourceLabel } from "./lib";

export class HarvestingHelpers {
  static async handlePreRollHarvestAction(options) {
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
      matchedItems = retrieveTablesHarvestWithBetterRollTables(targetedActor, harvestAction.name || item.name);
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
    harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);
  }

  static async handlePostRollHarvestAction(options) {
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
    let harvesterMessage = "";
    let successArr = [];
    let messageData = { content: "", whisper: {} };
    if (SETTINGS.gmOnly) {
      messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
    }

    let matchedItems = [];
    // item.setFlag(CONSTANTS.MODULE_ID, "targetId", "");
    // harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, harvestAction.name);

    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables && item.name === harvestAction.name) {
      matchedItems = await retrieveItemsHarvestWithBetterRollTables(
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
            itemDC = retrieveItemSourceLabelDC(item); //item.system.source.label.match(/\d+/g)[0];
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
}
