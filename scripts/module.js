import { registerSettings } from "./settings.js";

Hooks.on("init", function()
{
  registerSettings();
  console.log("harvester | Init() - Registered settings.");
});

Hooks.on("ready", function()
{
  console.log("harvester | ready()");
  game.modules.get("harvester").api = {validateHarvest};
});

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
  if(canvas.grid.measureDistance(controlledToken, targetedToken) > 9)
  {
    ui.notifications.warn(controlledToken.name + " is too far away to harvest materials.");
    return;
  }
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


  var harvestCompendium = await game.packs.get("harvester.harvest").getDocuments();
  //console.log(harvestCompendium);
  var harvestArr = [];
  var actor = await game.actors.get(targetedToken.document.actorId);
  //console.log(actor);
  harvestCompendium.forEach(doc =>
  {
    if (doc.system.source.includes(actor.name))
    {
        harvestArr.push(doc);
    }
  })

  console.log(harvestArr);
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