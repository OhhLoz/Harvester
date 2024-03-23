import { CONSTANTS } from "../constants/constants";
import Logger from "./Logger";
import { RetrieveHelpers } from "./retrieve-helpers";

export default class CompendiumsHelpers {
    /**
     * Define the allowed Document types which may be dynamically linked in chat
     * @type {string[]}
     */
    static DOCUMENT_LINK_TYPES = [
        "Actor",
        "Cards",
        "Item",
        "Scene",
        "JournalEntry",
        "Macro",
        "RollTable",
        "PlaylistSound",
    ];

    static PACK_ID_ITEM = `world.${CONSTANTS.MODULE_ID}-backup-do-not-delete-item`;

    static COMPENDIUM_CACHE = {};

    static async initializeCompendiumCache() {
        // Hooks.on("updateItem", async (document) => {
        //     if (!document?.pack || !document?.pack.startsWith(CompendiumsHelpers.PACK_ID_ITEM)) {
        //         return;
        //     }
        //     COMPENDIUM_CACHE[document.uuid] = document.toObject();
        // });
        // const pack = game.packs.get(CompendiumsHelpers.PACK_ID_ITEM);
        // if (pack) {
        //     for (const index of pack.index) {
        //         const item = await pack.getDocument(index._id);
        //         COMPENDIUM_CACHE[item.uuid] = item.toObject();
        //     }
        // }
        //
        // setTimeout(async () => {
        //     await updateCache();
        //     Hooks.on("updateCompendium", updateCache);
        // }, 250);
    }

    static async getCompendiumAsync(packId) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        let compendium = await RetrieveHelpers.getCompendiumCollectionAsync(packId, true, false);
        return compendium;
        // return game.packs.get(packId);
    }

    static async getCompendiumSync(packId) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        let compendium = await RetrieveHelpers.getCompendiumCollectionSync(packId, false, false);
        return compendium;
        // return game.packs.get(packId);
    }

    static async getDocumentCompendiumAsync(packId, options = { name: "", type: "", id: "", uuid: "" }) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        let compendium = await RetrieveHelpers.getCompendiumCollectionAsync(packId, false, false);
        const { name, type, id, uuid } = options;
        const document = (await compendium?.getDocuments()).find((compendiumDocument) => {
            let isFound = true;
            if (isFound && type) {
                isFound = compendiumDocument.type === type;
            }
            if (isFound && name) {
                isFound = compendiumDocument.name === name;
            }
            if (isFound && id) {
                isFound = compendiumDocument.id === id || compendiumDocument._id === id;
            }
            if (isFound && uuid) {
                isFound = compendiumDocument.uuid === uuid;
            }
            return isFound;
        });
        return document;
    }

    static getDocumentCompendiumSync(packId, options = { name: "", type: "", id: "", uuid: "" }) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        let compendium = RetrieveHelpers.getCompendiumCollectionSync(packId, true, false);
        const { name, type, id, uuid } = options;
        const document = compendium.index.find((compendiumDocument) => {
            let isFound = true;
            if (isFound && type) {
                isFound = compendiumDocument.type === type;
            }
            if (isFound && name) {
                isFound = compendiumDocument.name === name;
            }
            if (isFound && id) {
                isFound = compendiumDocument.id === id || compendiumDocument._id === id;
            }
            if (isFound && uuid) {
                isFound = compendiumDocument.uuid === uuid;
            }
            return isFound;
        });
        return document;
    }

    static async addDocumentsToCompendium(packId, documents) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        const documentsMapAdded = new Map();
        for (const documentToAdd of documents) {
            if (documentToAdd.type === "Actor") {
                const list = documentsMapAdded.get("Actor", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("Actor", list);
            } else if (documentToAdd.type === "Cards") {
                const list = documentsMapAdded.get("Cards", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("Cards", list);
            } else if (documentToAdd.type === "Item") {
                const list = documentsMapAdded.get("Item", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("Item", list);
            } else if (documentToAdd.type === "Scene") {
                const list = documentsMapAdded.get("Scene", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("Scene", list);
            } else if (documentToAdd.type === "JournalEntry") {
                const list = documentsMapAdded.get("JournalEntry", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("JournalEntry", list);
            } else if (documentToAdd.type === "Macro") {
                const list = documentsMapAdded.get("Macro", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("Macro", list);
            } else if (documentToAdd.type === "RollTable") {
                const list = documentsMapAdded.get("RollTable", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("RollTable", list);
            } else if (documentToAdd.type === "PlaylistSound") {
                const list = documentsMapAdded.get("PlaylistSound", documentToAdd) || [];
                list.push(documentToAdd);
                documentsMapAdded.set("PlaylistSound", list);
            } else {
                throw Logger.error(`This document type ${documentToAdd?.type} is not supported`, false, documentToAdd);
            }
        }

        for (let [documentType, documents] of documentsMapAdded) {
            Logger.log(`Add documents ${documentType} to ${packId}:`, documents);
            if (documentType === "Actor") {
                Actor.createDocuments(documents, { pack: packId });
            } else if (documentType === "Cards") {
                Cards.createDocuments(documents, { pack: packId });
            } else if (documentType === "Item") {
                Item.createDocuments(documents, { pack: packId });
            } else if (documentType === "Scene") {
                Scene.createDocuments(documents, { pack: packId });
            } else if (documentType === "JournalEntry") {
                JournalEntry.createDocuments(documents, { pack: packId });
            } else if (documentType === "Macro") {
                Macro.createDocuments(documents, { pack: packId });
            } else if (documentType === "RollTable") {
                RollTable.createDocuments(documents, { pack: packId });
            } else if (documentType === "PlaylistSound") {
                PlaylistSound.createDocuments(documents, { pack: packId });
            } else {
                throw Logger.error(`This document type ${documentType} is not supported`, false);
            }
        }
        return documentsMapAdded;
    }

    static async findSimilarDocumentInCompendiumAsync(packId, documentReference) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        const uuid = RetrieveHelpers.getUuid(documentReference);
        if (!uuid) {
            Logger.warn(`Cannot find document with '${documentReference}'`);
            return;
        }
        const documentToFind = await fromUuid(uuid);
        const pack = await CompendiumsHelpers.getCompendiumAsync(packId);
        const document = game.packs.get(packId).index.find((compendiumDocument) => {
            return compendiumDocument.name === documentToFind.name && compendiumDocument.type === documentToFind.type;
        });
        return document?._id ? pack.getDocument(document._id) : false;
    }

    static getDocumentFromCache(uuid) {
        return COMPENDIUM_CACHE[uuid] ?? false;
    }

    static async findOrCreateDocumentInCompendium(packId, documentData) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        let compendiumToCheck = await CompendiumsHelpers.findSimilarDocumentInCompendiumAsync(packId, documentData);
        if (!compendiumToCheck) {
            compendiumToCheck = (await CompendiumsHelpers.addDocumentsToCompendium(packId, [documentData]))[0];
        }
        COMPENDIUM_CACHE[compendiumToCheck.uuid] = documentData;
        return compendiumToCheck;
    }

    static findSimilarDocumentInCompendiumSync(packId, documentToFind) {
        if (!packId) {
            throw Logger.error(`No packId is been passed`);
        }
        let document =
            Object.values(COMPENDIUM_CACHE).find((compendiumToCheck) => {
                return compendiumToCheck.name === documentToFind.name && compendiumToCheck.type === documentToFind.type;
            }) ?? false;
        if (!document) {
            document = CompendiumsHelpers.getDocumentCompendiumSync(packId, documentToFind.name, documentToFind.type);
        }
        return document;
    }

    // =================================
    // ADDITIONAL METHODS
    // =================================
}
