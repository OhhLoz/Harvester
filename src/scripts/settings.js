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

    game.settings.register(CONSTANTS.MODULE_ID, "harvestRemoveExistingActorItems", {
        name: "Harvesting: Automatically remove Items with Item Piles from the targeted token",
        hint: "This will enable to true the Item Piles setting 'removeExistingActorItems', for security reason is limited only to token target, so if you destroy a token on scene the original actor is no touched",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "harvestAddItemsMode", {
        name: "Harvesting: Add items harvest mode",
        hint: "Harvest action considers three modes: 'Shared it or Keep it', 'Shared it', 'Keep it'",
        scope: "world",
        config: true,
        requiresReload: true,
        type: String,
        choices: {
            ShareItOrKeepIt: "Shared it or Keep it",
            ShareIt: "Shared it",
            KeepIt: "Keep it",
        },
        default: "ShareItOrKeepIt",
    });

    game.settings.register(CONSTANTS.MODULE_ID, "npcOnlyHarvest", {
        name: "Harvesting: NPC Only Harvesting",
        hint: "Only non player characters can be looted/harvested.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(CONSTANTS.MODULE_ID, "allowAbilityChange", {
        name: "Harvesting: Allow ability score change on roll",
        hint: "Used if DM's trust their players and/or wish to use a different ability score instead of the default without making a custom compendium entry",
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

    game.settings.register(CONSTANTS.MODULE_ID, "disableLoot", {
        name: "Looting: Disable Looting mechanic",
        hint: "Disables the Loot mechanic, making it unavailable until enabled.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
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
    SETTINGS.harvestAddItemsMode = game.settings.get(CONSTANTS.MODULE_ID, "harvestAddItemsMode");
    SETTINGS.harvestRemoveExistingActorItems = game.settings.get(
        CONSTANTS.MODULE_ID,
        "harvestRemoveExistingActorItems",
    );
    SETTINGS.gmOnly = game.settings.get(CONSTANTS.MODULE_ID, "gmOnly");
    SETTINGS.requireDeadEffect = game.settings.get(CONSTANTS.MODULE_ID, "requireDeadEffect");
    SETTINGS.npcOnlyHarvest = game.settings.get(CONSTANTS.MODULE_ID, "npcOnlyHarvest");
    SETTINGS.autoAddActionGroup = game.settings.get(CONSTANTS.MODULE_ID, "autoAddActionGroup");
    SETTINGS.enforceRange = game.settings.get(CONSTANTS.MODULE_ID, "enforceRange");
    SETTINGS.allowAbilityChange = game.settings.get(CONSTANTS.MODULE_ID, "allowAbilityChange");
    SETTINGS.disableLoot = game.settings.get(CONSTANTS.MODULE_ID, "disableLoot");
    SETTINGS.debug = game.settings.get(CONSTANTS.MODULE_ID, "debug");
}

export const SETTINGS = {
    autoAddItems: true,
    harvestAddItemsMode: "ShareItOrKeepIt",
    harvestRemoveExistingActorItems: false,
    gmOnly: false,
    requireDeadEffect: true,
    npcOnlyHarvest: true,
    autoAddActionGroup: "PCOnly",
    enforceRange: true,
    allowAbilityChange: false,
    disableLoot: false,
};
