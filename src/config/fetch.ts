import { ChannelType } from "discord.js";
import { client } from "../index.js";
import * as env from "./env.js";
import { BotConfig, GuildConfig } from "./types.js";

export function fetchBotConfig(): BotConfig {
  return {
    token: env.string("TOKEN"),
    guildId: env.string("GUILD_ID"),
    categoryId: env.string("CATEGORY_ID")
  };
}

export function fetchGuildConfig(): GuildConfig {
  const { categoryId, guildId } = fetchBotConfig()
  const category = client.channels.cache.get(categoryId)
  const guild = client.guilds.cache.get(guildId)

  if (!category || category.type !== ChannelType.GuildCategory) {
    throw new Error(`Expected category for channel ID ${categoryId}`)
  }

  if (!guild) {
    throw new Error(`Expected guild for ID ${guildId}`)
  }

  return {
    threadCategory: category,
    guild
  };
}
