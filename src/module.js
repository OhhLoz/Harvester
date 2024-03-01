import { registerSettings, SETTINGS } from "./scripts/settings.js";
import { CONSTANTS } from "./scripts/constants.js";
import { RequestorHelpers } from "./scripts/requestor-helpers.js";
import API from "./scripts/api.js";
import { checkItemSourceLabel, retrieveItemSourceLabelDC, retrieveItemSourceLabel } from "./scripts/lib/lib.js";
import Logger from "./scripts/lib/Logger.js";
import { HarvestingHelpers } from "./scripts/lib/harvesting-helpers.js";
import { LootingHelpers } from "./scripts/lib/looting-helpers.js";

export let actionCompendium;
export let harvestCompendium;
export let lootCompendium;
export let customCompendium;
export let customLootCompendium;
export let harvestBetterRollCompendium;
export let harvestAction;
export let lootAction;
export let harvesterAndLootingSocket;
export let currencyFlavors;
export let hasBetterRollTables;

Hooks.on("init", function () {
  registerSettings();
  Logger.log("Init() - Registered settings & Fetched compendiums.");
});

Hooks.once("setup", function () {
  game.modules.get(CONSTANTS.MODULE_ID).api = API;
});

Hooks.on("ready", async function () {
  actionCompendium = await game.packs.get(CONSTANTS.actionCompendiumId).getDocuments();
  harvestCompendium = await game.packs.get(CONSTANTS.harvestCompendiumId).getDocuments();
  lootCompendium = await game.packs.get(CONSTANTS.lootCompendiumId).getDocuments();
  customCompendium = await game.packs.get(CONSTANTS.customCompendiumId).getDocuments();
  customLootCompendium = await game.packs.get(CONSTANTS.customLootCompendiumId).getDocuments();
  hasBetterRollTables = await game.modules.get("better-rolltables")?.active;
  if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
    harvestBetterRollCompendium = await game.packs.get(CONSTANTS.betterRollTableId).getDocuments();
  }

  harvestAction = await actionCompendium.find((a) => a.id === CONSTANTS.harvestActionId);
  lootAction = await actionCompendium.find((a) => a.id === CONSTANTS.lootActionId);

  currencyFlavors = Array.from(CONSTANTS.currencyMap.keys());

  if (game.user?.isGM && !game.modules.get("socketlib")?.active)
    Logger.errorPermanent("socketlib must be installed & enabled for harvester to function correctly.", {
      permanent: true,
    });

  if (game.users.activeGM?.id !== game.user.id) {
    return;
  }
  await addActionToActors();
});

Hooks.once("socketlib.ready", () => {
  harvesterAndLootingSocket = globalThis.socketlib.registerModule(CONSTANTS.MODULE_ID);
  harvesterAndLootingSocket.register("addEffect", addEffect);
  Logger.log("Registered socketlib functions");
});

Hooks.on("createActor", async (actor, data, options, id) => {
  if (SETTINGS.autoAddActionGroup !== "None") {
    if (SETTINGS.autoAddActionGroup === "PCOnly" && actor.type === "npc") {
      return;
    }
    await addItemsToActor(actor, [harvestAction]);
    if (!SETTINGS.disableLoot) {
      await addItemsToActor(actor, [lootAction]);
    }
  }
});

Hooks.on("dnd5e.preUseItem", function (item, config, options) {
  if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
    return;
  }
  if (game.user.targets.size !== 1) {
    ui.notifications.warn("Please target only one token.");
    return false;
  }

  let targetedToken = game.user.targets.first();
  let controlToken = item.parent.getActiveTokens()[0];

  if (!validateAction(controlToken, targetedToken, item.name)) {
    return false;
  }
  item.setFlag(CONSTANTS.MODULE_ID, "targetId", targetedToken.id);
  item.setFlag(CONSTANTS.MODULE_ID, "controlId", controlToken.id);
});

Hooks.on("dnd5e.useItem", function (item, config, options) {
  if (!checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
    return;
  }
  if (item.name === harvestAction.name) {
    HarvestingHelpers.handlePreRollHarvestAction({ item: item });
  }
  if (item.name === lootAction.name && !SETTINGS.disableLoot) {
    LootingHelpers.handlePreRollLootAction({ item: item });
  }
});

Hooks.on("dnd5e.preDisplayCard", function (item, chatData, options) {
  if (checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
    options.createMessage = false;
  }
});

// Hooks.on("dnd5e.displayCard", function (item, card) {
//   if (checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
//     card = undefined;
//   }
// });

export function validateAction(controlToken, targetedToken, actionName) {
  let measuredDistance = canvas.grid.measureDistance(controlToken.center, targetedToken.center);
  let targetSize = CONSTANTS.sizeHashMap.get(targetedToken.actor.system.traits.size);
  if (measuredDistance > targetSize && SETTINGS.enforceRange) {
    ui.notifications.warn("You must be in range to " + actionName);
    return false;
  }

  let actor = null;
  if (!isEmptyObject(targetedToken.document.delta?.system)) actor = targetedToken.document.delta;
  else if (!isEmptyObject(targetedToken.document.actor)) actor = targetedToken.document.actor;
  else if (targetedToken.document.actorId) actor = game.actors.get(targetedToken.document.actorId);

  if (!actor) {
    ui.notifications.warn(targetedToken.name + " has not data to retrieve");
    return false;
  }
  if (actor.system.attributes.hp.value !== 0) {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return false;
  }
  if (!checkEffect(targetedToken, "Dead") && SETTINGS.requireDeadEffect) {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return false;
  }
  if (targetedToken.document.hasPlayerOwner && SETTINGS.npcOnlyHarvest) {
    ui.notifications.warn(targetedToken.name + " is not an NPC");
    return false;
  }
  if (checkEffect(targetedToken, `${actionName}ed`)) {
    ui.notifications.warn(`${targetedToken.name} has been ${actionName.toLowerCase()}ed already`);
    return false;
  }
  return true;
}

export function searchCompendium(actor, actionName) {
  let returnArr = [];
  let actorName = actor.name;
  if (actorName.includes("Dragon")) {
    actorName = formatDragon(actorName);
  }
  if (actionName === harvestAction.name) {
    returnArr = checkCompendium(customCompendium, "name", actor.name);

    if (returnArr.length !== 0) return returnArr;

    returnArr = checkCompendium(harvestCompendium, "system.source.label", actorName);
  } else if (actionName === lootAction.name && !SETTINGS.disableLoot) {
    returnArr = checkCompendium(customLootCompendium, "name", actor.name);

    if (returnArr.length !== 0) {
      return returnArr;
    }
    returnArr = checkCompendium(lootCompendium, "name", actorName);
  }

  return returnArr;
}

export function checkCompendium(compendium, checkProperty, matchProperty) {
  let returnArr = [];
  compendium.forEach((doc) => {
    if (eval(`doc.${checkProperty}`) === matchProperty) {
      returnArr.push(doc);
    }
  });
  return returnArr;
}

async function addActionToActors() {
  if (SETTINGS.autoAddActionGroup === "None") {
    return;
  }
  game.actors.forEach(async (actor) => {
    if (SETTINGS.autoAddActionGroup === "PCOnly" && actor.type === "npc") {
      return;
    }
    let hasHarvest = false;
    let hasLoot = false;

    actor.items.forEach((item) => {
      if (item.name === harvestAction.name && checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
        hasHarvest = true;
        resetToDefault(item);
      }
      if (item.name === lootAction.name && checkItemSourceLabel(item, CONSTANTS.SOURCE_REFERENCE_MODULE)) {
        hasLoot = true;
        resetToDefault(item);
        if (SETTINGS.disableLoot) {
          actor.deleteEmbeddedDocuments("Item", [item.id]);
        }
      }
    });

    if (!hasHarvest) {
      await addItemsToActor(actor, [harvestAction]);
    }
    if (!hasLoot && !SETTINGS.disableLoot) {
      await addItemsToActor(actor, [lootAction]);
    }
  });
  Logger.log("harvester | ready() - Added Actions to All Actors specified in Settings");
}

function checkEffect(token, effectName) {
  let returnBool = false;
  token.document.delta?.effects?.forEach((element) => {
    if (element.name === effectName) returnBool = true;
  });
  return returnBool;
}

function formatDragon(actorName) {
  let actorSplit = actorName.split(" ");
  CONSTANTS.dragonIgnoreArr.forEach((element) => {
    actorSplit = actorSplit.filter((e) => e !== element);
  });

  actorSplit = actorSplit.join(" ");
  return actorSplit;
}

function resetToDefault(item) {
  let actionDescription = `Harvest valuable materials from corpses.`;
  if (item.name === lootAction.name) actionDescription = `Scavenge valuables from corpses.`;
  item.update({
    flags: { harvester: { targetId: "", controlId: "" } },
    system: { formula: "", description: { value: actionDescription } },
  });
}

export function addEffect(targetTokenId, actionName) {
  let targetToken = canvas.tokens.get(targetTokenId);
  if (actionName === harvestAction.name) {
    targetToken.document.toggleActiveEffect(
      {
        id: CONSTANTS.harvestActionEffectId,
        icon: CONSTANTS.harvestActionEffectIcon,
        name: CONSTANTS.harvestActionEffectName,
      },
      { active: true }
    );
  } else if (actionName === lootAction.name && !SETTINGS.disableLoot) {
    targetToken.document.toggleActiveEffect(
      { id: CONSTANTS.lootActionEffectId, icon: CONSTANTS.lootActionEffectIcon, name: CONSTANTS.lootActionEffectName },
      { active: true }
    );
  }
  Logger.log(`Added ${actionName.toLowerCase()}ed effect to: ${targetToken.name}`);
}

export async function addItemsToActor(actor, itemsToAdd) {
  for (const item of itemsToAdd) {
    await _createItem(item, actor);
  }
}
export async function addItemsToActorWithItemPiles(targetedToken, itemsToAdd) {
  game.itempiles.API.addItems(targetedToken, itemsToAdd, {
    mergeSimilarItems: true,
  });
  Logger.log(`Added ${itemsToAdd.length} items to ${targetedToken.name}`);
}

function isEmptyObject(obj) {
  // because Object.keys(new Date()).length === 0;
  // we have to do some additional check
  if (obj === null || obj === undefined) {
    return true;
  }
  if (isRealNumber(obj)) {
    return false;
  }
  const result =
    obj && // null and undefined check
    Object.keys(obj).length === 0; // || Object.getPrototypeOf(obj) === Object.prototype);
  return result;
}

function isRealNumber(inNumber) {
  return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
}

/**
 *
 * @param {Item}  item The item to add to the actor
 * @param {Actor} actor to which to add items to
 * @param {boolean} stackSame if true add quantity to an existing item of same name in the current actor
 * @param {number} customLimit
 * @returns {Item} the create/updated Item
 */
async function _createItem(item, actor, stackSame = true, customLimit = 0) {
  const QUANTITY_PROPERTY_PATH = "system.quantity";
  const WEIGHT_PROPERTY_PATH = "system.weight";
  const PRICE_PROPERTY_PATH = "system.price";

  const newItemData = item;
  const itemPrice = getProperty(newItemData, PRICE_PROPERTY_PATH) || 0;
  const embeddedItems = [...actor.getEmbeddedCollection("Item").values()];
  // Name should be enough for a check for the same item right ?
  const originalItem = embeddedItems.find((i) => i.name === newItemData.name);

  /** if the item is already owned by the actor (same name and same PRICE) */
  if (originalItem && stackSame) {
    /** add quantity to existing item */

    const stackAttribute = QUANTITY_PROPERTY_PATH;
    const priceAttribute = PRICE_PROPERTY_PATH;
    const weightAttribute = WEIGHT_PROPERTY_PATH;

    const newItemQty = getProperty(newItemData, stackAttribute) || 1;
    const originalQty = getProperty(originalItem, stackAttribute) || 1;
    const updateItem = { _id: originalItem.id };
    const newQty = Number(originalQty) + Number(newItemQty);
    if (customLimit > 0) {
      // limit is bigger or equal to newQty
      if (Number(customLimit) < Number(newQty)) {
        //limit was reached, we stick to that limit
        ui.notifications.warn("Custom limit is been reached for the item '" + item.name + "'");
        return customLimit;
      }
    }
    // If quantity differ updated the item
    if (newQty !== newItemQty) {
      setProperty(updateItem, stackAttribute, newQty);

      const newPriceValue =
        (getProperty(originalItem, priceAttribute)?.value ?? 0) +
        (getProperty(newItemData, priceAttribute)?.value ?? 0);
      const newPrice = {
        denomination: getProperty(item, priceAttribute)?.denomination,
        value: newPriceValue,
      };
      setProperty(updateItem, `${priceAttribute}`, newPrice);

      const newWeight =
        (getProperty(originalItem, weightAttribute) ?? 1) + (getProperty(newItemData, weightAttribute) ?? 1);
      setProperty(updateItem, `${weightAttribute}`, newWeight);

      await actor.updateEmbeddedDocuments("Item", [updateItem]);
      Logger.log(`Updated ${item.name} to ${actor.name}`);
    } else {
      Logger.log(`Nothing is done with ${item.name} on ${actor.name}`);
    }
  } else {
    /** we create a new item if we don't own already */
    await actor.createEmbeddedDocuments("Item", [newItemData]);
    Logger.log(`Added ${item.name} to ${actor.name}`);
  }
}
