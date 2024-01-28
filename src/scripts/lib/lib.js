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
