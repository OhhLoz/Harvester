import { CONSTANTS } from "./constants.js";
import Logger from "./lib/Logger.js";

export class RequestorHelpers {
  static LIMIT = {
    FREE: 0,
    ONCE: 1,
    OPTION: 2,
  };
  // Who can view the button.
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
    }
  ) {
    const { chatTitle, chatDescription, chatButtonLabel, chatWhisper, chatSpeaker, chatImg } = chatDetails;
    const { skillDenomination, skillItem, skillCallback, skillChooseModifier } = skillDetails;
    const { limit, permission } = optionsRequestor;

    const actorSpeaker = tokenUseForRequest?.actor ? tokenUseForRequest.actor : actorUseForRequest;

    const requestorImg = chatImg;
    const requestorTitle = chatTitle ?? "This is a request title.";
    const requestorDescription = chatDescription ?? "This is a request description.";
    const requestorSpeaker = chatSpeaker ?? ChatMessage.getSpeaker({ actor: actorSpeaker });
    const requestorWhisper = chatWhisper ?? ChatMessage.getWhisperRecipients(actorSpeaker.name);

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
      actorSpeaker: actorSpeaker,
      requestorImg: requestorImg,
      requestorTitle: requestorTitle,
      requestorDescription: requestorDescription,
      requestorSpeaker: requestorSpeaker,
      requestorWhisper: requestorWhisper,
    });

    const rollObj = await Requestor.request({
      img: requestorImg,
      title: requestorTitle,
      description: requestorDescription,
      popout: true,
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
    }
  ) {
    const { chatTitle, chatDescription, chatButtonLabel, chatWhisper, chatSpeaker, chatImg } = chatDetails;
    const actorSpeaker = token?.actor ? token.actor : actorUseForRequest;

    const requestorImg = chatImg;
    const requestorTitle = chatTitle ?? "This is a request title.";
    const requestorDescription = chatDescription ?? "This is a request description.";
    const requestorSpeaker = chatSpeaker ?? ChatMessage.getSpeaker({ actor: actorSpeaker });
    const requestorWhisper = chatWhisper ?? ChatMessage.getWhisperRecipients(actorSpeaker.name);

    Logger.debug(`START requestEmptyMessage`, {
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
      actorSpeaker: actorSpeaker,
      requestorImg: requestorImg,
      requestorTitle: requestorTitle,
      requestorDescription: requestorDescription,
      requestorSpeaker: requestorSpeaker,
      requestorWhisper: requestorWhisper,
    });

    const rollObj = await Requestor.request({
      img: requestorImg,
      title: requestorTitle,
      description: requestorDescription,
      popout: true,
      autoclose: true,
      speaker: requestorSpeaker,
      whisper: requestorWhisper,
    });
    return rollObj;
  }
}
