import { registerSettings } from "./settings.js";

Hooks.on("init", function()
{
  registerSettings();
  console.log("harvester | Init() - Registered settings.");
});

Hooks.on("ready", function()
{
  console.log("harvester | ready()");
});

Hooks.on("targetToken", function(user, token, targeted)
{
  if(!targeted)
  return;

  token.document.setFlag('harvester', 'harvestable', false);
  //console.log(user);
  //console.log(token);
  //console.log(user.name + " Targeted " + token.document.name + ": " + targeted);

  if(user.targets.size != 1)
    return;
  if(token.document.actorData.system.attributes.hp.value != 0)
    return;

  if(!checkDeadEffect(token) && !game.settings.get("harvester", "requireDeadEffect"))
    return;
  if(token.document.hasPlayerOwner && game.settings.get("harvester", "npcOnlyHarvest"))
    return;

  console.log(user.name + " can harvest " + token.document.name)
  token.document.setFlag('harvester', 'harvestable', true);
});

function checkDeadEffect(token)
{
  token.document.actorData.effects?.forEach(element =>
  {
    if (element.label == "Dead")
      return true;
  });
  return false;
}