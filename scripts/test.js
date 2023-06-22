console.log("Hello World! This code runs immediately when the file is loaded.");

Hooks.on("init", function()
{
  game.settings.register("harvester", "textOnly", {
    name: "Text Only Mode",
    hint: "All harvested loot is displayed in the chat only.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("harvester", "npcOnlyHarvest", {
    name: "NPC Only Harvesting",
    hint: "Only non player characters can be harvested.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("harvester", "requireDeadEffect", {
    name: "Dead Harvesting",
    hint: "Requires the 'Dead' status effect to harvest. (Otherwise only needs 0hp)",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("harvester", "allActorMacro", {
    name: "Assign Macro to All Actors",
    hint: "Assigns the Harvest macro to all actors, present and future.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("harvester", "visibility", {
    name: "Chat visibility",
    hint: "Visibility of Harvest messages.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "GM": "GM Only",
      "Assistant GM": "Assistant GM & Above",
      "Trusted": "Trusted Players & Above",
      "All": "All Players",
    },
    default: "All"
  });
  console.log("harvester | Init() - Registered settings.");
});

Hooks.on("ready", function()
{
  console.log("This code runs once core initialization is ready and game data is available.");

});

Hooks.on("targetToken", function(user, token, targeted)
{
  //console.log(user);
  //console.log(token);
  //console.log(user.name + " Targeted " + token.document.name + ": " + targeted);
  if(!targeted)
    return;

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
  //await token.document.setFlag('harvester', 'harvestable', true);
});