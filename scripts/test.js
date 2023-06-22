console.log("Hello World! This code runs immediately when the file is loaded.");

Hooks.on("init", function()
{
  console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
});

Hooks.on("ready", function()
{
  console.log("This code runs once core initialization is ready and game data is available.");
});

Hooks.on("targetToken", function(user, token, targeted)
{
  //console.log(user);
  console.log(token);
  //console.log(token.document.actorData.flags);
  //console.log(user.name + " Targeted " + token.document.name + ": " + targeted);

  var isDead = false;
  token.document.actorData.effects.forEach(element => {
    if (element.label == "Dead")
      isDead = true;
  });

  if(user.targets.size == 1 && (token.document.actorData.system.attributes.hp.value == 0 && isDead) && targeted)
  {
    console.log(user.name + " can harvest " + token.document.name)
    // await token.document.actorData.setProperty('harvester', 'harvestable', true);
  }
  else
  {
    console.log(user.name + " cannot harvest " + token.document.name)
    // await token.document.actorData.setFlag('harvester', 'harvestable', false);
  }
});