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

    SETTINGS.autoAddItems = game.settings.get("harvester", "autoAddItems");
    SETTINGS.gmOnly = game.settings.get("harvester", "gmOnly");
    SETTINGS.requireDeadEffect = game.settings.get("harvester", "requireDeadEffect");
    SETTINGS.npcOnlyHarvest = game.settings.get("harvester", "npcOnlyHarvest");
    SETTINGS.autoAddActionGroup = game.settings.get("harvester", "autoAddActionGroup");
    SETTINGS.enforceRange = game.settings.get("harvester", "enforceRange");
}

export const SETTINGS =
{
    autoAddItems: true,
    gmOnly: false,
    requireDeadEffect: true,
    npcOnlyHarvest: true,
    autoAddActionGroup: "",
    enforceRange: true
}

export const CONSTANTS =
{
    harvestActionId : "ich3SV1HXRlq8K32",
    harvestActionEffectId : "0plmpCQ8D2Ezc1Do",
    lootActionId : "yaMtYJlcLh9mSBQI",
    lootActionEffectId : "KiM9NV0Od4a27JmY",
    actionCompendiumId : "harvester.harvest-action",
    harvestCompendiumId : "harvester.harvest",
    lootCompendiumId : "world.loot"
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