const dragonIgnoreArr =
[
    "Amethyst",
    "Black",
    "Blue",
    "Brass",
    "Bronze",
    "Copper",
    "Crystal",
    "Deep",
    "Emerald",
    "Gold",
    "Green",
    "Lunar",
    "Moonstone",
    "Red",
    "Sapphire",
    "Silver",
    "Solar",
    "Topaz",
    "White"
]

const currencyMap = new Map(
[
    ["Copper", "cp"],
    ["Silver", "sp"],
    ["Electrum", "ep"],
    ["Gold", "gp"],
    ["Platinum", "pp"]
])

const sizeHashMap = new Map(
[
    ["tiny", 5],
    ["sm", 5],
    ["med", 5],
    ["lg", 11],
    ["huge", 14.2],
    ["grg", 17.7]
])

const skillMap = new Map(
[
    ["Acrobatics", "acr"],
    ["Animal Handling", "ani"],
    ["Arcana", "arc"],
    ["Athletics", "ath"],
    ["Deception", "dec"],
    ["History", "his"],
    ["Insight", "ins"],
    ["Investigation", "inv"],
    ["Intimidation", "itm"],
    ["Medicine", "med"],
    ["Nature", "nat"],
    ["Persuasion", "per"],
    ["Perception", "prc"],
    ["Performance", "prf"],
    ["Religion", "rel"],
    ["Sleight of Hand", "slt"],
    ["Stealth", "ste"],
    ["Survival", "sur"]
])

export const CONSTANTS =
{
    harvestActionId : "ich3SV1HXRlq8K32",
    harvestActionEffectId : "0plmpCQ8D2Ezc1Do",
    harvestActionEffectName : "Harvested",
    harvestActionEffectIcon : "icons/svg/pawprint.svg",
    lootActionId : "yaMtYJlcLh9mSBQI",
    lootActionEffectId : "KiM9NV0Od4a27JmY",
    lootActionEffectName : "Looted",
    lootActionEffectIcon : "icons/svg/coins.svg",
    actionCompendiumId : "harvester.actions",
    harvestCompendiumId : "harvester.harvest",
    lootCompendiumId : "harvester.loot",
    customCompendiumId : "harvester.custom",
    dragonIgnoreArr : dragonIgnoreArr,
    currencyMap: currencyMap,
    sizeHashMap: sizeHashMap,
    currencyMap: currencyMap,
    skillMap: skillMap
}