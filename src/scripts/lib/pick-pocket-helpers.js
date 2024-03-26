export default class PickPocketHelpers {
    static chooseWhatToPickV1(actorToPickPocket) {
        const buttons = actorToPickPocket.items.reduce((acc, item) => {
            if (item.type === "weapon" && item.hasAttack && item.hasDamage)
                acc[item.id] = {
                    label: item.name,
                    callback: callback,
                };
            return acc;
        }, {});

        if (foundry.utils.isEmpty(buttons)) {
            ui.notifications.warn("You have no valid weapons!");
            return null;
        }

        const style = `
          <style>
          
          .dnd5e2.dialog.app .dialog-buttons button.dialog-button.gold-button {
            border: none;
            background: var(--dnd5e-color-black);
            margin: 0;
            display: grid;
            height: auto;
          }
          
          </style>`;

        function render([html]) {
            html.parentElement.querySelectorAll(".dialog-button").forEach((n) => {
                n.classList.toggle("gold-button", true);
                const img = document.createElement("IMG");
                const item = actorToPickPocket.items.get(n.dataset.button);
                img.src = item.img;
                n.innerHTML = img.outerHTML;
                n.dataset.tooltip = item.system.description.value;
            });
        }

        const Mixin = dnd5e.applications.DialogMixin(Dialog);
        const options = {
            classes: ["dnd5e2", "dialog"],
        };
        const data = {
            content: style,
            buttons: buttons,
            render: render,
        };

        async function callback([html], event) {
            const id = event.currentTarget.dataset.button;
            const item = actorToPickPocket.items.get(id);
            const atk = await item.rollAttack({ event });
            if (atk) {
                return item.rollDamage();
            }
        }

        new Mixin(data, options).render(true);
    }
}
