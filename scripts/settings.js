export function registerSettings()
{
    game.settings.register("harvester", "autoAdd", {
        name: "Auto-add harvested items to character sheet",
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

    game.settings.register("harvester", "allActorAction", {
        name: "Automatically Assign Harvest Action",
        hint: "Assigns the Harvest Action to the selected group.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: String,
        choices: {
            "All" : "All",
            "PCOnly": "Player Characters Only",
            "None" : "None"
          },
        default: "PCOnly"
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
        allActorAction: game.settings.get("harvester", "allActorAction")
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