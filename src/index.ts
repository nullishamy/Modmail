import { Client, Events, GatewayIntentBits, Partials, time } from "discord.js";
import dotenv from "dotenv-safe";
import logger from "./util/logger.js";
import { fetchBotConfig, fetchGuildConfig } from "./config/fetch.js";
import { onDirectMessage } from "./event/direct-message.js";
import { onGuildMessage } from "./event/guild-message.js";
import { fetchScheduledThreads, updateThreadState } from "./db/thread.js";
import { threadMessageEmbed } from "./ui/thread.js";
import assert from "assert";

dotenv.config();
global.logger = logger;

logger.info("Starting up, fetching config");
const config = fetchBotConfig();

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
  ],
  partials: [
    Partials.Channel, // Required to receive DMs
  ],
});

client.once(Events.ClientReady, async (c) => {
  logger.info(`Ready! Logged in as @${c.user.username}`);
  const scheduledThreadCloses = await fetchScheduledThreads();
  const config = await fetchGuildConfig();

  if (!config.success) {
    logger.warn(
      "Cannot restart scheduled tasks, guild config not (fully) setup"
    );
    return;
  }

  logger.info(`(Re)starting ${scheduledThreadCloses.length} scheduled events`);
  for (const close of scheduledThreadCloses) {
    setTimeout(() => {
      const promise = async () => {
        if (!close.silent) {
          const user = await c.users.fetch(close.thread.authorId);
          const dm = await user.createDM(true);

          const embed = threadMessageEmbed(
            user,
            `Thread closed. ${close.message ?? ""}`,
            "THREAD_MODERATOR",
            false
          );

          await config.data.logChannel.send({
            content: `Thread opened by @${user.username} closed by @${
              user.username
            } (scheduled @ ${time(close.closeAt, "F")})`,
          });
          await dm.send({
            embeds: [embed],
          });
        }

        const channel = await c.channels.fetch(close.thread.channelId);
        assert(channel !== null, "channel was null");

        await channel.delete();

        await updateThreadState(close.thread, "CLOSED");
      };

      promise().catch((err) => logger.error(`Failed to close thread, ${err}`));
    }, close.closeAt.getMilliseconds() - new Date().getMilliseconds());
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author === client.user) {
    return;
  }

  if (message.inGuild()) {
    await onGuildMessage(message, config, client);
  } else {
    await onDirectMessage(message);
  }
});

logger.info("Client initiated, logging in");

client.login(config.token).catch(logger.error);
