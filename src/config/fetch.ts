import assert from "assert";
import { ChannelType } from "discord.js";
import { query } from "../db/util.js";
import { client } from "../index.js";
import * as env from "./env.js";
import { BotConfig, GuildConfig } from "./types.js";

export function fetchBotConfig(): BotConfig {
  return {
    token: env.string("TOKEN"),
    guildId: env.string("GUILD_ID"),
  };
}

type GuildConfigResult =
  | {
      success: false;
      error: "no-config-present" | "missing-value";
      data: string;
    }
  | {
      success: true;
      data: GuildConfig;
    };

export function fetchGuildConfigRaw() {
  const { guildId } = fetchBotConfig();
  return query((db) =>
    db.guildConfig.findFirst({
      where: {
        guildId,
      },
    })
  );
}

export async function fetchGuildConfigInfallibly(): Promise<GuildConfig> {
  const config = await fetchGuildConfig();
  if (!config.success) {
    assert(
      false,
      `guild config was not successfully fetched: ${config.error} // ${config.data}`
    );
  }

  return config.data;
}

export async function fetchGuildConfig(): Promise<GuildConfigResult> {
  const { guildId } = fetchBotConfig();

  const guildConfig = await query((db) =>
    db.guildConfig.findFirst({
      where: {
        guildId,
      },
    })
  );

  if (!guildConfig) {
    return {
      success: false,
      error: "no-config-present",
      data: "",
    };
  }

  if (!guildConfig.categoryId) {
    return {
      success: false,
      error: "missing-value",
      data: "categoryId",
    };
  }

  if (!guildConfig.logChannelId) {
    return {
      success: false,
      error: "missing-value",
      data: "logChannelId",
    };
  }
  const threadCategory = client.channels.cache.get(guildConfig.categoryId);
  const logChannel = client.channels.cache.get(guildConfig.logChannelId);
  const guild = client.guilds.cache.get(guildId);

  // FIXME: Change this to return errors
  if (!threadCategory || threadCategory.type !== ChannelType.GuildCategory) {
    throw new Error(
      `Expected category for channel ID ${guildConfig.categoryId}`
    );
  }

  if (!logChannel || logChannel.type !== ChannelType.GuildText) {
    throw new Error(
      `Expected text channel for channel ID ${guildConfig.logChannelId}`
    );
  }

  if (!guild) {
    throw new Error(`Expected guild for ID ${guildId}`);
  }

  return {
    success: true,
    data: {
      threadCategory,
      guild,
      logChannel,
    },
  };
}
