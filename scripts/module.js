import { registerSettings, SETTINGS } from "./settings.js";
import { CONSTANTS } from "./constants.js";

var actionCompendium, harvestCompendium, lootCompendium, customCompendium, customLootCompendium, harvestAction, lootAction, socket, currencyFlavors;

Hooks.on("init", function()
{
  registerSettings();
  console.log("harvester | Init() - Registered settings & Fetched compendiums.");
});

Hooks.on("ready", async function()
{
  actionCompendium = await game.packs.get(CONSTANTS.actionCompendiumId).getDocuments();
  harvestCompendium = await game.packs.get(SETTINGS.harvestCompendiumId ?? CONSTANTS.harvestCompendiumId).getDocuments();
  lootCompendium = await game.packs.get(CONSTANTS.lootCompendiumId).getDocuments();
  customCompendium = await game.packs.get(CONSTANTS.customCompendiumId).getDocuments();
  customLootCompendium = await game.packs.get(CONSTANTS.customLootCompendiumId).getDocuments();

  harvestAction = await actionCompendium.find(a => a.id == CONSTANTS.harvestActionId);
  lootAction = await actionCompendium.find(a => a.id == CONSTANTS.lootActionId);

  currencyFlavors = Array.from(CONSTANTS.currencyMap.keys());

  if (game.user?.isGM && !game.modules.get("socketlib")?.active)
    ui.notifications.error("socketlib must be installed & enabled for harvester to function correctly.", { permanent: true });

  if (game.users.activeGM.id !== game.user.id) return
  addActionToActors();
});

Hooks.once("socketlib.ready", () => {
	socket = globalThis.socketlib.registerModule("harvester");
	socket.register("addEffect", addEffect);
  console.log("harvester | Registered socketlib functions");
});

Hooks.on("createActor", (actor, data, options, id) =>
{
  if (SETTINGS.autoAddActionGroup != "None")
  {
    if(SETTINGS.autoAddActionGroup == "PCOnly" && actor.type == "npc")
      return;

    addItemToActor(actor, [harvestAction]);
    if(!SETTINGS.disableLoot)
      addItemToActor(actor, [lootAction]);
  }
})

Hooks.on('dnd5e.preUseItem', function(item, config, options)
{
  if (item.system.source != "Harvester")
    return;

  if (game.user.targets.size != 1)
  {
    ui.notifications.warn("Please target only one token.");
    return false;
  }

  var targetedToken = game.user.targets.first();
  var controlToken = item.parent.getActiveTokens()[0];

  if(!validateAction(controlToken, targetedToken, item.name))
    return false;

  item.setFlag("harvester", "targetId", targetedToken.id)
  item.setFlag("harvester", "controlId", controlToken.id)
})

Hooks.on('dnd5e.useItem', function(item, config, options)
{
  if (item.system.source != "Harvester" || item.name == harvestAction.name || SETTINGS.disableLoot)
    return;

  handleLoot(item);
})

Hooks.on('dnd5e.preDisplayCard', function(item, chatData, options)
{
  if (item.system.source != "Harvester")
    return;

  var targetToken = game.user.targets.first();

  var matchedItems = searchCompendium(targetToken, item.name)

  if(item.name == lootAction.name)
  {
    if(matchedItems.length == 0)
      chatData.content = chatData.content.replace("Scavenge valuables from corpses.",`After examining the corpse you realise there is nothing you can loot.`)
    else
      chatData.content = chatData.content.replace("Scavenge valuables from corpses.",`Looting ${targetToken.name}`)
    return;
  }

  if(matchedItems.length != 0)
  {
    var skillCheckVerbose, skillCheck = "Nature"

    if(matchedItems[0].compendium.metadata.id == SETTINGS.harvestCompendiumId ?? CONSTANTS.harvestCompendiumId)
      skillCheckVerbose = matchedItems[0]?.system.description.unidentified;
    else
      skillCheckVerbose = matchedItems[0].items.find(element => element.type == "feat").name

    skillCheck = CONSTANTS.skillMap.get(skillCheckVerbose)
    item.setFlag("harvester", "skillCheck", skillCheck)
    item.update({system: {formula: `1d20 + @skills.${skillCheck}.total`}})
    chatData.content = chatData.content.replace(`<button data-action="formula">Other Formula</button>`, ``).replace(`<div class="card-buttons">`, `<div class="card-buttons"><button data-action="formula">${skillCheckVerbose} Skill Check</button>`).replace("Harvest valuable materials from corpses.",`Harvesting ${targetToken.name}`)
  }
  else
  {
    item.update({system: {formula: ""}})
    item.setFlag("harvester", "targetId", "")
    chatData.content = chatData.content.replace("Harvest valuable materials from corpses.",`After examining the corpse you realise there is nothing you can harvest.`)
    socket.executeAsGM(addEffect, targetToken.id, "Harvest");
  }
})

Hooks.on('dnd5e.preRollFormula', async function(item, options)
{
  if (item.system.source != "Harvester")
    return;

  var targetedToken = canvas.tokens.get(item.getFlag("harvester", "targetId"));
  var controlledToken = canvas.tokens.get(item.getFlag("harvester", "controlId"));

  if(!validateAction(controlledToken, targetedToken, item.name))
    return false;

  options.chatMessage = false;

  var result = await controlledToken.actor.rollSkill(item.getFlag("harvester", "skillCheck"), {chooseModifier: SETTINGS.allowAbilityChange});

  harvestCompendium = await game.packs.get(SETTINGS.harvestCompendiumId ?? CONSTANTS.harvestCompendiumId).getDocuments();
  customCompendium = await game.packs.get(CONSTANTS.customCompendiumId).getDocuments();

  var matchedItems = await searchCompendium(targetedToken, item.name)

  socket.executeAsGM(addEffect, targetedToken.id, "Harvest");

  if(matchedItems[0].compendium.metadata.id == CONSTANTS.customCompendiumId)
      matchedItems = matchedItems[0].items;

  var lootMessage = "";
  var successArr = [];
  var messageData = {content: "", whisper: {}};
  if (SETTINGS.gmOnly)
    messageData.whisper = game.users.filter(u => u.isGM).map(u => u._id);

  matchedItems.forEach(item =>
  {
    if (item.type == "loot")
    {
      var itemDC = 0;
      if(item.compendium.metadata.id == SETTINGS.harvestCompendiumId ??  CONSTANTS.harvestCompendiumId)
        itemDC = parseInt(item.system.description.chat)
      else
        itemDC = item.system.source.match(/\d+/g)[0];

      if(itemDC <= result.total)
      {
        lootMessage += `<li>@UUID[${item.uuid}]</li>`
        successArr.push(item.toObject());
      }
    }
  });

  if(SETTINGS.autoAddItems)
    addItemToActor(controlledToken.actor, successArr);

  if (lootMessage)
    messageData.content = `<h3>Harvesting</h3><ul>${lootMessage}</ul>`;

  ChatMessage.create(messageData);

  return false;
})

function validateAction(controlToken, targetedToken, actionName)
{
  var measuredDistance = canvas.grid.measureDistance(controlToken.center, targetedToken.center);
  var targetSize = CONSTANTS.sizeHashMap.get(targetedToken.actor.system.traits.size)
  if(measuredDistance > targetSize && SETTINGS.enforceRange)
  {
    ui.notifications.warn("You must be in range to " + actionName);
    return false;
  }
  if(targetedToken.document.delta.system.attributes.hp.value != 0)
  {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return false;
  }
  if(!checkEffect(targetedToken, "Dead") && SETTINGS.requireDeadEffect)
  {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return false;
  }
  if(targetedToken.document.hasPlayerOwner && SETTINGS.npcOnlyHarvest)
  {
    ui.notifications.warn(targetedToken.name + " is not an NPC");
    return false;
  }
  if(checkEffect(targetedToken, `${actionName}ed`))
  {
    ui.notifications.warn(`${targetedToken.name} has been ${actionName.toLowerCase()}ed already`);
    return false;
  }
  return true;
}

function handleLoot(item)
{
  var targetedToken = canvas.tokens.get(item.getFlag("harvester", "targetId"));
  var controlledToken = canvas.tokens.get(item.getFlag("harvester", "controlId"));
  var targetActor = game.actors.get(targetedToken.document.actorId);
  var controlActor = game.actors.get(controlledToken.document.actorId);

  var messageData = {content: `<h3>Looting</h3><ul>${controlledToken.name} attempted to loot resources from ${targetedToken.name} but failed to find anything.`, whisper: {}};
  if (SETTINGS.gmOnly)
    messageData.whisper = game.users.filter(u => u.isGM).map(u => u._id);

  var itemArr = searchCompendium(targetActor, lootAction.name);

  socket.executeAsGM(addEffect, targetedToken.id, lootAction.name);

  if (itemArr.length == 0)
  {
    item.setFlag("harvester", "targetId", "")
    return;
  }

  var normalLoot = itemArr[0].description;
  if (normalLoot == "false" && !SETTINGS.lootBeasts)
  {
    ChatMessage.create(messageData);
    return;
  }

  itemArr[0].description = "" //remove the boolean present in the description which describes if the entry is a beast that doesn't normally have loot

  itemArr[0].roll({async: false}).then(result => {
    var rollMap = formatLootRoll(result.results[0].text);
    var lootMessage = "";

    currencyFlavors.forEach(currency => {
      if(!rollMap.has(currency))
        return;

      var roll = new Roll(rollMap.get(currency))
      var rollResult = roll.roll({async: false});
      lootMessage += `<li>${rollResult.total} ${currency}</li>`
      if(SETTINGS.autoAddItems)
        updateActorCurrency(controlActor, currency, rollResult.total);
    })

    messageData.content = `<h3>Looting</h3>After examining the corpse you find:<ul>${lootMessage}</ul>`;

    ChatMessage.create(messageData);
    return;
  });
}

function formatLootRoll(result)
{
  var rollTableResult = result.replace(/(\[\[\/r\s)?(\]\])?(\}$)?/g,"").split("}");
  var returnMap = new Map();

  for(var i = 0; i < rollTableResult.length; i++)
  {
    var extractedRoll = rollTableResult[i].split("{");
    returnMap.set(extractedRoll[1], extractedRoll[0])
  }
  return returnMap;
}

function updateActorCurrency(actor, currencyLabel, toAdd)
{
  var currencyRef = CONSTANTS.currencyMap.get(currencyLabel);
  var total = actor.system.currency[currencyRef] + toAdd;
  actor.update(
  {
    system:
    {
      currency:
      {
        [currencyRef] : total
      }
    }
  })
  console.log(`harvester | Added ${toAdd} ${currencyLabel} to: ${actor.name}`);
}

function searchCompendium(actor, actionName)
{
  var returnArr = [];
  var actorName = actor.name;
  if (actorName.includes("Dragon"))
    actorName = formatDragon(actorName);

  if(actionName == harvestAction.name)
  {
    returnArr = checkCompendium(customCompendium, "name", actor.name)

    if (returnArr.length != 0)
      return returnArr;

    returnArr = checkCompendium(harvestCompendium, "system.source", actorName)
  }
  else if (actionName == lootAction.name && !SETTINGS.disableLoot)
  {
    returnArr = checkCompendium(customLootCompendium, "name", actor.name)

    if (returnArr.length != 0)
      return returnArr;

    returnArr = checkCompendium(lootCompendium, "name", actorName)
  }

  return returnArr;
}

function checkCompendium(compendium, checkProperty, matchProperty)
{
  var returnArr = [];
  compendium.forEach(doc =>
  {
    if (eval(`doc.${checkProperty}`) == matchProperty)
      returnArr.push(doc);
  })
  return returnArr;
}

function addActionToActors()
{
  if (SETTINGS.autoAddActionGroup == "None")
    return;

  game.actors.forEach(actor =>
  {
    if(SETTINGS.autoAddActionGroup == "PCOnly" && actor.type == "npc")
      return;

    var hasHarvest = false;
    var hasLoot = false;

    actor.items.forEach(item =>{
      if(item.name == harvestAction.name && item.system.source == "Harvester")
      {
        hasHarvest = true;
        resetToDefault(item)
      }
      if(item.name == lootAction.name && item.system.source == "Harvester")
      {
        hasLoot = true;
        resetToDefault(item)
        if(SETTINGS.disableLoot)
          actor.deleteEmbeddedDocuments("Item", [item.id]);
      }
    })

    if (!hasHarvest)
      addItemToActor(actor, [harvestAction]);
    if (!hasLoot && !SETTINGS.disableLoot)
      addItemToActor(actor, [lootAction]);
  })
  console.log("harvester | ready() - Added Actions to All Actors specified in Settings");
}

function checkEffect(token, effectName)
{
  var returnBool = false;
  token.document.delta.effects.forEach(element =>
  {
    if (element.name == effectName)
      returnBool = true;
  });
  return returnBool;
}

function formatDragon(actorName)
{
  var actorSplit = actorName.split(" ");
  CONSTANTS.dragonIgnoreArr.forEach(element => {
    actorSplit = actorSplit.filter(e => e !== element);
  })

  actorSplit = actorSplit.join(" ")
  return actorSplit;
}

function resetToDefault(item)
{
  var actionDescription = `Harvest valuable materials from corpses.`;
  if(item.name == lootAction.name)
    actionDescription = `Scavenge valuables from corpses.`
  item.update({
    flags: {harvester: {targetId: "", controlId: ""}},
    system: {formula: "", description: {value: actionDescription}}
  })
}

function addEffect(targetTokenId, actionName)
{
  var targetToken = canvas.tokens.get(targetTokenId);
  if(actionName == harvestAction.name)
    targetToken.document.toggleActiveEffect({id: CONSTANTS.harvestActionEffectId, icon: CONSTANTS.harvestActionEffectIcon, label: CONSTANTS.harvestActionEffectName}, {active: true});
  else if (actionName == lootAction.name && !SETTINGS.disableLoot)
    targetToken.document.toggleActiveEffect({id: CONSTANTS.lootActionEffectId, icon: CONSTANTS.lootActionEffectIcon, label: CONSTANTS.lootActionEffectName}, {active: true});
  console.log(`harvester | Added ${actionName.toLowerCase()}ed effect to: ${targetToken.name}`);
}

function addItemToActor(actor, item)
{
  actor.createEmbeddedDocuments('Item', item);
  console.log(`harvester | Added ${item.length} items to ${actor.name}`);
}