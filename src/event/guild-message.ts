import { Client, Message } from "discord.js";
import { commands } from "../commands/index.js";
import { fetchBotConfig } from "../config/fetch.js";
import { BotConfig } from "../config/types.js";
import { createMessage } from "../db/message.js";
import { fetchThreadByChannelId } from "../db/thread.js";

export async function onGuildMessage(message: Message<true>, config: BotConfig, client: Client) {
  const prefix = "++";

  if (!message.content.startsWith(prefix)) {
    // Not a command, maybe a thread discussion message?

    const { categoryId } = fetchBotConfig()
    // Avoid looking up the DB for every single message
    if (message.channel.parentId !== categoryId) {
        return
    }
    
    const existingThread = await fetchThreadByChannelId(message.channelId)
    if (!existingThread) {
        return
    }

    await createMessage(message, 'DISCUSSION', existingThread)
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

  logger.debug(`User ${message.author.tag} running ${commandName}`);
  try {
    await command.run({
      client,
      message,
      config,
      args: await command.argSchema.parse(message.content.substring(prefix.length + commandName.length)),
    });
  } catch (err) {
    logger.error(`Error running command ${commandName}`);
    logger.error(err);
  }
}