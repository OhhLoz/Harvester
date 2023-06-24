const harvester = game.modules.get('harvester');
if (!harvester)
{
  console.log('harvester module not found');
}
else
{
    let controlledToken = canvas.tokens.controlled[0];
    let targetedToken = game.user.targets.first();
    harvester.api.validateHarvest(controlledToken, targetedToken);
}
