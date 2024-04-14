const api = game.modules.get("harvester").api;

console.log("Test 1 : " + api.testWithRegex("Shadow Demon", "Shadow Demon Arcane")); // false
console.log("Test 2 : " + api.testWithRegex("Shadow Demon Arcane", "Shadow Demon Arcane")); // true
console.log("Test 3 : " + api.testWithRegex("Shadow Demon Arcane", "Shadow Demon")); // true
console.log("Test 4 : " + api.testWithRegex("Shadow Demon BBB", "Shadow Demon")); // true
console.log("Test 5 : " + api.testWithRegex("Shadow Demon BBB", "Shadow Demon Arcane")); // false

console.log("Test 6 : " + api.testWithRegex("Shadow Demon Warrior", "Shadow Demon Arcane")); // false
console.log("Test 7 : " + api.testWithRegex("Shadow Demon Guard", "Shadow Demon Arcane")); // false
console.log("Test 8 : " + api.testWithRegex("Shadow Demon Cro", "Shadow Demon")); // true
console.log("Test 9 : " + api.testWithRegex("Shadow Demon Witchdoctor", "Shadow Demon")); // true

console.log("Test 10 : " + api.testWithRegex("Shadow Demon BBB", "(.*?)Shadow Demon Arcane(.*?)")); // false
console.log("Test 11 : " + api.testWithRegex("Shadow Demon Arcane", "(.*?)Shadow Demon Arcane(.*?)")); // true
console.log("Test 12 : " + api.testWithRegex("Shadow Demon", "(.*?)Shadow Demon(.*?)")); // true
console.log("Test 13 : " + api.testWithRegex("Shadow Demon BBB", "(.*?)Shadow Demon(.*?)")); // true
console.log("Test 14 : " + api.testWithRegex("Shadow Demon Arcane", "(.*?)Shadow Demon(.*?)")); // true
