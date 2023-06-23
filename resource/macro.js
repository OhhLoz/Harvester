let controlledToken = canvas.tokens.controlled[0];
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
let targetedToken = game.user.targets.first();
if(canvas.grid.measureDistance(controlledToken, targetedToken) > 9)
{
   ui.notifications.warn(controlledToken.name + " is too far away to harvest materials.");
   return;
}
if(targetedToken.document.getFlag('harvester','harvestable') === false)
{
   ui.notifications.warn(targetedToken.name + " isn't able to be harvested");
   return;
}
actor.rollSkill('ath');

//actor.rollSkill("ath", {event})
//let token = canvas.tokens.placeables.find(t => t.name === 'name');
//token.control();
//game.user.character.getActiveTokens()[0];

// const id = "... id of item here";
// const item = game.items.get(id);
// const data = item.toObject();
// await actor.createEmbeddedDocuments("Item", [data]);