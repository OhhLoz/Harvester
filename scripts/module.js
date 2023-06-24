import { registerSettings } from "./settings.js";

Hooks.on("init", function()
{
  registerSettings();
  console.log("harvester | Init() - Registered settings.");
});

Hooks.on("ready", function()
{
  game.modules.get("harvester").api = {validateHarvest};
  console.log("harvester | ready() - Assigned public functions");
});

Hooks.on('renderChatMessage', function(message, html, messageData)
{
  if(message.flavor == "Harvest")
    console.log(message);
})

async function validateHarvest(controlledToken, targetedToken)
{
  if (!controlledToken)
  {
    ui.notifications.warn("Please select a token.");
    return;
  }
  if (!controlledToken.isOwner)
  {
    ui.notifications.warn("Please select an owned token.");
    return;
  }
  if (game.user.targets.size != 1)
  {
    ui.notifications.warn("Please target only one token.");
    return;
  }
  // if(canvas.grid.measureDistance(controlledToken, targetedToken) > 9)
  // {
  //   ui.notifications.warn(controlledToken.name + " is too far away to harvest materials.");
  //   return;
  // }
  if(targetedToken.document.actorData.system.attributes.hp.value != 0)
  {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return;
  }
  if(!checkDeadEffect(targetedToken) && !game.settings.get("harvester", "requireDeadEffect"))
  {
    ui.notifications.warn(targetedToken.name + " is not dead");
    return;
  }
  if(targetedToken.document.hasPlayerOwner && game.settings.get("harvester", "npcOnlyHarvest"))
  {
    ui.notifications.warn(targetedToken.name + " is not an NPC");
    return;
  }

  // ADD HARVESTED STATUS EFFECT

  var itemArr = await searchCompendium(targetedToken.document.actorId);
  //console.log(itemArr);
  var skillCheck = itemArr[0]?.system.description.unidentified.slice(0,3).toLowerCase();
  var actor = await game.actors.get(controlledToken.document.actorId);
  //console.log(skillCheck)
  var result = await actor.rollSkill(skillCheck);
  itemArr.forEach(item => {
    if (parseInt(item.system.description.chat) <= result.total)
    {
      console.log(item);
      // FORMAT MESSAGE
      // CHECK USER PERMS FOR INVENTORY MANAGEMENT & SETTING FOR CHAT ONLY
    }
  });

  // PRINT MESSAGE
}

function checkDeadEffect(token)
{
  token.document.actorData.effects?.forEach(element =>
  {
    if (element.label == "Dead")
      return true;
  });
  return false;
}

async function searchCompendium(actorId)
{
  var harvestCompendium = await game.packs.get("harvester.harvest").getDocuments();
  //var harvestCompendium = await game.packs.get("world.harvestnew").getDocuments();
  //console.log(harvestCompendium);
  var harvestArr = [];
  var actor = await game.actors.get(actorId);
  //console.log(actor);
  harvestCompendium.forEach(doc =>
  {
    if (doc.system.source === actor.name)
    {
        harvestArr.push(doc);
        //console.log(doc)
    }
  })
  return harvestArr;
}