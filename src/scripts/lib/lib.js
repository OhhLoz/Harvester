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

// ===========================

export function isEmptyObject(obj) {
  // because Object.keys(new Date()).length === 0;
  // we have to do some additional check
  if (obj === null || obj === undefined) {
    return true;
  }
  if (isRealNumber(obj)) {
    return false;
  }
  if (obj instanceof Object && Object.keys(obj).length === 0) {
    return true;
  }
  if (obj instanceof Array && obj.length === 0) {
    return true;
  }
  if (obj && Object.keys(obj).length === 0) {
    return true;
  }
  return false;
}

export function isRealNumber(inNumber) {
  return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
}

export function isRealBoolean(inBoolean) {
  return String(inBoolean) === "true" || String(inBoolean) === "false";
}

export function isRealBooleanOrElseNull(inBoolean) {
  return isRealBoolean(inBoolean) ? inBoolean : null;
}

export function getSubstring(string, char1, char2) {
  return string.slice(string.indexOf(char1) + 1, string.lastIndexOf(char2));
}
