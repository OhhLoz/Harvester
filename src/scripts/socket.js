import { addEffect } from "../module";
import API from "./api";
import { CONSTANTS } from "./constants";
import { HarvestingHelpers } from "./lib/harvesting-helpers";

export let harvesterAndLootingSocket;
export function registerSocket() {
    //Logger.debug("Registered harvesterAndLootingSocket");
    if (harvesterAndLootingSocket) {
        return harvesterAndLootingSocket;
    }

    harvesterAndLootingSocket = socketlib.registerModule(CONSTANTS.MODULE_ID);
    /**
     * Automated EvocationsVariant sockets
     */
    harvesterAndLootingSocket.register("addEffect", addEffect);
    harvesterAndLootingSocket.register(
        "addItemsToActorHarvesterOption",
        HarvestingHelpers.addItemsToActorHarvesterOption,
    );

    // Basic
    game.modules.get(CONSTANTS.MODULE_ID).socket = harvesterAndLootingSocket;
    return harvesterAndLootingSocket;
}
