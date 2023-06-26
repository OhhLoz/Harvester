export function registerSettings()
{
    game.settings.register("harvester", "autoAddItems", {
        name: "Automatically Assign Harvest Items",
        hint: "All harvested loot is added to characters automatically.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "autoAddActionGroup", {
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

    game.settings.register("harvester", "gmOnly", {
        name: "Only GM sees Harvest Results",
        hint: "Hides the Harvest Results from all users except the GM",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false
    });

    game.settings.register("harvester", "enforceRange", {
        name: "Enforce Harvest range",
        hint: "Force users to be in range to be able to harvest.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });
}

export function getSettings()
{
    return {
        autoAddItems: game.settings.get("harvester", "autoAddItems"),
        gmOnly: game.settings.get("harvester", "gmOnly"),
        requireDeadEffect: game.settings.get("harvester", "requireDeadEffect"),
        npcOnlyHarvest: game.settings.get("harvester", "npcOnlyHarvest"),
        autoAddActionGroup: game.settings.get("harvester", "autoAddActionGroup"),
        enforceRange: game.settings.get("harvester", "enforceRange")
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

export const sizeHashMap = new Map(
[
    ["tiny", 5],
    ["sm", 5],
    ["med", 5],
    ["lg", 11],
    ["huge", 14.2],
    ["grg", 17.7]
])