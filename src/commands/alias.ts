import assert from "assert";
import yargs from "yargs";
import {
  createAlias,
  fetchAliasByName,
  fetchAllAliases,
  updateAlias,
} from "../db/alias.js";
import { createMessage } from "../db/message.js";
import { fetchThreadByChannelId } from "../db/thread.js";
import { threadMessageEmbed } from "../ui/thread.js";
import { Command } from "./types.js";

const argSchema = yargs()
  .command("<name>", "reply with the given alias")
  .command("show <alias>", "show the text content of an alias")
  .command("set <alias> <text..>", "set the content of an alias")
  .command("list", "list all aliases")
  .option("anon", {
    type: "boolean",
    default: false,
    description: "reply to the thread anonymously",
  })
  .demandCommand(1, "provide a command (show, set, list)");

export const alias: Command<typeof argSchema> = {
  name: "alias",
  description: "control and use aliases",
  aliases: ["a"],
  argSchema,
  run: async ({ client, message, args }) => {
    const thread = await fetchThreadByChannelId(message.channelId);
    if (!thread) {
      return message.reply({
        content: "Current channel is not a thread.",
        allowedMentions: { repliedUser: false },
      });
    }

    const [command] = args._;
    assert(typeof command === "string");

    const alias = args.alias as string;
    const text = args.text as string[];

    console.log(command, alias, text);
    console.log(args);

    if (command === "show") {
      const data = await fetchAliasByName(alias);
      if (!data) {
        return message.reply({
          content: `No alias exists for name "${alias}"`,
          allowedMentions: { repliedUser: false },
        });
      }
      return message.reply({
        content: `${alias}:\n\n${data.text}`,
        allowedMentions: { repliedUser: false },
      });
    } else if (command === "set") {
      const data = await fetchAliasByName(alias);
      if (data !== null) {
        await updateAlias(data, text.join(" "));

        return message.reply({
          content: `Updated "${alias}":\n\nOld:\n${
            data.text
          }\n\nNew:\n${text.join(" ")}`,
          allowedMentions: { repliedUser: false },
        });
      }

      await createAlias(alias, text.join(" "));
      return message.reply({
        content: `Created alias "${alias}"`,
        allowedMentions: { repliedUser: false },
      });
    } else if (command === "list") {
      const aliases = await fetchAllAliases();
      const formatted = aliases.map((a) => `${a.key}`).join("\n");
      return message.reply({
        content: !!formatted
          ? `Use "++alias show" to show the value of an alias\n\n${formatted}`
          : 'No aliases set yet, use "++alias set" to set one.',
        allowedMentions: { repliedUser: false },
      });
    } else {
      // Try and find an alias by the first argument
      // it will appear in the `command` var because
      // that is read purely from positional arguments
      const data = await fetchAliasByName(command);
      if (!data) {
        return message.reply({
          content: `Unknown alias or subcommand "${command}"`,
          allowedMentions: { repliedUser: false },
        });
      }

      const user = await client.users.fetch(thread.authorId);
      const dm = await user.createDM(true);
      const embed = threadMessageEmbed(
        message.author,
        args._.join(" "),
        "THREAD_MODERATOR",
        args.anon
      );

      await dm.send({
        embeds: [embed],
      });

      await createMessage(message, "THREAD_MODERATOR", thread, data.text);

      await message.channel.send({
        embeds: [embed],
      });

      await message.delete();
    }
  },
};
