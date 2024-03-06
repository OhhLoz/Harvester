import { CONSTANTS } from "../constants";

export function getByValue(map, searchValue) {
  let keyMap = "";
  for (let [key, value] of map.entries()) {
    if (value === searchValue) {
      keyMap = key;
      break;
    }
  }
  return keyMap ?? "";
}

export function checkItemSourceLabel(item, sourceLabel) {
  if (item.system.source?.label === sourceLabel) {
    return true;
  }
  if (item.system.source?.custom === sourceLabel) {
    return true;
  }
  return false;
}

export function retrieveItemSourceLabel(item) {
  let sourceLabel = undefined;
  sourceLabel = item.system.source?.label;
  if (!sourceLabel || item.system.source?.custom) {
    sourceLabel = item.system.source?.custom;
  }
  return sourceLabel ?? "";
}

export function retrieveItemSourceLabelDC(item) {
  let itemDC = undefined;
  itemDC = item.system.source?.label.match(/\d+/g)[0];
  if (!itemDC || item.system.source?.custom) {
    itemDC = item.system.source?.custom?.match(/\d+/g)[0];
  }
  return itemDC ?? 0;
}

export function formatDragon(actorName) {
  let actorSplit = actorName.split(" ");
  CONSTANTS.dragonIgnoreArr.forEach((element) => {
    actorSplit = actorSplit.filter((e) => e !== element);
  });

  actorSplit = actorSplit.join(" ");
  return actorSplit;
}
