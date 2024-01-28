import { CONSTANTS } from "./constants";
import { getByValue } from "./lib/lib";

export class RequestorHelpers {
  static async rollSkill(skillDenomination, skillLabel, skillDescription, { limit = "ONCE", permission = "ALL" }) {
    const rollObj = await Requestor.request({
      description: skillDescription ?? "This is a request.",
      buttonData: [
        {
          label: skillLabel ?? `${getByValue(CONSTANTS.skillMap, skillDenomination)} Skill Check`,
          limit,
          limit,
          permission: permission,
          command: async function () {
            // token: the selected token of the user executing the command, or defaulting to the assigned character's active token on the current scene, if any.
            // character: the assigned actor of the user executing the command.
            // actor: the actor of the selected token, if any, or defaulting to the assigned character.
            // event: the initiating click event when the user clicked the button.
            // this: an object with all additional variables passed to the function (identical to scope above). If tokenId or actorId are passed in scope, then token and actor will automatically be set using these ids.
            return actor.rollSkill(skillDenomination, { event });
          },
        },
      ],
    });
    return rollObj;
  }
}
