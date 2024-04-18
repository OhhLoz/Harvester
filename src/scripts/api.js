import Logger from "./lib/Logger.js";
import { HarvestingHelpers } from "./lib/harvesting-helpers.js";
import ItemPilesHelpers from "./lib/item-piles-helpers.js";
import { testWithRegex } from "./lib/lib.js";
import { LootingHelpers } from "./lib/looting-helpers.js";
import { RetrieveHelpers } from "./lib/retrieve-helpers.js";

const API = {
    _Logger: Logger,
    _ItemPilesHelpers: ItemPilesHelpers,
    _RetrieveHelpers: RetrieveHelpers,

    // ============================
    // ACTION
    // ===========================

    async handlePreRollHarvestAction(inAttributes) {
        //   if (!Array.isArray(inAttributes)) {
        //     throw Logger.error("handlePreRollHarvestAction | inAttributes must be of type array");
        //   }
        if (typeof inAttributes !== "object") {
            throw new Logger.error("handlePreRollHarvestAction | inAttributes must be of type object");
        }
        await HarvestingHelpers.handlePreRollHarvestAction(inAttributes);
    },
    async handlePostRollHarvestAction(inAttributes) {
        //   if (!Array.isArray(inAttributes)) {
        //     throw Logger.error("handlePreRollHarvestAction | inAttributes must be of type array");
        //   }
        if (typeof inAttributes !== "object") {
            throw new Logger.error("handlePreRollHarvestAction | inAttributes must be of type object");
        }
        await HarvestingHelpers.handlePostRollHarvestAction(inAttributes);
    },
    async handlePreRollLootAction(inAttributes) {
        //   if (!Array.isArray(inAttributes)) {
        //     throw Logger.error("handlePreRollLootAction | inAttributes must be of type array");
        //   }
        if (typeof inAttributes !== "object") {
            throw new Logger.error("handlePreRollLootAction | inAttributes must be of type object");
        }
        await LootingHelpers.handlePreRollLootAction(inAttributes);
    },
    async handlePostRollLootAction(inAttributes) {
        //   if (!Array.isArray(inAttributes)) {
        //     throw Logger.error("handlePreRollLootAction | inAttributes must be of type array");
        //   }
        if (typeof inAttributes !== "object") {
            throw new Logger.error("handlePreRollLootAction | inAttributes must be of type object");
        }
        await LootingHelpers.handlePostRollLootAction(inAttributes);
    },

    // ============================
    // UTILITY
    // ===========================

    testWithRegex(source, target, enableExactMatch, enableAnySuffixMatch) {
        return testWithRegex(source, target, enableExactMatch, enableAnySuffixMatch);
    },
};
export default API;
