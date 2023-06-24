export function registerSettings()
{
    game.settings.register("harvester", "autoAdd", {
        name: "Auto-add harvest to actor",
        hint: "All harvested loot is added to characters automatically.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "npcOnlyHarvest", {
        name: "NPC Only Harvesting",
        hint: "Only non player characters can be harvested.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "requireDeadEffect", {
        name: "Dead Harvesting",
        hint: "Requires the 'Dead' status effect to harvest. (Otherwise only needs 0 HP)",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "allActorMacro", {
        name: "Assign Macro to All Actors",
        hint: "Assigns the Harvest macro to all actors, present and future.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "gmOnly", {
        name: "Only GM sees Harvest Results",
        hint: "Hides the Harvest Results from all users except the GM",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false
    });
}

export function getSettings()
{
    return {
        autoAdd: game.settings.get("harvester", "autoAdd"),
        gmOnly: game.settings.get("harvester", "gmOnly"),
        requireDeadEffect: game.settings.get("harvester", "requireDeadEffect"),
        npcOnlyHarvest: game.settings.get("harvester", "npcOnlyHarvest"),
        allActorMacro: game.settings.get("harvester", "allActorMacro")
    }
}

export const dragonIgnoreArr =
[
    "Amethyst",
    "Black",
    "Blue",
    "Brass",
    "Bronze",
    "Copper",
    "Crystal",
    "Deep",
    "Emerald",
    "Gold",
    "Green",
    "Lunar",
    "Moonstone",
    "Red",
    "Sapphire",
    "Silver",
    "Solar",
    "Topaz",
    "White"
]