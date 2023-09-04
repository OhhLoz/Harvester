export function registerSettings()
{
    game.settings.register("harvester", "autoAddItems", {
        name: "Automatically Assign Items",
        hint: "All harvested loot and looted currency is added to characters automatically.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "autoAddActionGroup", {
        name: "Automatically Assign Action",
        hint: "Gives the Actions to the selected group.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: String,
        choices: {
            "All" : "All Characters",
            "PCOnly": "Player Characters Only",
            "None" : "None"
          },
        default: "PCOnly"
    });

    game.settings.register("harvester", "npcOnlyHarvest", {
        name: "NPC Only Harvesting",
        hint: "Only non player characters can be looted/harvested.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "requireDeadEffect", {
        name: "Dead Effect Required",
        hint: "Requires the 'Dead' status effect to Harvest/Loot. (Otherwise only needs 0 HP)",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "gmOnly", {
        name: "Other players cannot see results",
        hint: "Hides the Results from all other users except the GM",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false
    });

    game.settings.register("harvester", "enforceRange", {
        name: "Enforce Action Range",
        hint: "Force users to be in range to be able to use Harvest/Loot.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true
    });

    game.settings.register("harvester", "allowAbilityChange", {
        name: "Allow ability score change on roll",
        hint: "Used if DM's trust their players and/or wish to use a different ability score instead of the default without making a custom compendium entry",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false
    });

    game.settings.register("harvester", "disableLoot", {
        name: "Disable Looting mechanic",
        hint: "Disables the Loot mechanic, making it unavailable until enabled.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false
    });

    game.settings.register("harvester", "lootBeasts", {
        name: "Loot All Creatures",
        hint: "Allow looting of all possible creatures including beasts",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false
    });

    game.settings.register("harvester", "harvestCompendiumId", {
        name: "Harvest compendium id",
        hint: "Setup the id to your own compendium id",
        scope: "world",
        config: true,
        requiresReload: true,
        type: String,
        default: "harvester.harvest"
    });

    SETTINGS.autoAddItems = game.settings.get("harvester", "autoAddItems");
    SETTINGS.gmOnly = game.settings.get("harvester", "gmOnly");
    SETTINGS.requireDeadEffect = game.settings.get("harvester", "requireDeadEffect");
    SETTINGS.npcOnlyHarvest = game.settings.get("harvester", "npcOnlyHarvest");
    SETTINGS.autoAddActionGroup = game.settings.get("harvester", "autoAddActionGroup");
    SETTINGS.enforceRange = game.settings.get("harvester", "enforceRange");
    SETTINGS.allowAbilityChange = game.settings.get("harvester", "allowAbilityChange");
    SETTINGS.disableLoot = game.settings.get("harvester", "disableLoot");
    SETTINGS.lootBeasts = game.settings.get("harvester", "lootBeasts");
    SETTINGS.harvestCompendiumId = game.settings.get("harvester", "harvestCompendiumId");
}

export const SETTINGS =
{
    autoAddItems: true,
    gmOnly: false,
    requireDeadEffect: true,
    npcOnlyHarvest: true,
    autoAddActionGroup: "PCOnly",
    enforceRange: true,
    allowAbilityChange: false,
    disableLoot: false,
    lootBeasts: false
}

export const CONSTANTS =
{
    harvestActionId : "ich3SV1HXRlq8K32",
    harvestActionEffectId : "0plmpCQ8D2Ezc1Do",
    lootActionId : "yaMtYJlcLh9mSBQI",
    lootActionEffectId : "KiM9NV0Od4a27JmY",
    actionCompendiumId : "harvester.actions",
    harvestCompendiumId : "harvester.harvest",
    lootCompendiumId : "harvester.loot"
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

export const currencyMap = new Map(
[
    ["Copper", "cp"],
    ["Silver", "sp"],
    ["Electrum", "ep"],
    ["Gold", "gp"],
    ["Platinum", "pp"]
])

export const sizeHashMap = new Map(
[
    ["tiny", 5],
    ["sm", 5],
    ["med", 5],
    ["lg", 11],
    ["huge", 14.2],
    ["grg", 17.7]
])