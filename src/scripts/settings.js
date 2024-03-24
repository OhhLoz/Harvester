import { CONSTANTS } from "./constants";

export function registerSettings() {
    game.settings.register(CONSTANTS.MODULE_ID, "autoAddItems", {
        name: "Automatically Assign Items",
        hint: "All harvested loot and looted currency is added to characters automatically.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true,
    });

    // game.settings.register(CONSTANTS.MODULE_ID, "autoAddItemPiles", {
    //     name: "Automatically Assign Items to Item Piles",
    //     hint: "All harvested loot and looted currency is added to Item Piles.",
    //     scope: "world",
    //     config: true,
    //     requiresReload: true,
    //     type: Boolean,
    //     default: true,
    // });

    game.settings.register(CONSTANTS.MODULE_ID, "addItemsHarvestMode", {
        name: "Add items harvest mode",
        hint: "Harvest action considers three modes: 'Shared it or Keep it', 'Shared it', 'Keep it'",
        scope: "world",
        config: true,
        requiresReload: true,
        type: String,
        choices: {
            SharedItOrKeepIt: "Shared it or Keep it",
            SharedIt: "Shared it",
            KeepIt: "Keep it",
        },
        default: "SharedItOrKeepIt",
    });

    game.settings.register(CONSTANTS.MODULE_ID, "autoAddActionGroup", {
        name: "Automatically Assign Action",
        hint: "Gives the Actions to the selected group.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: String,
        choices: {
            All: "All Characters",
            PCOnly: "Player Characters Only",
            None: "None",
        },
        default: "PCOnly",
    });

    game.settings.register(CONSTANTS.MODULE_ID, "npcOnlyHarvest", {
        name: "NPC Only Harvesting",
        hint: "Only non player characters can be looted/harvested.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "requireDeadEffect", {
        name: "Dead Effect Required",
        hint: "Requires the 'Dead' status effect to Harvest/Loot. (Otherwise only needs 0 HP)",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "gmOnly", {
        name: "Other players cannot see results",
        hint: "Hides the Results from all other users except the GM",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "enforceRange", {
        name: "Enforce Action Range",
        hint: "Force users to be in range to be able to use Harvest/Loot.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "allowAbilityChange", {
        name: "Allow ability score change on roll",
        hint: "Used if DM's trust their players and/or wish to use a different ability score instead of the default without making a custom compendium entry",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "disableLoot", {
        name: "Disable Looting mechanic",
        hint: "Disables the Loot mechanic, making it unavailable until enabled.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "requestorPopout", {
        name: "Requestor Popout",
        hint: "W to create a popout of this message automatically for all users that can see it (true or false).",
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "debug", {
        name: "Enable debugging",
        hint: "Prints debug messages to the console",
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
    });

    SETTINGS.autoAddItems = game.settings.get(CONSTANTS.MODULE_ID, "autoAddItems");
    // SETTINGS.autoAddItemPiles = game.settings.get(CONSTANTS.MODULE_ID, "autoAddItemPiles");
    SETTINGS.addItemsHarvestMode = game.settings.get(CONSTANTS.MODULE_ID, "addItemsHarvestMode");
    SETTINGS.gmOnly = game.settings.get(CONSTANTS.MODULE_ID, "gmOnly");
    SETTINGS.requireDeadEffect = game.settings.get(CONSTANTS.MODULE_ID, "requireDeadEffect");
    SETTINGS.npcOnlyHarvest = game.settings.get(CONSTANTS.MODULE_ID, "npcOnlyHarvest");
    SETTINGS.autoAddActionGroup = game.settings.get(CONSTANTS.MODULE_ID, "autoAddActionGroup");
    SETTINGS.enforceRange = game.settings.get(CONSTANTS.MODULE_ID, "enforceRange");
    SETTINGS.allowAbilityChange = game.settings.get(CONSTANTS.MODULE_ID, "allowAbilityChange");
    SETTINGS.disableLoot = game.settings.get(CONSTANTS.MODULE_ID, "disableLoot");
    // SETTINGS.lootBeasts = game.settings.get(CONSTANTS.MODULE_ID, "lootBeasts");
    // SETTINGS.enableBetterRollIntegration = game.settings.get(CONSTANTS.MODULE_ID, "enableBetterRollIntegration");
    SETTINGS.debug = game.settings.get(CONSTANTS.MODULE_ID, "debug");
}

export const SETTINGS = {
    autoAddItems: true,
    // autoAddItemPiles: true,
    addItemsHarvestMode: "SharedItOrKeepIt",
    gmOnly: false,
    requireDeadEffect: true,
    npcOnlyHarvest: true,
    autoAddActionGroup: "PCOnly",
    enforceRange: true,
    allowAbilityChange: false,
    disableLoot: false,
    // lootBeasts: false,
    // enableBetterRollIntegration: false,
};
