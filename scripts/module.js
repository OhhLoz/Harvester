import { registerSettings } from "./settings.js";

Hooks.on("init", function()
{
  registerSettings();
  console.log("harvester | Init() - Registered settings.");
});

Hooks.on("ready", function()
{
  console.log("This code runs once core initialization is ready and game data is available.");
});

Hooks.on("targetToken", function(user, token, targeted)
{
  if(!targeted)
  return;

  token.document.setFlag('harvester', 'harvestable', false);
  //console.log(user);
  console.log(token);
  //console.log(user.name + " Targeted " + token.document.name + ": " + targeted);

  if(user.targets.size != 1)
    return;
  if(token.document.actorData.system.attributes.hp.value != 0)
    return;

  var isDead = false;
  token.document.actorData.effects?.forEach(element => {
    if (element.label == "Dead")
      isDead = true;
  });

  if(!isDead && !game.settings.get("harvester", "requireDeadEffect"))
    return;
  if(token.document.hasPlayerOwner && game.settings.get("harvester", "npcOnlyHarvest"))
    return;

  console.log(user.name + " can harvest " + token.document.name)
  token.document.setFlag('harvester', 'harvestable', true);
});