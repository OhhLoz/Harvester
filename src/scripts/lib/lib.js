import { CONSTANTS } from "../constants";
import Logger from "./Logger";

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

/**
 * Here is a little function that checks the validity of both types of regexes, strings or patterns
 * The user will be able to test both 'test' and '/test/g'.
 * let a = validateRegex("/test/i");
 * let b = new RegExp("/test/i");
 * let s = "teSt";
 * let t1 = a.test(s); // true
 * let t2 = b.test(s); // false
 * @href https://stackoverflow.com/questions/17250815/how-to-check-if-the-input-string-is-a-valid-regular-expression
 * @param {*} pattern
 * @returns
 */
export function testWithRegex(stringToCheck, pattern = "") {
    let patternTmp = pattern ? pattern : `/^${stringToCheck}$/i`; // .match(/^([a-z0-9]{5,})$/);
    try {
        let t1 = stringToCheck.match(patternTmp);
        return t1;
    } catch (e) {
        Logger.error("Regex error", false, e);
        return false;
    }
}

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
