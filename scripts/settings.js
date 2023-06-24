export function registerSettings()
{
    game.settings.register("harvester", "textOnly", {
        name: "Text Only Mode",
        hint: "All harvested loot is displayed in the chat only.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
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
        hint: "Requires the 'Dead' status effect to harvest. (Otherwise only needs 0 HP)",
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

    game.settings.register("harvester", "gmOnly", {
        name: "Only GM sees Harvest Results",
        hint: "Hides the Harvest Results from all users except the GM",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });
}