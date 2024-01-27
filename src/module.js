import { registerSettings, SETTINGS } from "./scripts/settings.js";
import { CONSTANTS } from "./scripts/constants.js";

var actionCompendium,
  harvestCompendium,
  lootCompendium,
  customCompendium,
  customLootCompendium,
  harvestBetterRollCompendium,
  harvestAction,
  lootAction,
  harvesterAndLootingSocket,
  currencyFlavors,
  hasBetterRollTables;

Hooks.on("init", function () {
  registerSettings();
  console.log("harvester | Init() - Registered settings & Fetched compendiums.");
});

Hooks.on("ready", async function () {
  actionCompendium = await game.packs.get(CONSTANTS.actionCompendiumId).getDocuments();
  harvestCompendium = await game.packs.get(CONSTANTS.harvestCompendiumId).getDocuments();
  lootCompendium = await game.packs.get(CONSTANTS.lootCompendiumId).getDocuments();
  customCompendium = await game.packs.get(CONSTANTS.customCompendiumId).getDocuments();
  customLootCompendium = await game.packs.get(CONSTANTS.customLootCompendiumId).getDocuments();
  hasBetterRollTables = await game.modules.get("better-rolltables")?.active;
  if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables)
    harvestBetterRollCompendium = await game.packs.get(CONSTANTS.betterRollTableId).getDocuments();

  harvestAction = await actionCompendium.find((a) => a.id == CONSTANTS.harvestActionId);
  lootAction = await actionCompendium.find((a) => a.id == CONSTANTS.lootActionId);

  currencyFlavors = Array.from(CONSTANTS.currencyMap.keys());

  if (game.user?.isGM && !game.modules.get("socketlib")?.active)
    ui.notifications.error("socketlib must be installed & enabled for harvester to function correctly.", {
      permanent: true,
    });

  if (game.users.activeGM?.id !== game.user.id) return;
  await addActionToActors();
});

Hooks.once("socketlib.ready", () => {
  harvesterAndLootingSocket = globalThis.socketlib.registerModule("harvester");
  harvesterAndLootingSocket.register("addEffect", addEffect);
  console.log("harvester | Registered socketlib functions");
});

Hooks.on("createActor", async (actor, data, options, id) => {
  if (SETTINGS.autoAddActionGroup != "None") {
    if (SETTINGS.autoAddActionGroup == "PCOnly" && actor.type == "npc") return;

    await addItemToActor(actor, [harvestAction]);
    if (!SETTINGS.disableLoot) await addItemToActor(actor, [lootAction]);
  }
});

Hooks.on("dnd5e.preUseItem", function (item, config, options) {
  if (item.system.source.label != "Harvester") return;

  if (game.user.targets.size != 1) {
    ui.notifications.warn("Please target only one token.");
    return false;
  }

  var targetedToken = game.user.targets.first();
  var controlToken = item.parent.getActiveTokens()[0];

  if (!validateAction(controlToken, targetedToken, item.name)) return false;

  item.setFlag("harvester", "targetId", targetedToken.id);
  item.setFlag("harvester", "controlId", controlToken.id);
});

Hooks.on("dnd5e.useItem", function (item, config, options) {
  if (item.system.source.label != "Harvester" || item.name == harvestAction.name || SETTINGS.disableLoot) return;

  handleLoot(item);
});

Hooks.on("dnd5e.preDisplayCard", function (item, chatData, options) {
  if (item.system.source.label != "Harvester") return;

  var targetToken = game.user.targets.first();
  var targetActor = game.actors.get(targetToken.document.actorId);

  var matchedItems = [];
  if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables && item.name === harvestAction.name) {
    if (item.name == harvestAction.name)
      matchedItems = retrieveTablesHarvestWithBetterRollTables(targetActor, item.name);
    else matchedItems = searchCompendium(targetActor, item.name);
  } else matchedItems = searchCompendium(targetActor, item.name);

  if (item.name == lootAction.name) {
    if (matchedItems.length == 0)
      chatData.content = chatData.content.replace(
        "Scavenge valuables from corpses.",
        `After examining the corpse you realise there is nothing you can loot.`
      );
    else chatData.content = chatData.content.replace("Scavenge valuables from corpses.", `Looting ${targetToken.name}`);
    return;
  }

  if (matchedItems.length != 0) {
    var skillCheckVerbose,
      skillCheck = "Nature";
    var harvestMessage = targetToken.name;
    if (harvestMessage != targetActor.name) harvestMessage += ` (${targetActor.name})`;
    if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables) {
      skillCheckVerbose = getProperty(matchedItems[0], `flags.better-rolltables.brt-skill-value`);
      skillCheck = skillCheckVerbose;
    } else {
      if (matchedItems[0].compendium.metadata.id == CONSTANTS.harvestCompendiumId)
        skillCheckVerbose = matchedItems[0]?.system.description.unidentified;
      else skillCheckVerbose = matchedItems[0].items.find((element) => element.type == "feat").name;

      skillCheck = CONSTANTS.skillMap.get(skillCheckVerbose);
    }

    item.setFlag("harvester", "skillCheck", skillCheck);
    item.update({ system: { formula: `1d20 + @skills.${skillCheck}.total` } });
    chatData.content = chatData.content
      .replace(`<button data-action="formula">Other Formula</button>`, ``)
      .replace(
        `<div class="card-buttons">`,
        `<div class="card-buttons"><button data-action="formula">${skillCheckVerbose} Skill Check</button>`
      )
      .replace("Harvest valuable materials from corpses.", `Attempting to Harvest ${harvestMessage}`);
  } else {
    item.update({ system: { formula: "" } });
    item.setFlag("harvester", "targetId", "");
    chatData.content = chatData.content.replace(
      "Harvest valuable materials from corpses.",
      `After examining the corpse you realise there is nothing you can harvest.`
    );
    harvesterAndLootingSocket.executeAsGM(addEffect, targetToken.id, "Harvest");
  }
});

Hooks.on("dnd5e.preRollFormula", async function (item, options) {
  if (item.system.source.label != "Harvester") return;

  var targetedToken = canvas.tokens.get(item.getFlag("harvester", "targetId"));
  var targetedActor = await game.actors.get(targetedToken.document.actorId);
  var controlledToken = canvas.tokens.get(item.getFlag("harvester", "controlId"));

  if (!validateAction(controlledToken, targetedToken, item.name)) return false;

  options.chatMessage = false;

  var result = await controlledToken.actor.rollSkill(item.getFlag("harvester", "skillCheck"), {
    chooseModifier: SETTINGS.allowAbilityChange,
  });

  harvestCompendium = await game.packs.get(CONSTANTS.harvestCompendiumId).getDocuments();
  customCompendium = await game.packs.get(CONSTANTS.customCompendiumId).getDocuments();

  var lootMessage = "";
  var successArr = [];
  var messageData = { content: "", whisper: {} };
  if (SETTINGS.gmOnly) {
    messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);
  }

  var matchedItems = [];
  if (SETTINGS.enableBetterRollIntegration && hasBetterRollTables && item.name === harvestAction.name) {
    matchedItems = await retrieveItemsHarvestWithBetterRollTables(
      targetedActor,
      item.name,
      result.total,
      getProperty(item, `flags.harvester.skillCheck`)
    );

    harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, "Harvest");

    matchedItems.forEach((item) => {
      if (item.type == "loot") {
        lootMessage += `<li>@UUID[${item.uuid}]</li>`;
        successArr.push(item);
      }
    });
  } else {
    matchedItems = await searchCompendium(targetedActor, item.name);

    harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, "Harvest");

    if (matchedItems[0].compendium.metadata.id == CONSTANTS.customCompendiumId) matchedItems = matchedItems[0].items;

    matchedItems.forEach((item) => {
      if (item.type == "loot") {
        var itemDC = 0;
        if (item.compendium.metadata.id == CONSTANTS.harvestCompendiumId)
          itemDC = parseInt(item.system.description.chat);
        else itemDC = item.system.source.label.match(/\d+/g)[0];

        if (itemDC <= result.total) {
          lootMessage += `<li>@UUID[${item.uuid}]</li>`;
          successArr.push(item.toObject());
        }
      }
    });
  }

  if (SETTINGS.autoAddItems && successArr?.length > 0) {
    if (SETTINGS.autoAddItemPiles && game.modules.get("item-piles")?.active) {
      await addToItemPile(controlledToken.actor, successArr);
    } else {
      await addItemToActor(controlledToken.actor, successArr);
    }
  }

  if (lootMessage) messageData.content = `<h3>Harvesting</h3><ul>${lootMessage}</ul>`;

  ChatMessage.create(messageData);

  return false;
});

function validateAction(controlToken, targetedToken, actionName) {
  var measuredDistance = canvas.grid.measureDistance(controlToken.center, targetedToken.center);
  var targetSize = CONSTANTS.sizeHashMap.get(targetedToken.actor.system.traits.size);
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
  if (actor.system.attributes.hp.value != 0) {
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

function handleLoot(item) {
  var targetedToken = canvas.tokens.get(item.getFlag("harvester", "targetId"));
  var targetedActor = game.actors.get(targetedToken.document.actorId);
  var controlledToken = canvas.tokens.get(item.getFlag("harvester", "controlId"));
  var controlActor = game.actors.get(controlledToken.document.actorId);

  var messageData = {
    content: `<h3>Looting</h3><ul>${controlledToken.name} attempted to loot resources from ${targetedToken.name} but failed to find anything.`,
    whisper: {},
  };
  if (SETTINGS.gmOnly) messageData.whisper = game.users.filter((u) => u.isGM).map((u) => u._id);

  var itemArr = searchCompendium(targetedActor, lootAction.name);

  harvesterAndLootingSocket.executeAsGM(addEffect, targetedToken.id, lootAction.name);

  if (itemArr.length == 0) {
    item.setFlag("harvester", "targetId", "");
    return;
  }

  var normalLoot = itemArr[0].description;
  if (normalLoot == "false" && !SETTINGS.lootBeasts) {
    ChatMessage.create(messageData);
    return;
  }

  itemArr[0].description = ""; //remove the boolean present in the description which describes if the entry is a beast that doesn't normally have loot

  itemArr[0].roll({ async: false }).then((result) => {
    var rollMap = formatLootRoll(result.results[0].text);
    var lootMessage = "";

    currencyFlavors.forEach((currency) => {
      if (!rollMap.has(currency)) return;

      var roll = new Roll(rollMap.get(currency));
      var rollResult = roll.roll({ async: false });
      lootMessage += `<li>${rollResult.total} ${currency}</li>`;
      if (SETTINGS.autoAddItems) {
        updateActorCurrency(controlActor, currency, rollResult.total);
      }
    });

    messageData.content = `<h3>Looting</h3>After examining the corpse you find:<ul>${lootMessage}</ul>`;

    ChatMessage.create(messageData);
    return;
  });
}

function formatLootRoll(result) {
  var rollTableResult = result.replace(/(\[\[\/r\s)?(\]\])?(\}$)?/g, "").split("}");
  var returnMap = new Map();

  for (var i = 0; i < rollTableResult.length; i++) {
    var extractedRoll = rollTableResult[i].split("{");
    returnMap.set(extractedRoll[1], extractedRoll[0]);
  }
  return returnMap;
}

function updateActorCurrency(actor, currencyLabel, toAdd) {
  var currencyRef = CONSTANTS.currencyMap.get(currencyLabel);
  var total = actor.system.currency[currencyRef] + toAdd;
  actor.update({
    system: {
      currency: {
        [currencyRef]: total,
      },
    },
  });
  console.log(`harvester | Added ${toAdd} ${currencyLabel} to: ${actor.name}`);
}

function searchCompendium(actor, actionName) {
  var returnArr = [];
  var actorName = actor.name;
  if (actorName.includes("Dragon")) actorName = formatDragon(actorName);

  if (actionName == harvestAction.name) {
    returnArr = checkCompendium(customCompendium, "name", actor.name);

    if (returnArr.length != 0) return returnArr;

    returnArr = checkCompendium(harvestCompendium, "system.source.label", actorName);
  } else if (actionName == lootAction.name && !SETTINGS.disableLoot) {
    returnArr = checkCompendium(customLootCompendium, "name", actor.name);

    if (returnArr.length != 0) return returnArr;

    returnArr = checkCompendium(lootCompendium, "name", actorName);
  }

  return returnArr;
}

function checkCompendium(compendium, checkProperty, matchProperty) {
  var returnArr = [];
  compendium.forEach((doc) => {
    if (eval(`doc.${checkProperty}`) == matchProperty) returnArr.push(doc);
  });
  return returnArr;
}

function retrieveTablesHarvestWithBetterRollTables(targetedActor, actionName) {
  var actorName = targetedActor.name;
  if (actorName.includes("Dragon")) {
    actorName = formatDragon(actorName);
  }
  if (actionName == harvestAction.name) {
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
      ui.notifications.warn(`No rolltable found for metadata sourceId '${sourceValue}'`);
      return [];
    }
    return tablesChecked;
  } else {
    return [];
  }
}

async function retrieveItemsHarvestWithBetterRollTables(targetedActor, actionName, dcValue = null, skillDenom = null) {
  var returnArr = [];
  if (actionName == harvestAction.name) {
    if (!dcValue) {
      dcValue = 0;
    }
    if (!skillDenom) {
      skillDenom = "";
    }

    const tablesChecked = retrieveTablesHarvestWithBetterRollTables(targetedActor, actionName);
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
  } else if (actionName == lootAction.name && !SETTINGS.disableLoot) {
    // TODO A INTEGRATION WITH THE LOOT TYPE TABLE
    returnArr = checkCompendium(customLootCompendium, "name", actor.name);

    if (returnArr.length != 0) return returnArr;

    returnArr = checkCompendium(lootCompendium, "name", actorName);
  }

  return returnArr ?? [];
}

async function addActionToActors() {
  if (SETTINGS.autoAddActionGroup == "None") return;

  game.actors.forEach(async (actor) => {
    if (SETTINGS.autoAddActionGroup == "PCOnly" && actor.type == "npc") return;

    var hasHarvest = false;
    var hasLoot = false;

    actor.items.forEach((item) => {
      if (item.name == harvestAction.name && item.system.source.label == "Harvester") {
        hasHarvest = true;
        resetToDefault(item);
      }
      if (item.name == lootAction.name && item.system.source.label == "Harvester") {
        hasLoot = true;
        resetToDefault(item);
        if (SETTINGS.disableLoot) actor.deleteEmbeddedDocuments("Item", [item.id]);
      }
    });

    if (!hasHarvest) await addItemToActor(actor, [harvestAction]);
    if (!hasLoot && !SETTINGS.disableLoot) await addItemToActor(actor, [lootAction]);
  });
  console.log("harvester | ready() - Added Actions to All Actors specified in Settings");
}

function checkEffect(token, effectName) {
  var returnBool = false;
  token.document.delta?.effects?.forEach((element) => {
    if (element.name == effectName) returnBool = true;
  });
  return returnBool;
}

function formatDragon(actorName) {
  var actorSplit = actorName.split(" ");
  CONSTANTS.dragonIgnoreArr.forEach((element) => {
    actorSplit = actorSplit.filter((e) => e !== element);
  });

  actorSplit = actorSplit.join(" ");
  return actorSplit;
}

function resetToDefault(item) {
  var actionDescription = `Harvest valuable materials from corpses.`;
  if (item.name == lootAction.name) actionDescription = `Scavenge valuables from corpses.`;
  item.update({
    flags: { harvester: { targetId: "", controlId: "" } },
    system: { formula: "", description: { value: actionDescription } },
  });
}

function addEffect(targetTokenId, actionName) {
  var targetToken = canvas.tokens.get(targetTokenId);
  if (actionName == harvestAction.name)
    targetToken.document.toggleActiveEffect(
      {
        id: CONSTANTS.harvestActionEffectId,
        icon: CONSTANTS.harvestActionEffectIcon,
        label: CONSTANTS.harvestActionEffectName,
      },
      { active: true }
    );
  else if (actionName == lootAction.name && !SETTINGS.disableLoot)
    targetToken.document.toggleActiveEffect(
      { id: CONSTANTS.lootActionEffectId, icon: CONSTANTS.lootActionEffectIcon, label: CONSTANTS.lootActionEffectName },
      { active: true }
    );
  console.log(`harvester | Added ${actionName.toLowerCase()}ed effect to: ${targetToken.name}`);
}

async function addItemToActor(actor, itemsArray) {
  for (const item of itemsArray) {
    await _createItem(item, actor);
  }
}
async function addToItemPile(targetedToken, item) {
  game.itempiles.API.addItems(targetedToken, item, {
    mergeSimilarItems: true,
  });
  console.log(`harvester | Added ${item.length} items to ${targetedToken.name}`);
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
    if (newQty != newItemQty) {
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
      console.log(`harvester | Updated ${item.name} to ${actor.name}`);
    } else {
      console.log(`harvester | Nothing is done with ${item.name} on ${actor.name}`);
    }
  } else {
    /** we create a new item if we don't own already */
    await actor.createEmbeddedDocuments("Item", [newItemData]);
    console.log(`harvester | Added ${item.name} to ${actor.name}`);
  }
}
