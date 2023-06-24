import { registerSettings, getSettings, dragonIgnoreArr } from "./settings.js";

var itemCompendium, harvestCompendium, harvestEffect, moduleSettings;

Hooks.on("init", function()
{
  registerSettings();
  moduleSettings = getSettings();
  console.log("harvester | Init() - Registered settings.");
});

Hooks.on("ready", async function()
{
  game.modules.get("harvester").api = {validateHarvest};
  itemCompendium = await game.packs.get("harvester.harvest-action").getDocuments();
  harvestCompendium = await game.packs.get("harvester.harvest").getDocuments();
  harvestEffect = itemCompendium[0].effects.get("0plmpCQ8D2Ezc1Do");
  console.log("harvester | ready() - Assigned public functions & Fetched compendiums");
  if (moduleSettings.allActorMacro)
  {
    await addActionToActors();
    console.log("harvester | ready() - Added Harvest Action to All Created Actors");
  }
});

function addActionToActors()
{
  var hasAction = false;
  game.actors.forEach(actor =>
  {
    actor.items.forEach(item =>{
      if(item.name === "Harvest")
        hasAction = true;
    })
    if (!hasAction)
      actor.createEmbeddedDocuments('Item', [itemCompendium[0]]);
  })
}

// Actors._onCreateDocuments(documents, result, options, userId)
// {
//   console.log(documents);
//   console.log(result);
//   console.log(options);
//   console.log(userId);
// }

// Hooks.on('renderChatMessage', function(message, html, messageData)
// {
//   if(message.flavor == "Harvest")
//     console.log(message);
// })

async function validateHarvest(controlledToken, targetedToken)
{
  if (!controlledToken && !controlledToken.isOwner)
  {
    ui.notifications.warn("Please select an owned token.");
    return;
  }
  if (game.user.targets.size != 1)
  {
    ui.notifications.warn("Please target only one token.");
    return;
  }
  if(targetedToken.document.actorData.system.attributes.hp.value != 0)
  {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return;
  }
  if(!checkEffect(targetedToken, "Dead") && moduleSettings.requireDeadEffect)
  {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return;
  }
  if(targetedToken.document.hasPlayerOwner && moduleSettings.npcOnlyHarvest)
  {
    ui.notifications.warn(targetedToken.name + " is not an NPC");
    return;
  }
  if(checkEffect(targetedToken, "Harvested"))
  {
    ui.notifications.warn(targetedToken.name + " has been harvested already");
    return;
  }
  await handleHarvest(targetedToken, controlledToken);
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

function searchCompendium(actor)
{
  var harvestArr = [];
  var actorName = actor.name;
  if (actorName.includes("Dragon"))
    actorName = formatDragon(actorName);

  harvestCompendium.forEach(doc =>
  {
    if (doc.system.source === actorName)
      harvestArr.push(doc);
  })
  return harvestArr;
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

async function handleHarvest(targetedToken, controlledToken)
{
  var targetActor = await game.actors.get(targetedToken.document.actorId);
  var controlActor = await game.actors.get(controlledToken.document.actorId);

  var itemArr = await searchCompendium(targetActor);
  if (itemArr.length == 0)
  {
    ui.notifications.warn(targetedToken.name + " has no materials to harvest");
    return;
  }

  var skillCheck = itemArr[0]?.system.description.unidentified.slice(0,3).toLowerCase();
  var result = await controlActor.rollSkill(skillCheck);
  if (result)
  {
    var lootMessage = "";// = "Looted from " + targetedToken.name + "<br>";
    var messageData = {content: {}, whisper: {}};
    if (moduleSettings.gmOnly)
      messageData.whisper = game.users.filter(u => u.isGM).map(u => u._id);
    var autoAdd = moduleSettings.autoAdd;

    targetedToken.toggleEffect(harvestEffect);

    itemArr.forEach(item =>
    {
      if (parseInt(item.system.description.chat) <= result.total)
      {
        //console.log(item);
        lootMessage += `<li>@UUID[${item.uuid}]</li>`
        if(autoAdd)
          controlActor.createEmbeddedDocuments('Item', [item]);
      }
    });

    if (lootMessage)
      messageData.content = `<ul>${lootMessage}</ul>`;
    else
      messageData.content = `${controlledToken.name} attempted to harvest resources from ${targetedToken.name} but failed to find anything.`
    ChatMessage.create(messageData);
  }
}