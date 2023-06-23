data[i].img = "icons/creatures/abilities/paw-print-tan.webp"
var tempStr = data[i].title.replace(/[()]/g, "").replace(/[/]/g, " ")
//console.log(tempStr);
var temp = tempStr.split(" ")//.reverse();
//console.log(temp);
temp.forEach((titleElement) =>
{
    var lowercase = titleElement.toLowerCase();
    switch(lowercase)
    {
        case "beak":
        case "beaks":
            data[i].img = "icons/commodities/bones/beak-hooked-red.webp"
            break;
        case "claw":
        case "claws":
        case "hook":
        case "hooks":
            data[i].img = "icons/commodities/claws/claw-brown-black.webp"
            break;
        case "bone":
        case "bones":
            data[i].img = "icons/commodities/bones/bones-stack-yellow.webp"
            break;
        case "wing":
        case "wings":
            data[i].img = "icons/commodities/biological/wing-lizard-brown.webp"
            break;
        case "leather":
            data[i].img = "icons/commodities/leather/leather-worn-tan.webp"
            break;
        case "pelt":
        case "pelts":
        case "hide":
            data[i].img = "icons/commodities/leather/fur-pelt-off-white.webp"
            break;
        case "gland":
        case "glands":
            data[i].img = "icons/commodities/biological/organ-heart-black.webp"
            break;
        case "fur":
        case "mane":
            data[i].img = "icons/commodities/leather/fur-white-tan.webp"
            break;
        case "shard":
            data[i].img = "icons/commodities/gems/gem-shattered-blue.webp"
            break;
        case "silk":
        case "thread":
            data[i].img = "icons/commodities/cloth/yarn-skein-white-red.webp"
            break;
        case "chain":
        case "chains":
            data[i].img = "icons/commodities/metal/chain-steel.webp"
            break;
        case "toe":
        case "toes":
        case "toenails":
        case "feet":
        case "knucklebones":
            data[i].img = "icons/commodities/biological/foot-black-grey.webp"
            break;
        case "eye":
        case "eyes":
        case "eyeball":
            data[i].img = "icons/commodities/biological/eye-brown-red.webp"
            break;
        case "eyestalk":
            data[i].img = "icons/commodities/biological/eye-tentacle-grey-orange.webp"
            break;
        case "horn":
        case "horns":
            data[i].img = "icons/commodities/bones/horn-simple-grey.webp"
            break;
        case "feather":
        case "feathers":
            data[i].img = "icons/commodities/materials/feather-white.webp"
            break;
        case "heart":
            data[i].img = "icons/commodities/biological/organ-heart-red.webp"
            break;
        case "shell":
            data[i].img = "icons/commodities/biological/shell-turtle-grey.webp"
            break;
        case "chitin":
        case "plate":
        case "plates":
        case "carapace":
            data[i].img = "icons/commodities/biological/shell-tan.webp"
            break;
        case "tentacle":
        case "tentacles":
            data[i].img = "icons/commodities/biological/tentacle-purple-white.webp"
            break;
        case "vine":
        case "vines":
            data[i].img = "icons/commodities/biological/tentacle-thorned-green.webp"
            break;
        case "tongue":
            data[i].img = "icons/commodities/biological/tongue-red.webp"
            break;
        case "blubber":
            data[i].img = "icons/commodities/materials/slime-white.webp"
            break;
        case "essence":
            data[i].img = "icons/commodities/materials/glass-orb-teal.webp"
            break;
        case "fish":
            data[i].img = "icons/environment/creatures/fish-scaled-yellow-grey.webp"
            break;
        case "brain":
            data[i].img = "icons/commodities/biological/organ-brain-pink-purple.webp"
            break;
        case "hand":
            data[i].img = "icons/commodities/biological/hand-clawed-blue.webp"
            break;
        case "scale":
        case "scales":
            data[i].img = "icons/commodities/leather/scales-brown.webp"
            break;
        case "talon":
        case "talons":
            data[i].img = "icons/commodities/claws/claw-bird-pink.webp"
            break;
        case "tail":
            data[i].img = "icons/commodities/biological/tail-rodent-orange.webp"
            break;
        case "tooth":
        case "molar":
            data[i].img = "icons/commodities/bones/tooth-hollow-brown.webp"
            break;
        case "fang":
            data[i].img = "icons/commodities/bones/teeth-pointed-white.webp"
            break;
        case "teeth":
            data[i].img = "icons/commodities/bones/bone-jaw-white.webp"
            break;
        case "stone":
            data[i].img = "icons/commodities/stone/ore-chunk-red.webp"
            break;
        case "cords":
            data[i].img = "icons/consumables/meat/chicken-breast-raw-pink.webp"
            break;
        case "skull":
            data[i].img = "icons/commodities/bones/skull-deformed-white.webp"
            break;
        case "head":
            data[i].img = "icons/commodities/bones/skull-tusked-grey.webp"
            break;
        case "core":
            data[i].img = "icons/commodities/gems/pearl-brown-red.webp"
            break;
        case "ectoplasm":
            data[i].img = "icons/commodities/materials/liquid-blue.webp"
            break;
        case "fluid":
        case "saliva":
            data[i].img = "icons/commodities/materials/liquid-green.webp"
            break;
        case "puffball":
            data[i].img = "icons/commodities/materials/plant-sprout-teal.webp"
            break;
        case "antenna":
        case "antennae":
            data[i].img = "icons/commodities/biological/antenna-blue.webp"
            break;
        case "membrane":
        case "membranes":
            data[i].img = "icons/commodities/biological/pustules-red.webp"
            break;
        case "blood":
            data[i].img = "icons/consumables/potions/vial-cork-red.webp"
            break;
        case "sap":
            data[i].img = "icons/consumables/potions/potion-vial-tube-yellow.webp"
            break;
        case "skin":
        case "skins":
            data[i].img = "icons/commodities/leather/leather-bolt-grey.webp"
            break;
        case "spine":
            data[i].img = "icons/commodities/bones/bone-spine-white.webp"
            break;
        case "hair":
            data[i].img = "icons/commodities/materials/hair-tuft-gold.webp"
            break;
        case "slime":
            data[i].img = "icons/commodities/materials/slime-thick-blue.webp"
            break;
        case "metal":
            data[i].img = "icons/commodities/metal/barstock-broken-steel.webp"
            break;
        case "pearl":
            data[i].img = "icons/commodities/gems/pearls-white.webp"
            break;
        case "bark":
            data[i].img = "icons/commodities/wood/bark-beige.webp"
            break;
        case "tusk":
        case "tusks":
            data[i].img = "icons/commodities/bones/horn-engraved-stripes-white.webp"
            break;
        case "mark":
        case "tattoo":
            data[i].img = "icons/magic/symbols/rune-sigil-black-pink.webp"
            break;
        case "fin":
        case "fins":
                data[i].img = "icons/commodities/biological/fin-red-green.webp"
                break;
        case "liver":
            data[i].img = "icons/commodities/biological/organ-liver-red.webp"
            break;
        case "stomach":
            data[i].img = "icons/commodities/biological/organ-stomach.webp"
            break;
        case "intestine":
        case "intestines":
            data[i].img = "icons/commodities/biological/organ-intestines-red.webp"
            break;
        case "ear":
        case "ears":
            data[i].img = "icons/commodities/biological/ear-grey-brown.webp"
            break;
        case "antler":
        case "antlers":
            data[i].img = "icons/commodities/bones/horn-antler-tan.webp"
            break;
        case "stinger":
            data[i].img = "icons/creatures/abilities/stinger-poison-scorpion-brown.webp"
            break;
        case "needle":
        case "needles":
        case "spines":
        case "spike":
            data[i].img = "icons/commodities/bones/tooth-spiked-brown.webp"
            break;
        case "jaw":
            data[i].img = "icons/commodities/bones/bone-jaw-teeth-brown.webp"
            break;
        case "carcass":
            data[i].img = "icons/commodities/bones/bones-rib-white.webp"
            break;
        case "pincer":
        case "pincers":
        case "mandible":
        case "mandibles":
            data[i].img = "icons/commodities/biological/mouth-pincer-brown.webp"
            break;
        case "seed":
        case "seeds":
            data[i].img = "icons/consumables/nuts/pistachios-nute-shell-green-white.webp"
            break;
        case "meat":
            data[i].img = "icons/consumables/meat/steak-raw-red-pink.webp"
            break;
        case "egg":
        case "eggs":
            data[i].img = "icons/consumables/eggs/egg-speckled-tan.webp"
            break;
        case "tendril":
            data[i].img = "icons/creatures/tentacles/tentacles-thing-green.webp"
            break;
        case "coil":
            data[i].img = "icons/commodities/tech/coil-steel.webp"
            break;
        case "hoof":
        case "hooves":
            data[i].img = "icons/commodities/bones/hooves-cloven-brown.webp"
            break;
        case "gem":
            data[i].img = "icons/commodities/gems/gem-faceted-round-white.webp"
            break;
        case "flask":
            data[i].img = "icons/consumables/potions/potion-jar-corked-glowing-blue.webp"
            break;
        case "pouch":
        case "pouches":
        case "bundle":
            data[i].img = "icons/containers/bags/coinpouch-simple-leather-brown.webp"
            break;
        case "bag":
        case "bags":
            data[i].img = "icons/containers/bags/pack-canvas-white-brown.webp"
            break;
        case "vial":
        case "vials":
            data[i].img = "icons/consumables/potions/vial-cork-empty.webp"
            break;
        case "sack":
        case "sacks":
            data[i].img = "icons/containers/bags/sack-leather-tan.webp"
            break;
        case "powder":
        case "dust":
        case "ash":
            data[i].img = "icons/commodities/materials/bowl-powder-gold.webp"
            break;
    }
})