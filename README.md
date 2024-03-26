![All Releases](https://img.shields.io/github/downloads/ohhloz/harvester/total.svg) [![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fharvester&colorB=03ff1c&style=for-the-badge)](https://forge-vtt.com/bazaar#package=harvester)

# Better Harvesting and Looting

A QoL FoundryVTT module to improve the harvesting and looting experience.

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of
the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The
SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at
https://creativecommons.org/licenses/by/4.0/legalcode.  

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://raw.githubusercontent.com/OhhLoz/Harvester/master/src/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

### libWrapper

This module uses the [libWrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping utility methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

### socketlib

This module uses the [socketlib](https://github.com/manuelVo/foundryvtt-socketlib) library for wrapping utility methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

### Better Rolltables

This module uses the [Better Rolltables](https://github.com/p4535992/foundryvtt-better-rolltables) library for wrapping utility methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

### Item Piles

This module uses the [Item Piles](https://github.com/fantasycalendar/FoundryVTT-ItemPiles) library for wrapping utility methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

## NOTE i need really help with a good documentation of this module, please someone help me...

## Harvester Feature

**IMPORTANT NOTE**: To make the module work with the requestor module you have to set the module setting of the latter with key `Module Permissions` with the value ` Request: Anyone. Accept: Only if GM or self` 

![](/wiki/images/requestor_settings.png)

This action allows the Harvesting action to be linked to a BRT rolltable retrieve the result items and display it with the "Item Piles" module for retrieval.

![](/wiki/images/harvester_requestor.png)

Given the various needs there are three modes offeature behavior 
- **"Keep It or Share It !"** : The player decides whether to keep the loot for himself or share it with others
- **"Share It"** : It is shared with others by default
- **"Keep It"** : It is kept for itself by default.

![](/wiki/images/harvester_shareit_or_keepit.png)

## Looting Feature

This action allows the Looting action to be linked to a BRT rolltable retrieve the result currencies and display it with the "Item Piles" module for retrieval.


## Integration with the module [Better Rolltables](https://github.com/p4535992/foundryvtt-better-rolltables) Feature

In the BRT Harvest Rolltable sheet, the "Source Reference" field is the one used by this module to connect the monster to the rolltable! So **"Source Reference" === "Name of The Monster" OR a regex**.

```
Example 1
Name of the monster: Wolf
Source Reference on the BRT rolltable as simple strig: Wolf
Result: get any monster 'Wolf' with a BRT Rolltbale with source reference 'Wolf'
```

```
Example 2
Name of the monster: Wolf
Source Reference on the BRT rolltable as regex: /^Wolf/ 
Result: get any monster 'Wolf' with a BRT Rolltbale with source reference stating with the string 'Wolf'
```

BRT now support multi skill integration just set a array of skills on the source reference filed on the BRT rolltable

![](/wiki/images/multi_skill_2.png)

and launch the harvester action !

![](/wiki/images/multi_skill_1.png)

REMEMBER YOU MUST PUT THE NEW ROLLTABLE IN THE BRT COMPENDIUM "better-rolltables.brt-harvest-harvester" or in the Rolltable directory of the world itself (for now).
  
# Build

## Install all packages

```bash
npm install
```

### dev

`dev` will let you develop you own code with hot reloading on the browser

```bash
npm run dev
```

### build

`build` will build and set up a symlink between `dist` and your `dataPath`.

```bash
npm run build
```

### build:watch

`build:watch` will build and watch for changes, rebuilding automatically.

```bash
npm run build:watch
```

### prettier-format

`prettier-format` launch the prettier plugin based on the configuration [here](./.prettierrc.json)

```bash
npm run-script prettier-format
```

### lint

`lint` launch the eslint process based on the configuration [here](./.eslintrc.json)

```bash
npm run-script lint
```

### lint:fix

`lint:fix` launch the eslint process with the fix argument

```bash
npm run-script lint:fix
```

## [Changelog](./CHANGELOG.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/OhhLoz/Harvester/issues)

## Licenses

This package is under an [GPL-3.0 license](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).

## Credit

Thanks to anyone who helps me with this code! I appreciate the user community's feedback on this project!

* [data-toolbox](https://foundryvtt.com/packages/data-toolbox) For providing an easy method for importing items programmatically from a csv to a compendium
* [p4535992](https://github.com/p4535992) For adding Compatibility with Better Roll Tables, Requestor & Ongoing Support
* [ctbritt](https://github.com/ctbritt) For adding Item Piles integration
