export class ItemSheetHarvester extends dnd5e.applications.item.ItemSheet5e {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["harvester", "dnd5e", "sheet", "item"],
    });
  }

  /** @inheritdoc */
  get template() {
    return `modules/harvester/templates/item-sheet-harvester.hbs`;
    // return `systems/dnd5e/templates/loot.hbs`;
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const item = context.item;
    const source = item.toObject();

    // Item rendering data
    foundry.utils.mergeObject(context, {
      flags: item.flags,
      isNotGM: !game.user.isGM,
      isGM: game.user.isGM,
    });
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    let item = this.item;
  }
}
