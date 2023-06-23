const api = game.modules.get("harvester").api;
let controlledToken = canvas.tokens.controlled[0];
let targetedToken = game.user.targets.first();
api.validateHarvest(controlledToken, targetedToken);