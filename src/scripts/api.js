import Logger from "./lib/Logger.js";
import { HarvestingHelpers } from "./lib/harvesting-helpers.js";
import { LootingHelpers } from "./lib/looting-helpers.js";

const API = {
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
};
export default API;
