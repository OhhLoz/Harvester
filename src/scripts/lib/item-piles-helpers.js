import Logger from "./Logger";
import { RetrieveHelpers } from "./retrieve-helpers";

export default class ItemPilesHelpers {
    static PILE_DEFAULTS = {
        // Core settings
        enabled: false,
        type: "pile",
        distance: 1,
        macro: "",
        deleteWhenEmpty: "default",
        canStackItems: "yes",
        canInspectItems: true,
        displayItemTypes: false,
        description: "",

        // Overrides
        overrideItemFilters: false,
        overrideCurrencies: false,
        overrideSecondaryCurrencies: false,
        requiredItemProperties: [],

        // Token settings
        displayOne: false,
        showItemName: false,
        overrideSingleItemScale: false,
        singleItemScale: 1.0,

        // Sharing settings
        shareItemsEnabled: false,
        shareCurrenciesEnabled: true,
        takeAllEnabled: false,
        splitAllEnabled: true,
        activePlayers: false,

        // Container settings
        closed: false,
        locked: false,
        closedImage: "",
        closedImages: [],
        emptyImage: "",
        emptyImages: [],
        openedImage: "",
        openedImages: [],
        lockedImage: "",
        lockedImages: [],
        closeSound: "",
        closeSounds: [],
        openSound: "",
        openSounds: [],
        lockedSound: "",
        lockedSounds: [],
        unlockedSound: "",
        unlockedSounds: [],

        // Merchant settings
        merchantImage: "",
        infiniteQuantity: false,
        infiniteCurrencies: true,
        purchaseOnly: false,
        hideNewItems: false,
        hideItemsWithZeroCost: false,
        keepZeroQuantity: false,
        onlyAcceptBasePrice: true,
        displayQuantity: "yes",
        buyPriceModifier: 1,
        sellPriceModifier: 0.5,
        itemTypePriceModifiers: [],
        actorPriceModifiers: [],
        tablesForPopulate: [],
        merchantColumns: [],
        hideTokenWhenClosed: false,
        openTimes: {
            enabled: false,
            status: "open",
            /*
			auto = rely on simple calendar
			open = always open
			closed = always closed
			 */
            open: {
                hour: 9,
                minute: 0,
            },
            close: {
                hour: 18,
                minute: 0,
            },
        },
        closedDays: [],
        closedHolidays: [],
        refreshItemsOnOpen: false,
        refreshItemsDays: [],
        refreshItemsHolidays: [],
        logMerchantActivity: false,

        // Vault settings
        cols: 10,
        rows: 5,
        restrictVaultAccess: false,
        vaultExpansion: false,
        baseExpansionCols: 0,
        baseExpansionRows: 0,
        vaultAccess: [],
        logVaultActions: false,
        vaultLogType: "user_actor",
    };

    static FLAGS = {
        VERSION: `flags.item-piles.version`,
        PILE: `flags.item-piles.data`,
        ITEM: `flags.item-piles.item`,
        NO_VERSION: `flags.item-piles.-=version`,
        NO_PILE: `flags.item-piles.-=data`,
        NO_ITEM: `flags.item-piles.-=item`,
        LOG: `flags.item-piles.log`,
        SHARING: `flags.item-piles.sharing`,
        PUBLIC_TRADE_ID: `flags.item-piles.publicTradeId`,
        TRADE_USERS: `flags.item-piles.tradeUsers`,
        TEMPORARY_ITEM: `flags.item-piles.temporary_item`,
        CUSTOM_CATEGORY: `flags.item-piles.item.customCategory`,
    };

    static PILE_TYPES = {
        PILE: "pile",
        CONTAINER: "container",
        MERCHANT: "merchant",
        VAULT: "vault",
    };

    // ===================
    // CURRENCIES HELPERS
    // ===================

    /**
     * Turns a string of currencies into an array containing the data and quantities for each currency
     *
     * @param {string} currenciesS                               A string of currencies to convert (eg, "5gp 25sp")
     *
     * @returns {Array<object>}                                 An array of object containing the data and quantity for each currency
     */
    static retrieveCurrenciesSimpleFromString(currenciesS) {
        const c = ItemPilesHelpers.generateCurrenciesStringFromString(currenciesS);
        if (!c) {
            return "";
        }
        const arr = game.itempiles.API.getCurrenciesFromString(c);
        const currencies = {};
        for (const cc of arr) {
            const abbreviation = cc.abbreviation.toLowerCase().replace("{#}", "").trim();
            currencies[abbreviation] = (cc.roll ? cc.roll.total : cc.quantity) ?? 0;
        }
        return currencies;
    }

    /**
     * Turns a string of currencies into an array containing the data and quantities for each currency
     *
     * @param {string|object} currencies                               A string of currencies to convert (eg, "5gp 25sp")
     *
     * @returns {string}                                 A string of currencies to convert (eg, "5gp 25sp")
     */
    static generateCurrenciesStringFromString(currenciesS) {
        if (!currenciesS) {
            return "";
        }

        if (typeof currenciesS === "string" || currenciesS instanceof String) {
            let currenciesSTmp = currenciesS;
            // Convert old brt format 100*1d6[gp],4d4+4[sp] to 100*1d6gp 4d4+4sp
            currenciesSTmp = currenciesSTmp.replaceAll("[", "");
            currenciesSTmp = currenciesSTmp.replaceAll("]", "");
            currenciesSTmp = currenciesSTmp.replaceAll(",", " ");
            // Convert old harvester [[/r 5d6]]{Copper} and [[/r 1d6*100]]{Electrum}[[/r 2d6*10]]{Gold}
            currenciesSTmp = currenciesSTmp.replaceAll(/{Copper}/gi, "cp");
            currenciesSTmp = currenciesSTmp.replaceAll(/{Silver}/gi, "sp");
            currenciesSTmp = currenciesSTmp.replaceAll(/{Electrum}/gi, "ep");
            currenciesSTmp = currenciesSTmp.replaceAll(/{Gold}/gi, "gp");
            currenciesSTmp = currenciesSTmp.replaceAll(/{Platinum}/gi, "pp");
            currenciesSTmp = currenciesSTmp.replaceAll("/r", "");
            // Convert old brt loot currency formula {(2d8+1)*10[cp], 6d8+3 [sp]}
            currenciesSTmp = currenciesSTmp.replaceAll("}", "");
            currenciesSTmp = currenciesSTmp.replaceAll("{", "");
            // Remove html code base
            currenciesSTmp = currenciesSTmp.replaceAll("</p>", "");
            currenciesSTmp = currenciesSTmp.replaceAll("<p>", "");
            return currenciesSTmp.trim();
        }
        // Convert old brt currency data {gp: 3, cp: 2}
        else if (
            (typeof currenciesS === "object" || currenciesS instanceof Object) &&
            Object.keys(currenciesS)?.length > 0
        ) {
            let currenciesSTmp = "";
            for (const currencyKey of Object.keys(currenciesS)) {
                currenciesSTmp = currenciesSTmp + " " + currenciesS[currencyKey] + currencyKey;
            }
            return currenciesSTmp.trim();
        } else {
            Logger.error(`Cannot parse this currencies`, currenciesS);
            return "";
        }
    }

    /**
     *
     * @param {Actor|Token|TokenDocument} actorOrToken The actor or token to update
     * @param {Object[]|string} currencies - The array of currencies to pass to the actor
     * @param {string} currencies[].cost - The currency cost can be a number or a roll formula.
     * @param {string} currencies[].abbreviation - The currency abbreviation e.g. GP, SP.
     */
    static async addCurrencies(actorOrToken, currencies) {
        Logger.debug("addCurrencies | Currencies:", currencies);
        if (typeof currencies === "string" || currencies instanceof String) {
            if (!currencies) {
                return;
            }
            await game.itempiles.API.addCurrencies(actorOrToken, currencies);
        } else {
            if (ItemPilesHelpers._isEmptyObject(currencies)) {
                return;
            }
            // TODO waiting for item piles to fix this const currencyS = game.itempiles.API.getStringFromCurrencies(currencies);
            const currenciesForItemPiles = [];
            for (const currency of currencies) {
                if (currency.cost && currency.abbreviation) {
                    const currencyForItemPilesS = (Math.abs(Number(currency.cost)) + currency.abbreviation).trim();
                    Logger.debug("addCurrencies | Currency for Item Piles:", currencyForItemPilesS);
                    currenciesForItemPiles.push(currencyForItemPilesS);
                }
            }
            Logger.debug("addCurrencies | Currencies for Item Piles:", currenciesForItemPiles);
            const currenciesForItemPilesS = currenciesForItemPiles.join(" ");
            Logger.debug("addCurrencies | Currencies string for Item Piles:" + currenciesForItemPilesS);
            await game.itempiles.API.addCurrencies(actorOrToken, currenciesForItemPilesS);
        }
    }

    /**
     *
     * @param {Actor|Token|TokenDocument} actorOrToken The actor or token to update
     * @param {Object[]|string} currencies - The array of currencies to pass to the actor
     * @param {string} currencies[].cost - The currency cost can be a number or a roll formula.
     * @param {string} currencies[].abbreviation - The currency abbreviation e.g. GP, SP.
     * @returns {void}
     */
    static async removeCurrencies(actorOrToken, currencies) {
        Logger.debug("removeCurrencies | Currencies:", currencies);
        if (typeof currencies === "string" || currencies instanceof String) {
            if (!currencies) {
                return;
            }
            await game.itempiles.API.removeCurrencies(actorOrToken, currencies);
        } else {
            if (ItemPilesHelpers._isEmptyObject(currencies)) {
                return;
            }
            // TODO waiting for item piles to fix this const currencyS = game.itempiles.API.getStringFromCurrencies(currencies);
            const currenciesForItemPiles = [];
            for (const currency of currencies) {
                if (currency.cost && currency.abbreviation) {
                    const currencyForItemPilesS = (Math.abs(Number(currency.cost)) + currency.abbreviation).trim();
                    Logger.debug("removeCurrencies | Currency for Item Piles:", currencyForItemPilesS);
                    currenciesForItemPiles.push(currencyForItemPilesS);
                }
            }
            Logger.debug("removeCurrencies | Currencies for Item Piles:", currenciesForItemPiles);
            const currenciesForItemPilesS = currenciesForItemPiles.join(" ");
            Logger.debug("removeCurrencies | Currencies string for Item Piles:" + currenciesForItemPilesS);
            await game.itempiles.API.removeCurrencies(actorOrToken, currenciesForItemPilesS);
        }
    }

    /**
     *
     * @param {Actor|Token|TokenDocument} actorOrToken The actor or token to update
     * @param {Object[]} currencies - The array of currencies to pass to the actor
     * @param {string} currencies[].cost - The currency cost can be a number or a roll formula.
     * @param {string} currencies[].abbreviation - The currency abbreviation e.g. GP, SP.
     */
    static async updateCurrencies(actorOrToken, currencies) {
        Logger.debug("updateCurrencies | Currencies:", currencies);
        if (typeof currencies === "string" || currencies instanceof String) {
            if (!currencies) {
                return;
            }
            await game.itempiles.API.updateCurrencies(actorOrToken, currencies);
        } else {
            if (ItemPilesHelpers._isEmptyObject(currencies)) {
                return;
            }
            // TODO waiting for item piles to fix this const currencyS = game.itempiles.API.getStringFromCurrencies(currencies);
            const currenciesForItemPiles = [];
            for (const currency of currencies) {
                if (currency.cost && currency.abbreviation) {
                    const currencyForItemPilesS = (Math.abs(Number(currency.cost)) + currency.abbreviation).trim();
                    Logger.debug("updateCurrencies | Currency for Item Piles:", currencyForItemPilesS);
                    currenciesForItemPiles.push(currencyForItemPilesS);
                }
            }
            Logger.debug("updateCurrencies | Currencies for Item Piles:", currenciesForItemPiles);
            const currenciesForItemPilesS = currenciesForItemPiles.join(" ");
            Logger.debug("updateCurrencies | Currencies string for Item Piles:" + currenciesForItemPilesS);
            await game.itempiles.API.updateCurrencies(actorOrToken, currenciesForItemPilesS);
        }
    }

    /**
     *
     * @param {Actor|Token|TokenDocument} actorOrToken The actor or token to update
     * @param {Object[]} currencies - The array of currencies to pass to the actor
     * @param {string} currencies[].cost - The currency cost can be a number or a roll formula.
     * @param {string} currencies[].abbreviation - The currency abbreviation e.g. GP, SP.
     * @returns {boolean} The actor or token has enough money
     */
    static hasEnoughCurrencies(actorOrToken, currencies) {
        Logger.debug("hasEnoughCurrencies | Currencies:", currencies);
        if (typeof currencies === "string" || currencies instanceof String) {
            if (!currencies) {
                return;
            }
            const currencyInfo = game.itempiles.API.getPaymentData(currencies, { target: actorOrToken });
            return currencyInfo.canBuy;
        } else {
            if (ItemPilesHelpers._isEmptyObject(currencies)) {
                return;
            }
            // TODO waiting for item piles to fix this const currencyS = game.itempiles.API.getStringFromCurrencies(currencies);
            const currenciesForItemPiles = [];
            for (const currency of currencies) {
                if (currency.cost && currency.abbreviation) {
                    const currencyForItemPilesS = (Math.abs(Number(currency.cost)) + currency.abbreviation).trim();
                    Logger.debug("hasEnoughCurrencies | Currency for Item Piles:", currencyForItemPilesS);
                    currenciesForItemPiles.push(currencyForItemPilesS);
                }
            }
            Logger.debug("hasEnoughCurrencies | Currencies for Item Piles:", currenciesForItemPiles);
            const currenciesForItemPilesS = currenciesForItemPiles.join(" ");
            Logger.debug("hasEnoughCurrencies | Currencies string for Item Piles:" + currenciesForItemPilesS);
            const currencyInfo = game.itempiles.API.getPaymentData(currenciesForItemPilesS, { target: actorOrToken });
            return currencyInfo.canBuy;
        }
    }

    // ===================
    // LOOT HELPERS
    // ===================

    /**
     * Adds item to an actor, increasing item quantities if matches were found
     *
     * @param {Actor/TokenDocument/Token} actorOrToken            The target to add an item to
     * @param {Array} itemsToAdd                                  An array of objects, with the key "item" being an item object or an Item class (the foundry class), with an optional key of "quantity" being the amount of the item to add
     * @param {object} options                                    Options to pass to the function
     * @param {boolean} [options.removeExistingActorItems=false]  Whether to remove the actor's existing items before adding the new ones
     * @param {boolean} [options.skipVaultLogging=false]          Whether to skip logging this action to the target actor if it is a vault
     * @param {string/boolean} [options.interactionId=false]      The interaction ID of this action
     *
     * @returns {Promise<array>}                                  An array of objects, each containing the item that was added or updated, and the quantity that was added
     */
    static async addItems(
        actorOrToken,
        itemsToAdd,
        {
            removeExistingActorItems = false,
            skipVaultLogging = false,
            interactionId = false,
            mergeSimilarItems = true,
        } = {},
    ) {
        const itemsData = await game.itempiles.API.addItems(actorOrToken, itemsToAdd, {
            mergeSimilarItems: mergeSimilarItems, // NOT SUPPORTED ANYMORE FROM ITEM PILES TO REMOVE IN THE FUTURE
            removeExistingActorItems: removeExistingActorItems,
            skipVaultLogging: skipVaultLogging,
            interactionId: interactionId,
        });
        Logger.debug(`addItems | Added ${itemsToAdd.length} items to ${actorOrToken.name}`, itemsData);
        return itemsData;
    }

    /**
     * Rolls on a table of items and collates them to be able to be added to actors and such
     * @href https://fantasycomputer.works/FoundryVTT-ItemPiles/#/sample-macros?id=populate-loot-via-table
     * @param {string/Actor/Token}                                  The name, ID, UUID, or the actor itself, or an array of such
     * @param {TableResult[]} tableResults                          The tables results
     * @param {object} options                                      Options to pass to the function
     * @param {string/number} [options.timesToRoll="1"]             The number of times to roll on the tables, which can be a roll formula
     * @param {boolean} [options.resetTable=true]                   Whether to reset the table before rolling it
     * @param {boolean} [options.normalizeTable=true]               Whether to normalize the table before rolling it
     * @param {boolean} [options.displayChat=false]                 Whether to display the rolls to the chat
     * @param {object} [options.rollData={}]                        Data to inject into the roll formula
     * @param {Actor/string/boolean} [options.targetActor=false]    The target actor to add the items to, or the UUID of an actor
     * @param {boolean} [options.removeExistingActorItems=false]    Whether to clear the target actor's items before adding the ones rolled
     * @param {boolean/string} [options.customCategory=false]       Whether to apply a custom category to the items rolled
     *
     * @returns {Promise<Array<Item>>}                              An array of object containing the item data and their quantity
     */
    static async populateActorOrTokenViaTableResults(targetActor, tableResults, options = {}) {
        const newOptions = foundry.utils.mergeObject(
            {
                formula: "",
                timesToRoll: "1",
                resetTable: true,
                normalizeTable: false,
                displayChat: false,
                rollData: {},
                targetActor: false,
                removeExistingActorItems: false,
                customCategory: false,
            },
            options,
        );

        // TODO Why did wasp do this ??
        // if (newOptions.resetTable && table.uuid.startsWith("Compendium")) {
        //   newOptions.resetTable = false;
        // }
        // const tableResultsStacked = ItemPilesHelpers.stackTableResults(tableResults);

        const itemsToAdd = await ItemPilesHelpers._convertResultsToStackedItems(tableResults);
        let items = [];
        if (targetActor) {
            items = await ItemPilesHelpers.addItems(targetActor, itemsToAdd, {
                removeExistingActorItems: newOptions.removeExistingActorItems,
            });
        }

        return items;
    }

    /**
     * Rolls on a table of items and collates them to be able to be added to actors and such
     * @href https://fantasycomputer.works/FoundryVTT-ItemPiles/#/sample-macros?id=populate-loot-via-table
     * @param {string/Actor/Token}                                  The name, ID, UUID, or the actor itself, or an array of such
     * @param {string/RollTable} tableReference                     The name, ID, UUID, or the table itself, or an array of such
     * @param {object} options                                      Options to pass to the function
     * @param {string/number} [options.timesToRoll="1"]             The number of times to roll on the tables, which can be a roll formula
     * @param {boolean} [options.resetTable=true]                   Whether to reset the table before rolling it
     * @param {boolean} [options.normalizeTable=true]               Whether to normalize the table before rolling it
     * @param {boolean} [options.displayChat=false]                 Whether to display the rolls to the chat
     * @param {object} [options.rollData={}]                        Data to inject into the roll formula
     * @param {Actor/string/boolean} [options.targetActor=false]    The target actor to add the items to, or the UUID of an actor
     * @param {boolean} [options.removeExistingActorItems=false]    Whether to clear the target actor's items before adding the ones rolled
     * @param {boolean/string} [options.customCategory=false]       Whether to apply a custom category to the items rolled
     *
     * @returns {Promise<Array<Item>>}                              An array of object containing the item data and their quantity
     */
    static async rollItemTable(targetActor, tableReference, options = {}) {
        return await ItemPilesHelpers.populateActorOrTokenViaTable(targetActor, tableReference, options);
    }

    /**
     * Rolls on a table of items and collates them to be able to be added to actors and such
     * @href https://fantasycomputer.works/FoundryVTT-ItemPiles/#/sample-macros?id=populate-loot-via-table
     * @param {string/Actor/Token}                                  The name, ID, UUID, or the actor itself, or an array of such
     * @param {string/RollTable} tableReference                     The name, ID, UUID, or the table itself, or an array of such
     * @param {object} options                                      Options to pass to the function
     * @param {string/number} [options.timesToRoll="1"]             The number of times to roll on the tables, which can be a roll formula
     * @param {boolean} [options.resetTable=true]                   Whether to reset the table before rolling it
     * @param {boolean} [options.normalizeTable=true]               Whether to normalize the table before rolling it
     * @param {boolean} [options.displayChat=false]                 Whether to display the rolls to the chat
     * @param {object} [options.rollData={}]                        Data to inject into the roll formula
     * @param {Actor/string/boolean} [options.targetActor=false]    The target actor to add the items to, or the UUID of an actor
     * @param {boolean} [options.removeExistingActorItems=false]    Whether to clear the target actor's items before adding the ones rolled
     * @param {boolean/string} [options.customCategory=false]       Whether to apply a custom category to the items rolled
     *
     * @returns {Promise<Array<Item>>}                              An array of object containing the item data and their quantity
     */
    static async populateActorOrTokenViaTable(targetActor, tableReference, options = {}) {
        const table = await RetrieveHelpers.getRollTableAsync(tableReference);
        const newOptions = foundry.utils.mergeObject(
            {
                timesToRoll: "1",
                resetTable: true,
                normalizeTable: false,
                displayChat: false,
                rollData: {},
                targetActor: false,
                removeExistingActorItems: false,
                customCategory: false,
            },
            options,
        );

        if (!(typeof newOptions.timesToRoll === "string" || typeof newOptions.timesToRoll === "number")) {
            throw Logger.error(`populateActorOrTokenViaTable | timesToRoll must be of type string or number`);
        }

        if (typeof newOptions.rollData !== "object") {
            throw Logger.error(`populateActorOrTokenViaTable | rollData must be of type object`);
        }

        if (typeof newOptions.removeExistingActorItems !== "boolean") {
            throw Logger.error(`populateActorOrTokenViaTable | removeExistingActorItems of type boolean`);
        }

        // TODO Why did wasp do this ??
        if (newOptions.resetTable && table.uuid.startsWith("Compendium")) {
            newOptions.resetTable = false;
        }

        // START MOD 4535992
        /*
    let items = await ItemPilesHelpers.rollTable({
      tableUuid: table,
      formula: timesToRoll,
      normalize: normalizeTable,
      resetTable,
      displayChat,
      rollData,
      customCategory,
    });
    if (targetActor) {
        const itemsToAdd = items.map((item) => {
            const actualItem = item.item.toObject();
            return Utilities.setItemQuantity(actualItem, item.quantity);
        });
        items = await this._addItems(targetActor, itemsToAdd, userId, { removeExistingActorItems });
    }
    */
        let itemsToAdd = await ItemPilesHelpers.rollTable(table, newOptions);
        let items = [];
        // END MOD 4535992

        if (targetActor) {
            items = await ItemPilesHelpers.addItems(targetActor, itemsToAdd, {
                removeExistingActorItems: newOptions.removeExistingActorItems,
            });
        }

        return items;
    }

    /**
     * @returns {Promise<array>}  An array of objects, each containing the item that was added or updated, and the quantity that was added
     */
    static async retrieveItemsDataFromRollTable(table, options) {
        return await ItemPilesHelpers.rollTable(table, options);
    }

    /**
     * @href https://github.com/fantasycalendar/FoundryVTT-ItemPiles/blob/master/src/helpers/pile-utilities.js#L1885
     * @param {RollTable|string} tableReference
     * @param {Object} options
     * @returns {Promise<ItemData[]>} Item Data
     */
    static async rollTable(tableReference, options) {
        const table = await RetrieveHelpers.getRollTableAsync(tableReference);

        const formula = table.formula;
        const resetTable = !!options.resetTable; // true;
        const normalize = !!options.normalize; // false;
        const displayChat = options.displayChat;
        const rollData = options.roll;
        const customCategory = !!options.customCategory; // false
        const recursive = !!options.recursive; // true

        if (!options.formula) {
            options.formula = table.formula;
        }

        //const table = await fromUuid(tableUuid);

        if (!table.uuid.startsWith("Compendium")) {
            if (resetTable) {
                await table.reset();
            }

            if (normalize) {
                await table.update({
                    results: table.results.map((result) => ({
                        _id: result.id,
                        weight: result.range[1] - (result.range[0] - 1),
                    })),
                });
                await table.normalize();
            }
        }

        // START MOD 4535992
        /*
        const roll = new Roll(formula.toString(), rollData).evaluate({ async: false });
        if (roll.total <= 0) {
        return [];
        }
        let results = [];
        if (game.modules.get("better-rolltables")?.active) {
            results = (await game.modules.get("better-rolltables").api.roll(table)).itemsData.map(result => ({
                documentCollection: result.documentCollection,
                documentId: result.documentId,
                text: result.text || result.name,
                img: result.img,
                quantity: 1
            }));
        } else {
            results = (await table.drawMany(roll.total, { displayChat, recursive: true })).results;
        }
        */
        options.displayChat = false;
        const results = await game.modules.get("better-rolltables").api.betterTableRoll(table, options);
        // END MOD 4535992

        // const rolledItems = [];
        // for (const rollData of results) {
        //   let rolledQuantity = rollData?.quantity ?? 1;
        //   let item;
        //   if (rollData.documentCollection === "Item") {
        //     item = game.items.get(rollData.documentId);
        //   } else {
        //     const compendium = game.packs.get(rollData.documentCollection);
        //     if (compendium) {
        //       item = await compendium.getDocument(rollData.documentId);
        //     }
        //   }
        //   if (item instanceof RollTable) {
        //     Logger.error(
        //       `'item instanceof RollTable', It shouldn't never go here something go wrong with the code please contact the brt developer`
        //     );
        //     rolledItems.push(
        //       ...(await ItemPilesHelpers.rollTable({ tableUuid: item.uuid, resetTable, normalize, displayChat }))
        //     );
        //   } else if (item instanceof Item) {
        //     const quantity = Math.max(ItemPilesHelpers.getItemQuantity(item) * rolledQuantity, 1);
        //     rolledItems.push({
        //       ...rollData,
        //       item,
        //       quantity,
        //     });
        //   }
        // }

        // const items = [];
        // rolledItems.forEach((newItem) => {
        //   // MOD 4535992
        //   const existingItem = ItemPilesHelpers.findSimilarItem(items, newItem);
        //   //  const existingItem = items.find((item) => item.documentId === newItem.documentId);
        //   if (existingItem) {
        //     existingItem.quantity += Math.max(newItem.quantity, 1);
        //   } else {
        //     setProperty(newItem, ItemPilesHelpers.FLAGS.ITEM, getProperty(newItem.item, ItemPilesHelpers.FLAGS.ITEM));
        //     if (
        //       game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE &&
        //       !getProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE)
        //     ) {
        //       setProperty(
        //         newItem,
        //         game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE,
        //         ItemPilesHelpers.getItemQuantity(newItem.item)
        //       );
        //     }
        //     if (customCategory) {
        //       setProperty(newItem, ItemPilesHelpers.FLAGS.CUSTOM_CATEGORY, customCategory);
        //     }
        //     items.push({
        //       ...newItem,
        //     });
        //   }
        // });

        // const itemsRetrieved = items.map((item) => {
        //   const itemData = item.item instanceof Item ? item.item.toObject() : item.item;
        //   const actualItem = itemData; // item.item.toObject();
        //   return ItemPilesHelpers.setItemQuantity(actualItem, item.quantity);
        // });

        // return itemsRetrieved;
        const itemsRetrieved = await ItemPilesHelpers._convertResultsToStackedItems(results, options);
        return itemsRetrieved;
    }

    static async _convertResultsToStackedItems(results, options = {}) {
        // const formula = options.formula;
        const resetTable = !!options.resetTable; // true;
        const normalize = !!options.normalize; // false;
        const displayChat = options.displayChat;
        const rollData = options.roll;
        const customCategory = !!options.customCategory; // false
        const recursive = !!options.recursive; // true

        const rolledItems = [];
        for (const rollData of results) {
            // START MOD 4535992
            /*
            let rolledQuantity = rollData?.quantity ?? 1;
            let item;
            if (rollData.documentCollection === "Item") {
            item = game.items.get(rollData.documentId);
            } else {
            const compendium = game.packs.get(rollData.documentCollection);
            if (compendium) {
                item = await compendium.getDocument(rollData.documentId);
            }
            }
            if (item instanceof RollTable) {
            Logger.error(
                `'item instanceof RollTable', It shouldn't never go here something go wrong with the code please contact the brt developer`
            );
            rolledItems.push(
                ...(await ItemPilesHelpers.rollTable({ tableUuid: item.uuid, resetTable, normalize, displayChat }))
            );
            } else if (item instanceof Item) {
            const quantity = Math.max(ItemPilesHelpers.getItemQuantity(item) * rolledQuantity, 1);
            rolledItems.push({
                ...rollData,
                item,
                quantity,
            });
            }
            */
            // TODO find a better way for do this, BRT already manage the one quantity behaviour
            // let rolledQuantity = rollData?.quantity ?? 1;
            let rolledQuantity = 1;
            const itemTmp = await game.modules.get("better-rolltables").api.resultToItemData(rollData);
            if (!itemTmp) {
                Logger.debug(
                    `The result '${rollData.name + "|" + rollData.documentId}' is not a valid link anymore`,
                    true,
                );
                continue;
            }
            if (itemTmp instanceof RollTable) {
                Logger.error(
                    `'itemTmp instanceof RollTable', It shouldn't never go here something go wrong with the code please contact the brt developer`,
                );
                rolledItems.push(
                    ...(await ItemPilesHelpers.rollTable({
                        tableUuid: itemTmp.uuid,
                        resetTable: resetTable,
                        normalize: normalize,
                        displayChat: displayChat,
                    })),
                );
            } else {
                const quantity = Math.max(ItemPilesHelpers.getItemQuantity(itemTmp) * rolledQuantity, 1);
                rolledItems.push({
                    ...rollData,
                    item: itemTmp,
                    quantity: quantity,
                });
            }
            // END MOD 4535992
        }

        const items = [];
        rolledItems.forEach((newItem) => {
            // MOD 4535992
            const existingItem = ItemPilesHelpers.findSimilarItem(items, newItem);
            //  const existingItem = items.find((item) => item.documentId === newItem.documentId);
            if (existingItem) {
                existingItem.quantity += Math.max(newItem.quantity, 1);
            } else {
                setProperty(
                    newItem,
                    ItemPilesHelpers.FLAGS.ITEM,
                    getProperty(newItem.item, ItemPilesHelpers.FLAGS.ITEM),
                );
                if (
                    game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE &&
                    !getProperty(newItem, game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE)
                ) {
                    setProperty(
                        newItem,
                        game.itempiles.API.QUANTITY_FOR_PRICE_ATTRIBUTE,
                        ItemPilesHelpers.getItemQuantity(newItem.item),
                    );
                }
                if (customCategory) {
                    setProperty(newItem, ItemPilesHelpers.FLAGS.CUSTOM_CATEGORY, customCategory);
                }
                items.push({
                    ...newItem,
                });
            }
        });

        const itemsRetrieved = items.map((item) => {
            const itemData = item.item instanceof Item ? item.item.toObject() : item.item;
            const actualItem = itemData; // item.item.toObject();
            return ItemPilesHelpers.setItemQuantity(actualItem, item.quantity);
        });

        return itemsRetrieved;
    }

    /**
     * Returns a given item's quantity
     *
     * @param {Item/Object} item
     * @returns {number}
     */
    static getItemQuantity(item) {
        const itemData = item instanceof Item ? item.toObject() : item;
        return Number(getProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE) ?? 0);
    }

    /**
     * Returns whether an item has the quantity property
     *
     * @param {Item/Object} item
     * @returns {Boolean}
     */
    static hasItemQuantity(item) {
        const itemData = item instanceof Item ? item.toObject() : item;
        return hasProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE);
    }

    /**
     * Returns a given item's quantity
     *
     * @param {Object} itemData
     * @param {Number} quantity
     * @param {Boolean} requiresExistingQuantity
     * @returns {Object}
     */
    static setItemQuantity(item, quantity, requiresExistingQuantity = false) {
        const itemData = item instanceof Item ? item.toObject() : item;
        // if (!requiresExistingQuantity || ItemPilesHelpers.getItemTypesThatCanStack().has(itemData.type) || ItemPilesHelpers.hasItemQuantity(itemData)) {
        if (!requiresExistingQuantity || ItemPilesHelpers.hasItemQuantity(itemData)) {
            setProperty(itemData, game.itempiles.API.ITEM_QUANTITY_ATTRIBUTE, quantity);
        }
        return itemData;
    }

    /**
     * Returns a given item's cost/price
     *
     * @param {Item/Object} item
     * @returns {number}
     */
    static getItemCost(item) {
        const itemData = item instanceof Item ? item.toObject() : item;
        return getProperty(itemData, game.itempiles.API.ITEM_PRICE_ATTRIBUTE) ?? 0;
    }

    /**
     * Returns whether an item has the cost/price property
     *
     * @param {Item/Object} item
     * @returns {Boolean}
     */
    static hasItemCost(item) {
        const itemData = item instanceof Item ? item.toObject() : item;
        return hasProperty(itemData, game.itempiles.API.ITEM_PRICE_ATTRIBUTE);
    }

    /**
     * Returns a given item's cost/price
     *
     * @param {Object} itemData
     * @param {Number} cost
     * @param {Boolean} requiresExistingCost
     * @returns {Object}
     */
    static setItemCost(item, cost, requiresExistingCost = false) {
        const itemData = item instanceof Item ? item.toObject() : item;
        if (!requiresExistingCost || ItemPilesHelpers.hasItemCost(itemData)) {
            setProperty(itemData, game.itempiles.API.ITEM_PRICE_ATTRIBUTE, cost);
        }
        return itemData;
    }

    /**
     * Find and retrieves an item in a list of items
     *
     * @param {Array<Item|Object>} items
     * @param {Item|Object} findItem
     * @param {object} options
     * @param {boolean} returnOne
     * @returns {*}
     */
    static findSimilarItem(itemsToSearch, itemToFind, { returnOne = true } = {}) {
        return game.itempiles.API.findSimilarItem(itemsToSearch, itemToFind, {
            returnOne: returnOne,
        });
    }

    // ==============================
    // ADDITIONAL HELPER
    // =============================

    static stackTableResults(rolledResult) {
        const resultsStacked = [];
        rolledResult.forEach((newResult) => {
            let isResultHidden = getProperty(newResult, `flags.better-rolltables.brt-hidden-table`) || false;
            // MOD 4535992
            //const existingItem = resultsStacked.find((item) => ItemPilesHelpers.findSimilarItem(item, newResult));
            const existingItem = resultsStacked.find((r) => {
                // Merge by hidden property
                let isResultHidden2 = getProperty(r, `flags.better-rolltables.brt-hidden-table`) || false;
                // MOD 4535992
                if (r.documentId && newResult.documentId) {
                    return r.documentId === newResult.documentId && isResultHidden === isResultHidden2;
                } else {
                    return r._id === newResult._id && isResultHidden === isResultHidden2;
                }
            });
            if (!ItemPilesHelpers._isRealNumber(newResult.quantity)) {
                newResult.quantity = 1;
            }
            if (existingItem) {
                existingItem.quantity += Math.max(newResult.quantity, 1);
            } else {
                resultsStacked.push({
                    ...newResult,
                });
            }
        });

        return resultsStacked;
    }

    /**
     * Converts the provided token to a item piles lootable sheet check out the documentation from the itempiles page
     * @href https://fantasycomputer.works/FoundryVTT-ItemPiles/#/api?id=turntokensintoitempiles
     * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/single-loot-pile.js#L77
     * @param {Array<Token|TokenDocument} tokensTarget
     * @param {object} options	object	Options to pass to the function
     * @param {boolean} options.applyDefaultImage little utility for lazy people apply a default image
     * @param {boolean} options.applyDefaultLight little utility for lazy people apply a default light
     * @param {boolean} options.isSinglePile little utility it need 'warpgate' module installed and active for merge all the token items in one big item piles
     * @param {boolean} options.deleteTokens only if singlePile is true it will delete all tokens
     * @param {object} tokenSettings Overriding settings that will update the tokens settings
     * @param {object} pileSettings Overriding settings to be put on the item piles’ settings - see pile flag defaults
     * @returns {Promise<Array>} The uuids of the targets after they were turned into item piles
     */
    static async convertTokensToItemPiles(
        tokensTarget,
        options = {
            applyDefaultLight: true,
            untouchedImage: "",
            isSinglePile: false,
            deleteTokens: false,
            addCurrency: false,
        },
        tokenSettings = { rotation: 0 },
        pileSettings = {
            openedImage: "",
            emptyImage: "",
            type: game.itempiles.pile_types.CONTAINER,
            deleteWhenEmpty: false,
            activePlayers: true,
            closed: true,
        },
    ) {
        const tokens = Array.isArray(tokensTarget) ? tokensTarget : [tokensTarget];
        const token = tokens[0];
        const { applyDefaultLight, untouchedImage, isSinglePile, deleteTokens } = options;

        if (applyDefaultLight) {
            let light = {
                dim: 0.2,
                bright: 0.2,
                luminosity: 0,
                alpha: 1,
                color: "#ad8800",
                coloration: 6,
                animation: {
                    // type:"sunburst",
                    type: "radialrainbow",
                    speed: 3,
                    intensity: 10,
                },
            };
            mergeObject(tokenSettings, { light: light });
        }

        if (game.modules.get("warpgate")?.active && isSinglePile) {
            let activeEffectUpdates = token.actor.effects.reduce((acc, curr) => {
                acc[curr.data.label] = warpgate.CONST.DELETE;
                return acc;
            }, {});

            let updates = {
                token: {
                    "texture.src": untouchedImage ? untouchedImage : token.img,
                    name: `Pile of ${token.name}`,
                },
                actor: {
                    // system: { currency: token.actor?.system?.currency ?? { gp: 0, sp: 0, cp: 0 } },
                    name: `Pile of ${token.name}`,
                },
                embedded: {
                    ActiveEffect: activeEffectUpdates ? activeEffectUpdates : null,
                    Item: {},
                },
            };

            //map the update data
            const singlePile = tokens.reduce((acc, tok) => {
                if (tok.id === token.id) {
                    return acc;
                }
                // get their items
                const items = tok.actor.items.reduce((acc, item) => {
                    if (ItemPilesHelpers._shouldBeLoot(item)) {
                        acc[randomID()] = item.toObject();
                    }
                    return acc;
                }, {});

                foundry.utils.mergeObject(acc.embedded.Item, items);
                return acc;
            }, updates);

            if (deleteTokens) {
                const toDelete = tokens.filter((t) => t.id !== token.id).map((t) => t.id);
                await canvas.scene.deleteEmbeddedDocuments("Token", toDelete);
            }

            await warpgate.mutate(
                token.document,
                singlePile,
                {},
                { permanent: true, comparisonKeys: { ActiveEffect: "label", Item: "id" } },
            );

            const newTargets = await game.itempiles.API.turnTokensIntoItemPiles([token], {
                pileSettings: pileSettings,
                tokenSettings: tokenSettings,
            });
            return newTargets;
        } else if (isSinglePile) {
            Logger.warn(`You select the "single pile" feature but the module 'warpgate' is not installed`, true);
            return [];
        } else {
            const newTargets = await game.itempiles.API.turnTokensIntoItemPiles(tokens, {
                pileSettings: pileSettings,
                tokenSettings: tokenSettings,
            });
            return newTargets;
        }
    }

    /**
     * Whether an item pile is locked. If it is not enabled or not a container, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isItemPileLocked(target, data = false) {
        return game.itempiles.API.isItemPileLocked(target, data);
    }

    /**
     * Whether an item pile is closed. If it is not enabled or not a container, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isItemPileClosed(target, data = false) {
        return game.itempiles.API.isItemPileClosed(target, data);
    }

    /**
     * Whether an item pile is a valid item pile. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isValidItemPile(target, data = false) {
        return game.itempiles.API.isValidItemPile(target, data);
    }

    /**
     * Whether an item pile is a regular item pile. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isRegularItemPile(target, data = false) {
        return game.itempiles.API.isRegularItemPile(target, data);
    }

    /**
     * Whether an item pile is a container. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isItemPileContainer(target, data = false) {
        return game.itempiles.API.isItemPileContainer(target, data);
    }

    /**
     * Whether an item pile is a lootable. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isItemPileLootable(target, data = false) {
        return game.itempiles.API.isItemPileLootable(target, data);
    }

    /**
     * Whether an item pile is a vault. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isItemPileVault(target, data = false) {
        return game.itempiles.API.isItemPileVault(target, data);
    }

    /**
     * Whether an item pile is a merchant. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isItemPileMerchant(target, data = false) {
        return game.itempiles.API.isItemPileMerchant(target, data);
    }

    /**
     * Whether an item pile is a merchant. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @param {Object/boolean} [data=false] data existing flags data to use
     * @return {boolean}
     */
    static isItemPileAuctioneer(target, data = false) {
        return game.itempiles.API.isItemPileAuctioneer(target, data);
    }

    /**
     * Whether an item pile is empty pile. If it is not enabled, it is always false.
     *
     * @param {Token/TokenDocument} target
     * @return {boolean}
     */
    static isItemPileEmpty(target) {
        return game.itempiles.API.isItemPileEmpty(target);
    }
    /**
     * Whether an item pile is stackable. If it is not enabled, it is always false.
     *
     * @param {Item} target
     * @return {boolean}
     */
    static isItemStackable(target) {
        return game.itempiles.API.canItemStack(target);
    }

    // ======================================
    // PRIVATE METHODS
    // ========================================

    /**
     * It is recommended to add the following filter to Item Pile's default filter: system.weaponType | natural. Which will filter out the natural weapons found on many creatures. Alternatively, define the `shouldBeLoot` filter function
     * @param {Item5e} item
     * @returns {boolean}
     */
    static _shouldBeLoot(item) {
        // TODO
        return game.itempiles.API.canItemStack(item);
    }

    static _isEmptyObject(obj) {
        // because Object.keys(new Date()).length === 0;
        // we have to do some additional check
        if (obj === null || obj === undefined) {
            return true;
        }
        if (ItemPilesHelpers._isRealNumber(obj)) {
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

    static _isRealNumber(inNumber) {
        return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
    }
}
