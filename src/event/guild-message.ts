import assert from "assert";
import { Client, Message } from "discord.js";
import { commands } from "../commands/index.js";
import { fetchGuildConfig } from "../config/fetch.js";
import { BotConfig } from "../config/types.js";
import { createMessage } from "../db/message.js";
import { fetchThreadByChannelId } from "../db/thread.js";
import { createUserIfNotExists } from "../db/user.js";

const initedSchemas = new Set<unknown>();

export async function onGuildMessage(
  message: Message<true>,
  config: BotConfig,
  client: Client
) {
  const prefix = "++";

  if (!message.content.startsWith(prefix)) {
    // Not a command, maybe a thread discussion message?
    const guildConfig = await fetchGuildConfig();

    if (!guildConfig.success) {
      // Do not send a message to the channel in case it is not in a thread or similar internal channel
      if (guildConfig.error === "no-config-present") {
        logger.error(
          "No guild config has been setup, but a thread is being created. Cannot continue thread creation. Please setup the guild config."
        );
        return;
      } else {
        logger.error(
          `Missing required guild config attribute "${guildConfig.data}" (evaluated during thread message handling). Please set the value and try again.`
        );
        return;
      }
    }

    if (message.channel.parentId !== guildConfig.data.threadCategory.id) {
      return;
    }

    const existingThread = await fetchThreadByChannelId(message.channelId);
    if (!existingThread) {
      return;
    }

    await createMessage(message, "DISCUSSION", existingThread);
    return;
  }

  const content = message.content.substring(prefix.length);
  const [commandName] = content.split(/\s+/);

  const command = commands.find(
    (c) => c.name === commandName || c.aliases.some((a) => a == commandName)
  );

  if (!command) {
    return;
  }

  logger.debug(`User @${message.author.username} running ${commandName}`);
  try {
    let args;
    try {
      // We must store the schemas that have been setup, because epilog will append a string each time it is called
      // rather than setting a single value
      if (!initedSchemas.has(command.argSchema)) {
        command.argSchema
          .exitProcess(false)
          .showHelpOnFail(false)
          .scriptName(commandName)
          .fail(false)
          .wrap(null)
          .version(false)
          .help(false)
          .boolean("help")
          .epilogue(`Description:\n${command.description}`)
          .describe("help", "show help");
        initedSchemas.add(command.argSchema);
      }
      args = await command.argSchema.parse(
        message.content.substring(prefix.length + commandName.length)
      );
    } catch (err) {
      // Args failed to parse, show help
      assert(err instanceof Error);

      await message.reply({
        content: `Syntax error: ${
          err.message
        }\n\Usage:\n${await command.argSchema
          .scriptName(commandName)
          .getHelp()}`,
        allowedMentions: { repliedUser: false },
      });
      return;
    }

    if (args.help) {
      await message.reply({
        content: await command.argSchema.getHelp(),
        allowedMentions: { repliedUser: false },
      });

      return;
    }

    const member = await message.guild.members.fetch(message.author.id);
    await createUserIfNotExists(member);

    await command.run({
      client,
      message,
      botConfig: config,
      args,
    });
  } catch (err) {
    logger.error(`Error running command ${commandName}`);
    logger.error(err);

    await message.reply({
      content: "Something went wrong when running that command, please report.",
      allowedMentions: { repliedUser: false },
    });
  }
}
