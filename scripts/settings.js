export function registerSettings()
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
}