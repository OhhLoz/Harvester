import { CONSTANTS } from "./constants.js";
import Logger from "./lib/Logger.js";
import ItemPilesHelpers from "./lib/item-piles-helpers.js";
import { RetrieveHelpers } from "./lib/retrieve-helpers.js";

export class RequestorHelpers {
    /**
     *  LIMIT: FREE, ONCE, OPTION (for an entry that can clicked any number of times, only once, or once between a group of options).
     *  Default: FREE
     */
    static LIMIT = {
        FREE: 0,
        ONCE: 1,
        OPTION: 2,
    };
    /**
     * Who can view the button.
     * PERMISSION: GM, PLAYER, ALL (for an entry that will only be shown for GMs, only for players, or for all).
     * Default: ALL.
     */
    static PERMISSION = {
        ALL: 0,
        GM: 1,
        PLAYER: 2,
    };
    static TRUST_OPTIONS = {
        GM: 0,
        OWN: 1,
        FREE: 2,
    };

    /*
    await Requestor.request({
        img: "icons/creatures/abilities/dragon-breath-purple.webp",
        title: "Test d'un test !",
        description: "C'est un test d'un test, pour tester quoi.",
        popout: true,
        autoclose: false,
        speaker: ChatMessage.getSpeaker({actor: token.actor}),
        whisper: ChatMessage.getWhisperRecipients("David"),
        sound: "ressources/assets/audio/Special/Toast.mp3",
        buttonData: [{
            label: "A Skill Check",
            limit: Requestor.LIMIT.ONCE,
            permission: Requestor.PERMISSION.ALL ,
            command: async function(){
            await Requestor.diceRoll({formula: "2d4+2", flavor: "Healing Potion"});
            },
            scope: {skill: "nat"}
        }],
        messageOptions: {
            speaker: ChatMessage.getSpeaker({actor: token.actor}),
        },
    });
    */

    static async requestRollSkill(
        actorUseForRequest,
        tokenUseForRequest,
        chatDetails = {
            chatTitle: "",
            chatDescription: "",
            chatButtonLabel: "",
            chatWhisper: undefined,
            chatSpeaker: undefined,
            chatImg: undefined,
        },
        skillDetails = {
            skillDenomination: "",
            skillItem: {},
            skillCallback: function () {},
            skillChooseModifier: false,
        },
        optionsRequestor = {
            limit: RequestorHelpers.LIMIT.ONCE,
            permission: RequestorHelpers.PERMISSION.ALL,
            popout: false,
        },
    ) {
        const { chatTitle, chatDescription, chatButtonLabel, chatWhisper, chatSpeaker, chatImg } = chatDetails;
        const { skillDenomination, skillItem, skillCallback, skillChooseModifier } = skillDetails;
        const { limit, permission, popout } = optionsRequestor;

        const actorSpeaker = tokenUseForRequest?.actor ? tokenUseForRequest.actor : actorUseForRequest;

        let messageWhisper = [];
        if (permission === RequestorHelpers.PERMISSION.GM) {
            messageWhisper = game.users.filter((u) => u.isGM).map((u) => u._id);
        } else {
            messageWhisper = game.users
                .filter((u) => {
                    return u.isGM || u.id === game.user.id;
                })
                .map((u) => u._id);
        }

        const requestorImg = chatImg;
        const requestorTitle = chatTitle ?? "This is a request title.";
        const requestorDescription = chatDescription ?? "This is a request description.";
        const requestorSpeaker = chatSpeaker ?? ChatMessage.getSpeaker({ actor: actorSpeaker });
        const requestorWhisper =
            chatWhisper ??
            (ChatMessage.getWhisperRecipients(actorSpeaker.name)?.length > 0
                ? ChatMessage.getWhisperRecipients(actorSpeaker.name)
                : game.users.filter((u) => messageWhisper?.includes(u.id)));
        const requestorPopout = popout;
        Logger.debug(`START requestRollSkill`, {
            chatTitle: chatTitle,
            chatDescription: chatDescription,
            chatButtonLabel: chatButtonLabel,
            chatWhisper: chatWhisper,
            chatSpeaker: chatSpeaker,
            chatImg: chatImg,

            skillDenomination: skillDenomination,
            skillItem: skillItem,
            skillCallback: skillCallback,
            skillChooseModifier: skillChooseModifier,

            limit: limit,
            permission: permission,
            popout: popout,

            actorSpeaker: actorSpeaker,
            requestorImg: requestorImg,
            requestorTitle: requestorTitle,
            requestorDescription: requestorDescription,
            requestorSpeaker: requestorSpeaker,
            requestorWhisper: requestorWhisper,
            requestorPopout: requestorPopout,
        });

        const rollObj = await Requestor.request({
            img: requestorImg,
            title: requestorTitle,
            description: requestorDescription,
            popout: requestorPopout,
            autoclose: true,
            speaker: requestorSpeaker,
            whisper: requestorWhisper,
            buttonData: chatButtonLabel
                ? [
                      {
                          label: chatButtonLabel,
                          limit: limit,
                          permission: permission,
                          command: async function () {
                              // token: the selected token of the user executing the command, or defaulting to the assigned character's active token on the current scene, if any.
                              // character: the assigned actor of the user executing the command.
                              // actor: the actor of the selected token, if any, or defaulting to the assigned character.
                              // event: the initiating click event when the user clicked the button.
                              // this: an object with all additional variables passed to the function (identical to scope above). If tokenId or actorId are passed in scope, then token and actor will automatically be set using these ids.

                              /**
                               * Roll a Skill Check
                               * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
                               * @param {string} skillId      The skill id (e.g. "ins")
                               * @param {object} options      Options which configure how the skill check is rolled
                               * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance
                               */
                              const rollRef = await actor.rollSkill(skillDenominationRef, {
                                  skillChooseModifier: skillChooseModifierRef,
                              });

                              const options = {
                                  token,
                                  character,
                                  actor,
                                  event,
                                  data: this,
                                  roll: rollRef,
                                  skillDenomination: skillDenominationRef,
                                  item: skillItemRef,
                              };

                              // Little trick for call the exact api method from th current module
                              await game.modules.get(moduleIdRef).api[skillCallbackRef](options);
                          },
                          scope: {
                              moduleIdRef: CONSTANTS.MODULE_ID,
                              skillDenominationRef: skillDenomination,
                              skillCallbackRef: skillCallback,
                              skillItemRef: skillItem,
                              skillChooseModifierRef: skillChooseModifier,
                          },
                          messageOptions: {
                              speaker: ChatMessage.getSpeaker({ actor: actorSpeaker }),
                          },
                      },
                  ]
                : [],
        });
        return rollObj;
    }

    static async requestEmptyMessage(
        actorUseForRequest,
        tokenUseForRequest,
        chatDetails = {
            chatTitle: "",
            chatDescription: "",
            chatButtonLabel: "",
            chatWhisper: undefined,
            chatSpeaker: undefined,
            chatImg: undefined,
        },
        optionsRequestor = {
            limit: RequestorHelpers.LIMIT.ONCE,
            permission: RequestorHelpers.PERMISSION.ALL,
            popout: false,
        },
    ) {
        const { chatTitle, chatDescription, chatButtonLabel, chatWhisper, chatSpeaker, chatImg } = chatDetails;
        const { limit, permission, popout } = optionsRequestor;

        const actorSpeaker = tokenUseForRequest?.actor ? tokenUseForRequest.actor : actorUseForRequest;

        let messageWhisper = [];
        if (permission === RequestorHelpers.PERMISSION.GM) {
            messageWhisper = game.users.filter((u) => u.isGM).map((u) => u._id);
        } else {
            messageWhisper = game.users
                .filter((u) => {
                    return u.isGM || u.id === game.user.id;
                })
                .map((u) => u._id);
        }

        const requestorImg = chatImg;
        const requestorTitle = chatTitle ?? "This is a request title.";
        const requestorDescription = chatDescription ?? "This is a request description.";
        const requestorSpeaker = chatSpeaker ?? ChatMessage.getSpeaker({ actor: actorSpeaker });
        const requestorWhisper =
            chatWhisper ??
            (ChatMessage.getWhisperRecipients(actorSpeaker.name)?.length > 0
                ? ChatMessage.getWhisperRecipients(actorSpeaker.name)
                : game.users.filter((u) => messageWhisper?.includes(u.id)));
        const requestorPopout = popout;

        Logger.debug(`START requestEmptyMessage`, {
            chatTitle: chatTitle,
            chatDescription: chatDescription,
            chatButtonLabel: chatButtonLabel,
            chatWhisper: chatWhisper,
            chatSpeaker: chatSpeaker,
            chatImg: chatImg,

            limit: limit,
            permission: permission,
            popout: popout,

            actorSpeaker: actorSpeaker,
            requestorImg: requestorImg,
            requestorTitle: requestorTitle,
            requestorDescription: requestorDescription,
            requestorSpeaker: requestorSpeaker,
            requestorWhisper: requestorWhisper,
            requestorPopout: requestorPopout,
        });

        const rollObj = await Requestor.request({
            img: requestorImg,
            title: requestorTitle,
            description: requestorDescription,
            popout: requestorPopout,
            autoclose: true,
            speaker: requestorSpeaker,
            whisper: requestorWhisper,
        });
        return rollObj;
    }

    static async requestHarvestMessage(
        actorUseForRequest,
        tokenUseForRequest,
        itemsToAdd,
        targetedToken,
        // chatDetails = {
        //     chatTitle: "",
        //     chatDescription: "",
        //     chatButtonLabel: "",
        //     chatWhisper: undefined,
        //     chatSpeaker: undefined,
        //     chatImg: undefined,
        // },
        optionsRequestor = {
            limit: RequestorHelpers.LIMIT.ONCE,
            permission: RequestorHelpers.PERMISSION.ALL,
            popout: false,
        },
    ) {
        // const { chatTitle, chatDescription, chatButtonLabel, chatWhisper, chatSpeaker, chatImg } = chatDetails;
        const { limit, permission, popout } = optionsRequestor;

        const actorSpeaker = tokenUseForRequest?.actor ? tokenUseForRequest.actor : actorUseForRequest;

        let messageWhisper = [];
        if (permission === RequestorHelpers.PERMISSION.GM) {
            messageWhisper = game.users.filter((u) => u.isGM).map((u) => u._id);
        } else {
            messageWhisper = game.users
                .filter((u) => {
                    return u.isGM || u.id === game.user.id;
                })
                .map((u) => u._id);
        }

        let messageDataContent = "";
        let harvesterMessage = "";
        for (const item of itemsToAdd) {
            harvesterMessage += `<li>@UUID[${item.uuid}] x ${item.system?.quantity || 1}</li>`;
        }
        messageDataContent = `<h3>Share it or Keep it!</h3>
        <p>You must decide whether to keep the harvesting result to yourself or share with others</p>
        <ul>${harvesterMessage}</ul>`;

        const requestorImg = "icons/tools/cooking/knife-cleaver-steel-grey.webp";
        const requestorTitle = "Share it or Keep it!";
        const requestorDescription = messageDataContent;
        const requestorSpeaker = ChatMessage.getSpeaker({ actor: actorSpeaker });
        const requestorWhisper =
            ChatMessage.getWhisperRecipients(actorSpeaker.name)?.length > 0
                ? ChatMessage.getWhisperRecipients(actorSpeaker.name)
                : game.users.filter((u) => messageWhisper?.includes(u.id));
        const requestorPopout = popout;

        Logger.debug(`START requestHarvestMessage`, {
            popout: popout,
        });

        const rollObj = await Requestor.request({
            img: requestorImg,
            title: requestorTitle,
            description: requestorDescription,
            popout: requestorPopout,
            autoclose: true,
            speaker: requestorSpeaker,
            whisper: requestorWhisper,
            buttonData: [
                {
                    label: "Keep it",
                    limit: limit,
                    permission: permission,
                    command: async function () {
                        const options = {
                            token,
                            character,
                            actor,
                            event,
                            data: this,
                            itemsToAdd: itemsToAddRef,
                            targetedToken: game.modules
                                .get(moduleIdRef)
                                .api._RetrieveHelpers.getTokenSync(targetedTokenRef),
                        };
                        // const rollData = actor.getRollData();
                        // const speaker = ChatMessage.getSpeaker({ actor });
                        // const flavor = "Keep It the harvesting";
                        // return new Roll("3d6 + @abilities.acc.value", rollData).toMessage({ speaker, flavor });
                        game.modules
                            .get(moduleIdRef)
                            .api._Logger.warn(
                                `KEEP IT | Add items with ITEMPILES to ${options.actor.name}`,
                                options.itemsToAdd,
                            );
                        await game.modules.get(moduleIdRef).api._ItemPilesHelpers.addItems(actor, options.itemsToAdd, {
                            mergeSimilarItems: true,
                        });
                        return false;
                    },
                    scope: {
                        moduleIdRef: CONSTANTS.MODULE_ID,
                        itemsToAddRef: itemsToAdd,
                        targetedTokenRef: targetedToken.id,
                    },
                    messageOptions: {
                        speaker: ChatMessage.getSpeaker({ actor: actorSpeaker }),
                    },
                },
                {
                    label: "Share it",
                    limit: limit,
                    permission: permission,
                    command: async function () {
                        const options = {
                            token,
                            character,
                            actor,
                            event,
                            data: this,
                            itemsToAdd: itemsToAddRef,
                            targetedToken: game.modules
                                .get(moduleIdRef)
                                .api._RetrieveHelpers.getTokenSync(targetedTokenRef),
                        };
                        // const rollData = actor.getRollData();
                        // const speaker = ChatMessage.getSpeaker({ actor });
                        // const flavor = "Share it the harvesting";
                        // return new Roll("3d6 + @abilities.acc.value + 2", rollData).toMessage({ speaker, flavor });
                        game.modules
                            .get(moduleIdRef)
                            .api._Logger.warn(
                                `SHARE IT | Add items with ITEMPILES to ${options.actor.name}`,
                                options.itemsToAdd,
                            );
                        await game.modules
                            .get(moduleIdRef)
                            .api._ItemPilesHelpers.convertTokenToItemPilesContainer(options.targetedToken);
                        return true;
                    },
                    scope: {
                        moduleIdRef: CONSTANTS.MODULE_ID,
                        itemsToAddRef: itemsToAdd,
                        targetedTokenRef: targetedToken.id,
                    },
                    messageOptions: {
                        speaker: ChatMessage.getSpeaker({ actor: actorSpeaker }),
                    },
                },
            ],
        });
        return rollObj;
    }
}
