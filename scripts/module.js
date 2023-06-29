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

  harvestAction = actionCompendium.find(a => a.id == CONSTANTS.harvestActionId);
  lootAction = actionCompendium.find(a => a.id == CONSTANTS.lootActionId);

  currencyFlavors = Array.from(currencyMap.keys());

  if (game.user?.isGM && !game.modules.get("socketlib")?.active)
    ui.notifications.error("socketlib must be installed & enabled for harvester to function correctly.", { permanent: true });
  if (SETTINGS.autoAddActionGroup != "None")
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

    addItemToActor(actor.id, CONSTANTS.harvestActionId, CONSTANTS.actionCompendiumId);
    if(!SETTINGS.disableLoot)
      addItemToActor(actor.id, CONSTANTS.lootActionId, CONSTANTS.actionCompendiumId);
  }
})

Hooks.on('dnd5e.preUseItem', function(item, config, options)
{
  if (item.system.source != "Harvester")
    return;

  if(!validateAction(item.parent.getActiveTokens()[0], game.user.targets, item.name))
    return false;

  item._source.system.description.value = `${item.name}ing ${game.user.targets.first().name}`
  // item._source.system.formula = "1d20 + @skills.ath.bonus"
  // item._source.system.actionType = "abil"

  // Add skill check instead of rolling later on, requires a custom roll formula as it needs skill rolls not ability scores, this displays "Other Formula" under the card which isnt ideal.
})

Hooks.on('dnd5e.useItem', function(item, config, options)
{
  if (item.system.source != "Harvester")
    return;

  handleAction(item.parent.getActiveTokens()[0], game.user.targets.first(), item.name);
})

Hooks.on('preCreateChatMessage', function(message, options, userId)
{
  if(!SETTINGS.disableLoot && SETTINGS.rollLootDice)
  {
    currencyFlavors.forEach(flavour =>
    {
      if (message.flavor != flavour)
        return;

      if (!message.isRoll && !message.isOwner && message.flavor == null)
      return;

      if (SETTINGS.gmOnly)
        message._source.whisper = game.users.filter(u => u.isGM).map(u => u._id);

      if (SETTINGS.autoAddItems)
      {
        if (message.speaker.actor == null)
        {
          ui.notifications.warn("Currency not automatically added as token wasn't selected. Try again or manually add the currency.");
          return false;
        }

        updateActorCurrency(game.actors.get(message.speaker.actor), flavour, message.rolls[0]._total)
      }
    })
  }
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
  if(targetedToken.document.actorData.system.attributes.hp.value != 0)
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
  }

  await socket.executeAsGM(addEffect, targetedToken.id, actionName);

  if (actionName == harvestAction.name)
  {
    var lootMessage = "";
    itemArr.forEach(item =>
    {
        if (parseInt(item.system.description.chat) <= result.total)
        {
          lootMessage += `<li>@UUID[${item.uuid}]</li>`

          if(SETTINGS.autoAddItems)
            addItemToActor(controlActor.id, item.id, item.pack);
        }
    });

    if (lootMessage)
      messageData.content = `<h3>${actionName}ing</h3><ul>${lootMessage}</ul>`;

    ChatMessage.create(messageData);
    return;
  }

  if (actionName == lootAction.name)
  {
    var normalLoot = itemArr[0].description;
    if (normalLoot == "false" && !SETTINGS.lootBeasts)
    {
      ChatMessage.create(messageData);
      return;
    }

    itemArr[0].description = ""
    var rollMode = "roll";
    if(SETTINGS.gmOnly)
      rollMode = "gmroll";

    if(SETTINGS.rollLootDice)
      await itemArr[0].draw({ rollMode: rollMode })
    else
    {
      var rollTable = await itemArr[0].roll();
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
  else if (actionName == lootAction.name)
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
  var hasHarvest = false;
  var hasLoot = false;
  game.actors.forEach(actor =>
  {
    if(SETTINGS.autoAddActionGroup == "PCOnly" && actor.type == "npc")
      return;
    actor.items.forEach(item =>{
      if(item.name == harvestAction.name && item.system.source == "Harvester")
        hasHarvest = true;
      if(item.name == lootAction.name && item.system.source == "Harvester")
        hasLoot = true;
    })
    if (!hasHarvest)
      addItemToActor(actor.id, CONSTANTS.harvestActionId, CONSTANTS.actionCompendiumId);
    if (!hasLoot && !SETTINGS.disableLoot)
      addItemToActor(actor.id, CONSTANTS.lootActionId, CONSTANTS.actionCompendiumId);
  })
  console.log("harvester | ready() - Added Actions to All Actors specified in Settings");
}

function checkEffect(token, effectName)
{
  var returnBool = false;
  token.document.actorData.effects.forEach(element =>
  {
    if (element.label == effectName)
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
  var targetToken = canvas.tokens.get(targetTokenId)
  if(actionName == harvestAction.name)
    targetToken.toggleEffect(harvestAction.effects.get(CONSTANTS.harvestActionEffectId));
  else if (actionName == lootAction.name)
    targetToken.toggleEffect(lootAction.effects.get(CONSTANTS.lootActionEffectId));
  console.log(`harvester | Added ${actionName.toLowerCase()}ed effect to: ${targetToken.name}`);
}

function addItemToActor(actorId, itemId, packId)
{
  var actor = game.actors.get(actorId);
  var item = game.packs.get(packId).get(itemId);
  actor.createEmbeddedDocuments('Item', [item]);
  console.log(`harvester | Added item: ${item.name} to ${actor.name}`);
}