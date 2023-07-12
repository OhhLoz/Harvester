import { registerSettings, SETTINGS, CONSTANTS, dragonIgnoreArr, sizeHashMap, currencyMap } from "./settings.js";

var actionCompendium, harvestCompendium, lootCompendium, harvestAction, lootAction, socket, currencyFlavors;

Hooks.on("init", function()
{
  registerSettings();
  console.log("harvester | Init() - Registered settings & Fetched compendiums.");
});

Hooks.on("ready", async function()
{
  actionCompendium = await game.packs.get(CONSTANTS.actionCompendiumId).getDocuments();
  harvestCompendium = await game.packs.get(CONSTANTS.harvestCompendiumId).getDocuments();
  lootCompendium = await game.packs.get(CONSTANTS.lootCompendiumId).getDocuments();

  harvestAction = await actionCompendium.find(a => a.id == CONSTANTS.harvestActionId);
  lootAction = await actionCompendium.find(a => a.id == CONSTANTS.lootActionId);

  currencyFlavors = Array.from(currencyMap.keys());

  if (game.user?.isGM && !game.modules.get("socketlib")?.active)
    ui.notifications.error("socketlib must be installed & enabled for harvester to function correctly.", { permanent: true });

  if (game.users.activeGM.id !== game.user.id) return
    addActionToActors();
});

Hooks.once("socketlib.ready", () => {
	socket = globalThis.socketlib.registerModule("harvester");
	socket.register("addEffect", addEffect);
  console.log("harvester | Registed socketlib functions");
});

Hooks.on("createActor", (actor, data, options, id) =>
{
  if (SETTINGS.autoAddActionGroup != "None")
  {
    if(SETTINGS.autoAddActionGroup == "PCOnly" && actor.type == "npc")
      return;

    addItemToActor(actor, harvestAction);
    if(!SETTINGS.disableLoot)
      addItemToActor(actor, lootAction);
  }
})

Hooks.on('dnd5e.preUseItem', function(item, config, options)
{
  if (item.system.source != "Harvester")
    return;

  if(!validateAction(item.parent.getActiveTokens()[0], game.user.targets, item.name))
    return false;

  item._source.system.description.value = `${item.name}ing ${game.user.targets.first().name}`

  // Add skill check instead of rolling later on, requires a custom roll formula as it needs skill rolls not ability scores, this displays "Other Formula" under the card which isnt ideal.
})

Hooks.on('dnd5e.useItem', function(item, config, options)
{
  if (item.system.source != "Harvester")
    return;

  handleAction(item.parent.getActiveTokens()[0], game.user.targets.first(), item.name);
})

function validateAction(controlToken, userTargets, actionName)
{
  if (userTargets.size != 1)
  {
    ui.notifications.warn("Please target only one token.");
    return false;
  }
  var targetedToken = userTargets.first();
  var measuredDistance = canvas.grid.measureDistance(controlToken.center, targetedToken.center);
  var targetSize = sizeHashMap.get(targetedToken.actor.system.traits.size)
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

async function handleAction(controlledToken, targetedToken, actionName)
{
  var targetActor = await game.actors.get(targetedToken.document.actorId);
  var controlActor = await game.actors.get(controlledToken.document.actorId);

  var itemArr = [];
  var result;
  var messageData = {content: `<h3>${actionName}ing</h3><ul>${controlledToken.name} attempted to ${actionName.toLowerCase()} resources from ${targetedToken.name} but failed to find anything.`, whisper: {}};
  if (SETTINGS.gmOnly)
    messageData.whisper = game.users.filter(u => u.isGM).map(u => u._id);

  itemArr = await searchCompendium(targetActor, actionName);
  if (itemArr.length == 0)
  {
    ChatMessage.create({content: `<h3>${actionName}ing</h3>After examining the corpse you realise there is nothing you can ${actionName.toLowerCase()}.`});
    await socket.executeAsGM(addEffect, targetedToken.id, actionName);
    return;
  }

  if (actionName == harvestAction.name)
  {
    var skillCheck = itemArr[0]?.system.description.unidentified.slice(0,3).toLowerCase();
    result = await controlActor.rollSkill(skillCheck, {chooseModifier: false});
    if (!result) // If user doesn't roll then do nothing
      return;

    await socket.executeAsGM(addEffect, targetedToken.id, actionName);

    var lootMessage = "";
    var successArr = []
    itemArr.forEach(item =>
    {
      if (parseInt(item.system.description.chat) <= result.total)
      {
        lootMessage += `<li>@UUID[${item.uuid}]</li>`
        successArr.push(item.toObject());
      }
    });

    if(SETTINGS.autoAddItems)
      addItemToActor(controlActor, successArr);

    if (lootMessage)
      messageData.content = `<h3>${actionName}ing</h3><ul>${lootMessage}</ul>`;

    ChatMessage.create(messageData);
    return;
  }

  if (actionName == lootAction.name && !SETTINGS.disableLoot)
  {
    var normalLoot = itemArr[0].description;
    if (normalLoot == "false" && !SETTINGS.lootBeasts)
    {
      await socket.executeAsGM(addEffect, targetedToken.id, actionName);
      ChatMessage.create(messageData);
      return;
    }

    await socket.executeAsGM(addEffect, targetedToken.id, actionName);

    itemArr[0].description = ""

    var rollTable = await itemArr[0].roll({async: false});
    var rollMap = formatLootRoll(rollTable.results[0].text);
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

    messageData.content = `<h3>${actionName}ing</h3>After examining the corpse you find:<ul>${lootMessage}</ul>`;

    ChatMessage.create(messageData);
    return;
  }
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
  var currencyRef = currencyMap.get(currencyLabel);
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
    harvestCompendium.forEach(doc =>
    {
      if (doc.system.source == actorName)
        returnArr.push(doc);
    })
  }
  else if (actionName == lootAction.name && !SETTINGS.disableLoot)
  {
    lootCompendium.forEach(doc =>
    {
      if (doc.name == actorName)
        returnArr.push(doc);
    })
  }

  return returnArr;
}

function addActionToActors()
{
  if (SETTINGS.autoAddActionGroup == "None")
    return;

  game.actors.forEach(actor =>
  {
    var hasHarvest = false;
    var hasLoot = false;
    if(SETTINGS.autoAddActionGroup == "PCOnly" && actor.type == "npc")
      return;
    actor.items.forEach(item =>{
      if(item.name == harvestAction.name && item.system.source == "Harvester")
        hasHarvest = true;
      if(item.name == lootAction.name && item.system.source == "Harvester")
        hasLoot = true;
    })
    if (!hasHarvest)
      addItemToActor(actor, harvestAction);
    if (!hasLoot && !SETTINGS.disableLoot)
      addItemToActor(actor, lootAction);
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
  dragonIgnoreArr.forEach(element => {
    actorSplit = actorSplit.filter(e => e !== element);
  })

  actorSplit = actorSplit.join(" ")
  return actorSplit;
}

function addEffect(targetTokenId, actionName)
{
  var targetToken = canvas.tokens.get(targetTokenId);
  if(actionName == harvestAction.name)
    targetToken.document.toggleActiveEffect({id: CONSTANTS.harvestActionEffectId, icon: "icons/svg/pawprint.svg", label: "Harvested"}, {active: true});
  else if (actionName == lootAction.name && !SETTINGS.disableLoot)
    targetToken.document.toggleActiveEffect({id: CONSTANTS.lootActionEffectId, icon: "icons/svg/coins.svg", label: "Looted"}, {active: true});
  console.log(`harvester | Added ${actionName.toLowerCase()}ed effect to: ${targetToken.name}`);
}

function addItemToActor(actor, item)
{
  actor.createEmbeddedDocuments('Item', item);
  console.log(`harvester | Added ${item.length} items to ${actor.name}`);
}