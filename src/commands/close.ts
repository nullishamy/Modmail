import { time } from "discord.js";
import { parseInterval } from "interval-conversions";
import yargs from "yargs";
import { fetchGuildConfigInfallibly } from "../config/fetch.js";
import {
  createThreadClose,
  fetchThreadByChannelId,
  updateThreadState,
} from "../db/thread.js";
import { threadMessageEmbed } from "../ui/thread.js";
import { Command } from "./types.js";

const argSchema = yargs()
  .command("<message..>", "the message to reply with")
  .demandCommand(1)
  .option("anon", {
    type: "boolean",
    default: false,
    description: "reply to the thread anonymously",
  })
  .option("silent", {
    alias: "s",
    type: "boolean",
    default: false,
    describe: "close the thread silently",
  })
  .option("after", {
    alias: "a",
    type: "string",
    describe: "the time to wait before closing the thread",
  });

export const close: Command<typeof argSchema> = {
  name: "close",
  description: "closes a thread",
  aliases: [],
  argSchema,
  run: async ({ client, message, args }) => {
    const thread = await fetchThreadByChannelId(message.channelId);
    const config = await fetchGuildConfigInfallibly()
    if (!thread) {
      return message.reply({
        content: "Current channel is not a thread.",
        allowedMentions: { repliedUser: false },
      });
    }

    let closeInMillis = 0;
    const closeAtDate = new Date();

    if (args.after) {
      const millis = parseInterval(args.after);

      if (!millis) {
        return message.reply({
          content: `Invalid time string ${args.after}`,
          allowedMentions: { repliedUser: false },
        });
      }

      closeAtDate.setMilliseconds(closeAtDate.getMilliseconds() + millis);

      await message.reply({
        content: `Closing this thread ${time(closeAtDate, "R")}`,
        allowedMentions: { repliedUser: false },
      });

      closeInMillis = millis;
    }

    const user = await client.users.fetch(thread.authorId);

    setTimeout(() => {
      const promise = async () => {
        if (!args.silent) {
          const dm = await user.createDM(true);

          const embed = threadMessageEmbed(
            message.author,
            `Thread closed. ${args._.join(' ') || ""}`,
            "THREAD_MODERATOR",
            args.anon
          );

          await dm.send({
            embeds: [embed],
          });
        }

        await config.logChannel.send({
          content: `Thread opened by @${user.username} closed by @${message.author.username} (scheduled @ ${time(closeAtDate, 'F')})`
        }) 
        await message.channel.delete();
        await updateThreadState(thread, "CLOSED");
      };

      promise().catch((err) => logger.error(`Failed to close thread, ${err}`));
    }, closeInMillis);

    await createThreadClose({
      closeAt: closeAtDate,
      thread,
      silent: args.silent,
      closerId: message.author.id,
      closeMessage: args._.join(' '),
    });
  },
};
