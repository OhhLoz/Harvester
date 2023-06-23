//let token = canvas.tokens.placeables.find(t => t.isOwner);
//if token.size == 1
// token.control();
//game.user.character.getActiveTokens()[0];
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

//console.log(game.packs)
//console.log(harvestCompendium.indexFields)
var harvestCompendium = await game.packs.get("harvester.harvest").getDocuments();
//console.log(harvestCompendium);
var harvestArr = [];
var actor = await game.actors.get(targetedToken.document.actorId);
console.log(actor);
harvestCompendium.forEach(doc =>
{
   if (doc.system.source.includes(actor.name))
   {
      harvestArr.push(doc.name);
   }
})

console.log(harvestArr);
// let item;
// if (idx) item = await pack.getDocument(idx._id);
//actor.rollSkill('ath');

//actor.rollSkill("ath", {event})

// const id = "... id of item here";
// const item = game.items.get(id);
// const data = item.toObject();
// await actor.createEmbeddedDocuments("Item", [data]);