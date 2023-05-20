import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv-safe";
import logger from "./util/logger.js";
import { fetchBotConfig } from "./config/fetch.js";
import { onDirectMessage } from "./event/direct-message.js";
import { onGuildMessage } from "./event/guild-message.js";

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
    GatewayIntentBits.DirectMessageReactions
  ],
  partials: [
    Partials.Channel, // Required to receive DMs
  ],
});

client.once(Events.ClientReady, (c) => {
  logger.info(`Ready! Logged in as ${c.user.tag}`);
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
