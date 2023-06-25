import assert from "assert";
import yargs from "yargs";
import { fetchUserById, updateUserState } from "../db/user.js";
import { Command } from "./types.js";

const argSchema = yargs()
  .command("<id>", "the user ID to block")
  .demandCommand(1);

export const unblock: Command<typeof argSchema> = {
  name: "unblock",
  description: "unblock a user from Modmail",
  aliases: [],
  argSchema,
  run: async ({ message, args }) => {
    const userId = args._[0];
    assert(typeof userId === "string", "userId was not a string");

    const user = await fetchUserById(userId);
    if (!user) {
      return message.reply({
        content: `User "${userId}" is not known to Modmail, have they ever interacted with the bot?`,
        allowedMentions: { repliedUser: false },
      });
    }

    await updateUserState(user, "UNBLOCKED");
    return message.reply({
      content: `Unblocked user <@${userId}> (${userId})`,
      allowedMentions: { repliedUser: false, users: [], roles: [] },
    });
  },
};
