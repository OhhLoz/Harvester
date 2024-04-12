
### 1.8.2-3

- Try to fix https://github.com/OhhLoz/Harvester/issues/43

### 1.8.1

- add some additional log
- update packs (remove old brt flag even is is not used...)

### 1.8.0

- Code refactor
- Add module "Item Piles" as an optional dependency, the module already has a lot of features and functionality that doesn't make sense to rewrite, plus now you can manage custom evaluations (note for the future with a little more effort we cna make this module mutlisystem XD)
- Add "Better Rolltables" as an optional dependency, the dnd5e 3.X.X force my hand here..., but the module already has a lot of features and functionality that doesn't make sense to rewrite
- Add a new "Share It" and "Keep it" options for the harvester action this should be the solution for https://github.com/OhhLoz/Harvester/issues/37, now each player can decide whether to keep the harvesting result lost (Keep it !) , or make it available to others with Item Piles (Share it !)
- Add BRT support for the loot action too (code more readable i hope...)
- Solved https://github.com/OhhLoz/Harvester/issues/31 this feature was included in BRT recently "Use Dynamic DC" (For anyone interested, this feature was included in BRT recently "Use Dynamic DC")
- Also solved https://github.com/OhhLoz/Harvester/issues/23, this feature was included in BRT recently "Inline currency data roll on table text result" (his feature was included in BRT recently),you must set a Loot Table for apply a currency
- Add a regex check on the source reference check for solve the request https://github.com/OhhLoz/Harvester/issues/27

### 1.7.9

- Some check on the actorName for better readibility
- Remove check for "Loot" type as asked on https://github.com/OhhLoz/Harvester/issues/35

### 1.7.8

- Add module settings for remove popout from the requestor module asked from https://github.com/OhhLoz/Harvester/issues/37

### 1.7.6-7

- Fix wrong "formatDragon" import from https://github.com/OhhLoz/Harvester/issues/37

### 1.7.4-5

- Add logs and some minor bug fix

### 1.7.3

- Many bug fixing and double checks
- Possible fix for (my fault on the last PR): https://github.com/OhhLoz/Harvester/issues/35
- Remove warning from https://github.com/OhhLoz/Harvester/issues/35, replace label property fro active effect with name
- Exported the json source of the pon the github project to better keep track of the modification, thee files are not "loaded " on the final build with the comand `npm run-script build`
-  Replace old nedb with new leveldb packages (the ol nedbd are still backuped under the wiki folder
- Add module settings "debug" for print additonal logs when require

### 1.7.2

- Integration with the requestor module for cleaner skill check requests from https://github.com/OhhLoz/Harvester/pull/33 ty to @p4535992
- Source label bugfix for dnd5e 2.4.0

### 1.7.1

- Cleanup of the projetc
- Add vite integration for hot reloading developing
- Add Item piles integration from https://github.com/OhhLoz/Harvester/pull/29 ty to @ctbritt
