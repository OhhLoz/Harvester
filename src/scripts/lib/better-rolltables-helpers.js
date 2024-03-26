import {
    customLootCompendium,
    harvestAction,
    harvestBetterRollCompendium,
    lootAction,
    lootCompendium,
} from "../../module";
import Logger from "./Logger";
import { formatDragon, testWithRegex } from "./lib";

export default class BetterRollTablesHelpers {
    static retrieveTablesHarvestWithBetterRollTables(actorName, actionName) {
        if (actionName === harvestAction.name) {
            let sourceValue = actorName.trim() ?? "";
            if (sourceValue.includes("Dragon")) {
                sourceValue = formatDragon(sourceValue)?.trim();
            }
            let tablesChecked = [];
            // Try with the compendium first
            for (const doc of harvestBetterRollCompendium) {
                if (testWithRegex(sourceValue, getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim())) {
                    Logger.debug(
                        `retrieveTablesHarvestWithBetterRollTables | Find document with check regex ${sourceValue}=${getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim()}`,
                    );
                    tablesChecked.push(doc);
                }
            }
            // Try on the tables imported
            if (!tablesChecked || tablesChecked.length === 0) {
                tablesChecked = game.tables.contents.filter((doc) => {
                    return testWithRegex(
                        sourceValue,
                        getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim(),
                    );
                });
            }
            // We juts get the first
            if (!tablesChecked || tablesChecked.length === 0) {
                Logger.warn(
                    `retrieveTablesHarvestWithBetterRollTables | BRT No rolltable found for metadata sourceId '${sourceValue}'`,
                    true,
                );
                return [];
            }
            return tablesChecked;
        } else {
            Logger.warn(
                `retrieveTablesHarvestWithBetterRollTables | BRT No rolltable found for action '${harvestAction.name}'`,
                true,
            );
            return [];
        }
    }

    static async retrieveItemsDataHarvestWithBetterRollTables(
        actorName,
        actionName,
        dcValue = null,
        skillDenom = null,
    ) {
        let returnArr = [];
        if (actionName === harvestAction.name) {
            if (!dcValue) {
                dcValue = 0;
            }
            if (!skillDenom) {
                skillDenom = "";
            }

            const tablesChecked = BetterRollTablesHelpers.retrieveTablesHarvestWithBetterRollTables(
                actorName,
                actionName,
            );
            if (!tablesChecked || tablesChecked.length === 0) {
                Logger.warn(
                    `retrieveItemsDataHarvestWithBetterRollTables | BRT No rolltable found for action '${actionName}'`,
                    true,
                );
                return [];
            }
            const tableHarvester = tablesChecked[0];
            returnArr = await game.modules.get("better-rolltables").api.retrieveItemsDataFromRollTableResult({
                table: tableHarvester,
                options: {
                    rollMode: "gmroll",
                    dc: dcValue,
                    skill: skillDenom,
                    displayChat: false,
                },
            });
        } else {
            Logger.warn(
                `retrieveItemsDataHarvestWithBetterRollTables | BRT No rolltable found for action '${harvestAction.name}'`,
                true,
            );
            return [];
        }

        return returnArr ?? [];
    }

    static async retrieveResultsDataLootWithBetterRollTables(actorName, actionName) {
        let returnArr = [];
        if (actionName === lootAction.name) {
            const tablesChecked = BetterRollTablesHelpers.retrieveTablesLootWithBetterRollTables(actorName, actionName);
            if (!tablesChecked || tablesChecked.length === 0) {
                Logger.warn(
                    `retrieveResultsDataLootWithBetterRollTables | BRT No rolltable found for action '${actionName}'`,
                    true,
                );
                return [];
            }
            returnArr = retrieveResultsDataLootWithBetterRollTablesV2(tablesChecked[0], actorName, actionName);
        } else {
            Logger.warn(
                `retrieveResultsDataLootWithBetterRollTables | BRT No rolltable found for action '${lootAction.name}'`,
                true,
            );
            return [];
        }

        return returnArr ?? [];
    }

    static async retrieveResultsDataLootWithBetterRollTablesV2(tableEntity, actorName, actionName) {
        let returnArr = [];
        if (actionName === lootAction.name) {
            const tableLooting = tableEntity;
            returnArr = await game.modules.get("better-rolltables").api.betterTableRoll(tableLooting, {
                rollMode: "gmroll",
                displayChat: false,
            });
        } else {
            Logger.warn(
                `retrieveResultsDataLootWithBetterRollTablesV2 | BRT No rolltable found for action '${lootAction.name}'`,
                true,
            );
            return [];
        }

        return returnArr ?? [];
    }

    static retrieveTablesLootWithBetterRollTables(actorName, actionName) {
        if (actionName === lootAction.name) {
            let sourceValue = actorName.trim() ?? "";
            if (sourceValue.includes("Dragon")) {
                sourceValue = formatDragon(sourceValue)?.trim();
            }
            let tablesChecked = [];
            // Try with the compendium first
            for (const doc of lootCompendium) {
                if (
                    testWithRegex(sourceValue, getProperty(doc, `name`)?.trim()) ||
                    testWithRegex(sourceValue, getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim())
                ) {
                    tablesChecked.push(doc);
                }
            }
            for (const doc of customLootCompendium) {
                if (
                    testWithRegex(sourceValue, getProperty(doc, `name`)?.trim()) ||
                    testWithRegex(sourceValue, getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim())
                ) {
                    tablesChecked.push(doc);
                }
            }
            // Try on the tables imported
            if (!tablesChecked || tablesChecked.length === 0) {
                tablesChecked = game.tables.contents.filter((doc) => {
                    return (
                        testWithRegex(sourceValue, getProperty(doc, `name`)?.trim()) ||
                        testWithRegex(sourceValue, getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim())
                    );
                });
            }
            // We juts get the first
            if (!tablesChecked || tablesChecked.length === 0) {
                Logger.warn(
                    `retrieveTablesLootWithBetterRollTables | BRT No rolltable found for metadata sourceId '${sourceValue}'`,
                    true,
                );
                return [];
            }
            return tablesChecked;
        } else {
            Logger.warn(
                `retrieveTablesLootWithBetterRollTables | BRT No rolltable found for action '${lootAction.name}'`,
                true,
            );
            return [];
        }
    }
}
