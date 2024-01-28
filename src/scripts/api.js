import { handlePostRollHarvestAction, handlePreRollHarvestAction } from "../module.js";
import Logger from "./lib/Logger.js";

const API = {
  async handlePreRollHarvestAction(inAttributes) {
    //   if (!Array.isArray(inAttributes)) {
    //     throw Logger.error("handlePreRollHarvestAction | inAttributes must be of type array");
    //   }
    if (typeof inAttributes !== "object") {
      throw new Logger.error("handlePreRollHarvestAction | inAttributes must be of type object");
    }
    await handlePreRollHarvestAction(inAttributes);
  },
  async handlePostRollHarvestAction(inAttributes) {
    //   if (!Array.isArray(inAttributes)) {
    //     throw Logger.error("handlePreRollHarvestAction | inAttributes must be of type array");
    //   }
    if (typeof inAttributes !== "object") {
      throw new Logger.error("handlePreRollHarvestAction | inAttributes must be of type object");
    }
    await handlePostRollHarvestAction(inAttributes);
  },
};
export default API;
