import { HarvesterItem } from "./ItemHarvester.js";

/**
 * A class made to make managing the operations for an Item sheet easier.
 */
export class ItemSheetHarvesterBuilder {
  /** A boolean to set when we are causing an item update we know should re-open to this tab */
  _shouldOpenTreeTab = false;

  constructor(app, html) {
    this.app = app;
    this.item = app.item;
    this.sheetHtml = html;
    this.harvesterItem = new HarvesterItem(this.item);
    this.hack(this.app);
  }

  hack(app) {
    let tab = app._tabs?.length > 0 ? app._tabs[0] : null;
    if (tab) {
      app.setPosition = function (position = {}) {
        // position.height = tab.isActive() && !position.height ? "auto" : position.height;
        position.height = tab?.active === "harvester" && !position.height ? "auto" : position.height;
        return this.__proto__.__proto__.setPosition.apply(this, [position]);
      };
    }
  }

  /** MUTATED: All open ItemSheet have a cached instance of this class */
  static instances = new Map();

  /**
   * Handles the item sheet render hook
   */
  static init() {
    Hooks.on("renderItemSheet", (app, html) => {
      if (!game.user.isGM) {
        return;
      }

      if (this.instances.get(app.appId)) {
        const instance = this.instances.get(app.appId);

        instance.renderLite();

        if (instance._shouldOpenTreeTab) {
          app._tabs?.[0]?.activate?.("harvester");
          instance._shouldOpenTreeTab = false;
        }
        return;
      }

      const newInstance = new this(app, html);

      this.instances.set(app.appId, newInstance);

      return newInstance.renderLite();
    });

    // clean up instances as sheets are closed
    Hooks.on("closeItemSheet", async (app) => {
      if (this.instances.get(app.appId)) {
        return this.instances.delete(app.appId);
      }
    });
  }

  /**
   * Renders the tree tab template to be injected
   */
  async _renderLeafsList() {
    const actorSourcesArray = [...(await this.harvesterItem.itemTreeFlagMap).values()];

    const actorSourcesArrayTmp = [];
    // TOD made this better...
    for (const leaf of actorSourcesArray) {
      const itemTmp = await fromUuid(leaf.uuid);
      if (itemTmp) {
        const i = {
          name: itemTmp.name,
          img: itemTmp.img,
          uuid: itemTmp.uuid,
          id: itemTmp.id ? itemTmp.id : itemTmp._id, // Strange use case for compendium
        };
        actorSourcesArrayTmp.push(i);
      } else {
        console.warn(`${"harvester"} | there is a wrong item uuid ${leaf}`);
        const uuidToRemove = leaf.uuid;
        for (const [key, value] of this.harvesterItem.itemTreeFlagMap) {
          if (value.uuid === uuidToRemove) {
            await this.harvesterItem.removeLeafFromItem(key, { alsoDeleteEmbeddedLeaf: false });
          }
        }
      }
    }

    return renderTemplate(`/modules/harvester/templates/item-sheet-harvester-tab.hbs`, {
      actorSources: actorSourcesArrayTmp,
      config: {
        limitedUsePeriods: CONFIG.DND5E.limitedUsePeriods,
        abilities: CONFIG.DND5E.abilities,
      },
      playerCanOnlyView: game.user.isGM ? true : false,
      isOwner: this.item.isOwner,
      isOwned: this.item.isOwned,
    });
  }

  /**
   * Ensure the item dropped is a item, add the item to the item flags.
   * @returns Promise that resolves when the item has been modified
   */
  async _dragEnd(event) {
    if (!this.app.isEditable) {
      return;
    }
    const data = TextEditor.getDragEventData(event);

    if (data.type !== "Actor") {
      return;
    }
    const actor = await fromUuid(data.uuid);
    // TODO
    // if (actor.type !== 'npc') {
    //   return;
    // }
    // set the flag to re-open this tab when the update completes
    this._shouldOpenTreeTab = true;
    return this.harvesterItem.addLeafToItem(data.uuid);
  }

  /**
   * Event Handler that opens the item's sheet
   */
  async _handleItemClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();
    const itemLeaf = this.harvesterItem.itemTreeFlagMap.get(itemId);
    const item = await fromUuid(itemLeaf.uuid);

    item?.sheet.render(true, {
      editable: !!item.isOwned && !!item.isOwner,
    });
  }

  /**
   * Event Handler that removes the link between this item and the item
   */
  async _handleItemDeleteClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();

    // set the flag to re-open this tab when the update completes
    this._shouldOpenTreeTab = true;
    await this.harvesterItem.removeLeafFromItem(itemId, { alsoDeleteEmbeddedLeaf: true });
  }

  /**
   * Event Handler that create the custom link type between this item and the item
   */
  async _handleCreateCustomLinkClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();

    // set the flag to re-open this tab when the update completes
    this._shouldOpenTreeTab = true;
    await this.harvesterItem.createCustomLinkItem(itemId);
  }

  /**
   * Event Handler that also Deletes the embedded item
   */
  async _handleItemDestroyClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();

    // set the flag to re-open this tab when the update completes
    this._shouldOpenTreeTab = true;
    await this.harvesterItem.removeLeafFromItem(itemId, { alsoDeleteEmbeddedLeaf: true });
  }

  /**
   * Event Handler that opens the item's sheet or config overrides, depending on if the item is owned
   */
  async _handleItemEditClick(event) {
    const { itemId } = $(event.currentTarget).parents("[data-item-id]").data();
    const itemTmp = this.harvesterItem.itemTreeFlagMap.get(itemId);
    const item = await fromUuid(itemTmp.uuid);
    return item.sheet.render(true);
  }

  /**
   * Synchronous part of the render which calls the asynchronous `renderHeavy`
   * This allows for less delay during the update -> renderItemSheet -> set tab cycle
   */
  renderLite() {

    // Update the nav menu
    const treeTabButton = $(
      '<a class="item" data-tab="harvester">' + game.i18n.localize(`${"harvester"}.tab.label`) + "</a>"
    );

    let tabs = this.sheetHtml.find('.tabs[data-group="primary"]');

    // if(tabs.length === 0 && this.item.type === "loot"){
    //   // const primaryTab = $(`<nav class="sheet-navigation tabs" data-group="primary"></nav>`);
    //   this.sheetHtml.find('.sheet-header').after(`<nav class="sheet-navigation tabs" data-group="primary">
    //   <a class="item active" data-tab="description">${game.i18n.localize("DND5E.Description")}</a>
    //   </nav>`)
    // }

    tabs = this.sheetHtml.find('.tabs[data-group="primary"]');

    if (!tabs || tabs.length === 0) {
      return;
    }

    tabs.append(treeTabButton);

    // Create the tab
    const sheetBody = this.sheetHtml.find(".sheet-body");
    const treeTab = $(`<div class="tab tree flexcol" data-group="primary" data-tab="harvester"></div>`);
    sheetBody.append(treeTab);

    this.renderHeavy(treeTab);
  }

  /**
   * Heavy lifting part of the items tab rendering which involves getting the items and painting them
   */
  async renderHeavy(treeTab) {
    // await this.harvesterItem.refresh();
    // Add the list to the tab
    const treeTabHtml = $(await this._renderLeafsList());
    treeTab.append(treeTabHtml);

    // Activate Listeners for this ui.
    treeTabHtml.on("click", ".item-name", this._handleItemClick.bind(this));
    treeTabHtml.on("click", ".item-delete", this._handleItemDeleteClick.bind(this));
    treeTabHtml.on("click", ".item-destroy", this._handleItemDestroyClick.bind(this));
    treeTabHtml.on("click", ".configure-overrides", this._handleItemEditClick.bind(this));
   
    // Register a DragDrop handler for adding new items to this item
    // const dragDrop = {
    //   dragSelector: ".item",
    //   dropSelector: ".harvester-tab",
    //   permissions: { drop: () => this.app.isEditable && !this.item.isOwned },
    //   callbacks: { drop: this._dragEnd },
    // };
    // this.app.element[0]
    //   .querySelector(dragDrop.dropSelector)
    //   .addEventListener("drop", dragDrop.callbacks.drop.bind(this));

    const dragDrop2 = {
      dragSelector: ".item",
      dropSelector: ".item-source-drag-content",
      permissions: { drop: () => this.app.isEditable && !this.item.isOwned },
      callbacks: { drop: this._dragEnd },
    };
    this.app.element[0]
      .querySelector(dragDrop2.dropSelector)
      .addEventListener("drop", dragDrop2.callbacks.drop.bind(this));
  }
}
