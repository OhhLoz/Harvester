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