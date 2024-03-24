import { checkCompendium, harvestAction, harvestBetterRollCompendium } from "../../module";
import { formatDragon } from "./lib";

export default class BetterRollTablesHelpers {
    static retrieveTablesHarvestWithBetterRollTables(actorName, actionName) {
        if (actorName.includes("Dragon")) {
            actorName = formatDragon(actorName);
        }
        if (actionName === harvestAction.name) {
            // const dcValue = getProperty(xxx, `system.description.chat`);
            // const skillValue = getProperty(xxx, `system.description.unidentified`);
            const sourceValue = actorName ?? ""; // getProperty(xxx, `system.source`);
            // let compendium = game.packs.get(betterRollTableId);
            // const docs = compendium.contents;
            const docs = harvestBetterRollCompendium;
            let tablesChecked = [];
            // Try with the compendium first
            for (const doc of docs) {
                if (sourceValue.trim() === getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim()) {
                    tablesChecked.push(doc);
                }
            }
            // Try on the tables imported
            if (!tablesChecked || tablesChecked.length === 0) {
                tablesChecked = game.tables.contents.filter((doc) => {
                    return sourceValue.trim() === getProperty(doc, `flags.better-rolltables.brt-source-value`)?.trim();
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

    static async retrieveItemsHarvestWithBetterRollTables(actorName, actionName, dcValue = null, skillDenom = null) {
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
                    `retrieveItemsHarvestWithBetterRollTables | BRT No rolltable found for action '${actionName}'`,
                    true,
                );
                return [];
            }
            const tableHarvester = tablesChecked[0];
            returnArr = await game.modules
                .get("better-rolltables")
                .api.retrieveItemsDataFromRollTableResultSpecialHarvester({
                    table: tableHarvester,
                    options: {
                        rollMode: "gmroll",
                        dc: dcValue,
                        skill: skillDenom,
                    },
                });
        } else if (actionName === lootAction.name && !SETTINGS.disableLoot) {
            // TODO A INTEGRATION WITH THE LOOT TYPE TABLE
            returnArr = checkCompendium(customLootCompendium, "name", actor.name);

            if (returnArr.length !== 0) {
                Logger.warn(
                    `retrieveItemsHarvestWithBetterRollTables | BRT No rolltable found for action '${actionName}'`,
                    true,
                );
                return returnArr;
            }

            returnArr = checkCompendium(lootCompendium, "name", actorName);
        }

        return returnArr ?? [];
    }
}
