console.log("Hello World! This code runs immediately when the file is loaded.");

Hooks.on("init", function()
{
  game.settings.register("harvester", "textonly", {
    name: "Text Only Mode",
    hint: "All harvested loot is displayed in the chat only.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("harvester", "npconlyharvest", {
    name: "NPC Only Harvesting",
    hint: "Only non player characters can be harvested",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("harvester", "allactormacro", {
    name: "All Actors have Harvest",
    hint: "Assigns the Harvest macro to all actors, present and future",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("harvester", "visibility", {
    name: "Harvest message visibility",
    hint: "Visibility of Harvest messages",
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
  console.log("harvester - Registered settings.");
});

Hooks.on("ready", function()
{
  console.log("This code runs once core initialization is ready and game data is available.");

});

Hooks.on("targetToken", function(user, token, targeted)
{
  //console.log(user);
  //console.log(token);
  //console.log(token.document.actorData.flags);
  //console.log(user.name + " Targeted " + token.document.name + ": " + targeted);

  var isDead = false;
  token.document.actorData.effects?.forEach(element => {
    if (element.label == "Dead")
      isDead = true;
  });

  if(user.targets.size == 1 && (token.document.actorData.system.attributes.hp.value == 0 && isDead) && targeted)
  {
    console.log(user.name + " can harvest " + token.document.name)
    //await token.document.setFlag('harvester', 'harvestable', true);
  }
  else
  {
    console.log(user.name + " cannot harvest " + token.document.name)
    //await token.document.setFlag('harvester', 'harvestable', false);
  }
});