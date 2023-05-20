import yargs from "yargs";
import { createMessage } from "../db/message.js";
import { fetchThreadByChannelId } from "../db/thread.js";
import { threadMessageEmbed } from "../ui/thread.js";
import { Command } from "./types.js";

const argSchema = yargs().boolean("anon");

export const reply: Command<typeof argSchema> = {
  name: "reply",
  description: "Replies to a message in a thread",
  aliases: [],
  argSchema,
  run: async ({ client, message, args }) => {
    const thread = await fetchThreadByChannelId(message.channelId);
    if (!thread) {
      return message.reply({
        content: "Current channel is not a thread.",
        allowedMentions: { repliedUser: false },
      });
    }

    const user = await client.users.fetch(thread.authorId);
    const dm = await user.createDM(true);
    const embed = threadMessageEmbed(
      message,
      args._.join(" "),
      "THREAD_MODERATOR"
    );

    await dm.send({
      embeds: [embed],
    });

    await createMessage(message, "THREAD_MODERATOR", thread, args._.join(" "));

    await message.channel.send({
      embeds: [embed],
    });

    await message.delete()
  },
};
