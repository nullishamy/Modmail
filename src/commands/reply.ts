import yargs from "yargs";
import { createMessage } from "../db/message.js";
import { fetchThreadByChannelId } from "../db/thread.js";
import { threadMessageEmbed } from "../ui/thread.js";
import { Command } from "./types.js";

const argSchema = yargs()
  .command("<message..>", "the message to reply with")
  .demandCommand(1)
  .option("anon", {
    type: "boolean",
    default: false,
    description: "reply to the thread anonymously",
  });

export const reply: Command<typeof argSchema> = {
  name: "reply",
  description: "replies to a message in a thread",
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
    const dmEmbed = threadMessageEmbed(
      message.author,
      args._.join(" "),
      "THREAD_MODERATOR",
      args.anon
    );

    await dm.send({
      embeds: [dmEmbed],
    });

    await createMessage(message, "THREAD_MODERATOR", thread, args._.join(" "));
    const channelEmbed = threadMessageEmbed(
      message.author,
      args._.join(" "),
      "THREAD_MODERATOR",
      false
    );

    await message.channel.send({
      embeds: [channelEmbed],
    });

    await message.delete();
  },
};
