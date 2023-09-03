const API = {
    getCollection(inAttributes) {
      if (typeof inAttributes !== "object") {
        ui.notifications.error("harvester | getCollection | inAttributes must be of type object");
        return;
      }
      function stringIsUuid(inId) {
        return typeof inId === "string" && (inId.match(/\./g) || []).length && !inId.endsWith(".");
      }

      const itemOrItemUuid = inAttributes.actor
      if (stringIsUuid(itemOrItemUuid)) {
        itemOrItemUuid = fromUuidSync(itemOrItemUuid);
      }
      const item = itemOrItemUuid;
      return item.getFlag("harvester", "actorSources");
    },
  };
  
  export default API;