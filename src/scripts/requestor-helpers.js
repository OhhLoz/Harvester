import { handlePreRollHarvestAction } from "../module";
import { CONSTANTS } from "./constants";
import Logger from "./lib/Logger";
import { getByValue } from "./lib/lib";

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
    },
    skillDetails = {
      skillDenomination: "",
      skillItem: {},
      skillCallback: function () {},
    },
    optionsRequestor = {
      limit: RequestorHelpers.LIMIT.ONCE,
      permission: RequestorHelpers.PERMISSION.ALL,
    }
  ) {
    const { chatTitle, chatDescription, chatButtonLabel, chatWhisper, chatSpeaker } = chatDetails;
    const { skillDenomination, skillItem, skillCallback } = skillDetails;
    const { limit, permission } = optionsRequestor;

    const actorSpeaker = tokenUseForRequest?.actor ? tokenUseForRequest.actor : actorUseForRequest;

    const rollObj = await Requestor.request({
      title: chatTitle ?? "This is a request title.",
      description: chatDescription ?? "This is a request description.",
      popout: true,
      autoclose: true,
      speaker: chatSpeaker ?? ChatMessage.getSpeaker({ actor: actorSpeaker }),
      whisper: chatWhisper ?? ChatMessage.getWhisperRecipients(actorSpeaker.name),
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
                const roll = await actor.rollSkill(skillDenomination, { event });
                const options = {
                  token,
                  character,
                  actor,
                  event,
                  data: this,
                  roll: roll,
                  skillDenomination: skillDenomination,
                  skillItem: skillItem,
                };

                // skillCallback(options);
                await game.modules.get(moduleId).api[skillCallback](options);
              },
              scope: {
                moduleId: CONSTANTS.MODULE_ID,
                skillDenomination: skillDenomination,
                skillCallback: skillCallback,
                skillItem: skillItem,
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
    chatDetails = {
      chatTitle: "",
      chatDescription: "",
      chatButtonLabel: "",
      chatWhisper: undefined,
      chatSpeaker: undefined,
    }
  ) {
    const { chatTitle, chatDescription, chatButtonLabel, chatWhisper, chatSpeaker } = chatDetails;
    const actorSpeaker = token?.actor ? token.actor : actorUseForRequest;

    const rollObj = await Requestor.request({
      title: chatTitle ?? "This is a request title.",
      description: chatDescription ?? "This is a request description.",
      popout: true,
      autoclose: true,
      speaker: chatSpeaker ?? ChatMessage.getSpeaker({ actor: actorSpeaker }),
      whisper: chatWhisper ?? ChatMessage.getWhisperRecipients(actorSpeaker.name),
    });
    return rollObj;
  }
}
