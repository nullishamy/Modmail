import { GuildConfig } from "@prisma/client";
import yargs from "yargs";
import { fetchGuildConfig, fetchGuildConfigRaw } from "../config/fetch.js";
import {
  initGuildConfig,
  resetGuildConfig,
  updateGuildConfigValue,
} from "../db/guild-config.js";
import { Command } from "./types.js";

const CONFIG_VALUES = {
  categoryId: "type: CategoryId :: the category to create threads in",
  logChannelId: "type: ChannelId :: the channel to send logs in",
};

const CONFIG_LIST = Object.entries(CONFIG_VALUES)
  .map(([key, value]) => `${key} => ${value}`)
  .join("\n");

const argSchema = yargs()
  .command("init", "initialise the config")
  .command("get <key>", "get a value")
  .command("set <key> <value>", "set a value to a key")
  .command("list", "list all valid config values")
  .demandCommand(1, "provide a command (get, set, init, list)")
  .option("force", {
    type: "boolean",
    description:
      "forcibly overwrite a guild config to the defaults when using `init`",
    default: false,
  });

export const config: Command<typeof argSchema> = {
  name: "config",
  description: "controls the guild config for the bot",
  argSchema,
  aliases: [],
  run: async ({ message, args }) => {
    const [command] = args._;
    const key = args.key as string;
    const value = args.value as string;

    if (command === "init") {
      if (await fetchGuildConfigRaw()) {
        if (!args.force) {
          await message.reply({
            content:
              "This guild already has a config set? Run with --force to force the defaults",
            allowedMentions: { repliedUser: false },
          });
        } else {
          await resetGuildConfig(message.guildId);
          await message.reply({
            content: "Reset complete.",
            allowedMentions: { repliedUser: false },
          });
        }
        return;
      }
      await initGuildConfig(message.guildId);
      await message.reply({
        content:
          "Guild configuration initialised, you can now configure it with `config set <key> <value>`, or view values with `config get <key>`",
        allowedMentions: { repliedUser: false },
      });
      return;
    } else if (command === "get") {
      if (!key) {
        await message.reply({
          content: "Need a key to get from",
          allowedMentions: { repliedUser: false },
        });
        return;
      }

      const config = await fetchGuildConfigRaw();
      if (!config) {
        await message.reply({
          content: "Set the guild config up first!",
          allowedMentions: { repliedUser: false },
        });
        return;
      }

      await message.reply({
        // Yargs constrains it, it's just not inferred
        content: `${key} = ${JSON.stringify(config[key as keyof GuildConfig])}`,
        allowedMentions: { repliedUser: false },
      });
    } else if (command === "set") {
      if (!key) {
        await message.reply({
          content: "Need a key to set to",
          allowedMentions: { repliedUser: false },
        });
        return;
      }

      if (!value) {
        await message.reply({
          content: "Need a value to set to",
          allowedMentions: { repliedUser: false },
        });
        return;
      }

      const config = await fetchGuildConfig();
      // Only report entirely missing configs
      if (!config.success && config.error === "no-config-present") {
        await message.reply({
          content: "Set the guild config up first!",
          allowedMentions: { repliedUser: false },
        });
        return;
      }

      await updateGuildConfigValue(
        message.guildId,
        key as keyof GuildConfig,
        value
      );

      await message.reply({
        content: `Set ${key} to ${value}`,
        allowedMentions: { repliedUser: false },
      });
    } else if (command === "list") {
      return await message.reply({
        content: `All valid config values\n\n${CONFIG_LIST}`,
        allowedMentions: { repliedUser: false },
      });
    } else {
      await message.reply({
        content: `Unknown sub-command "${command}"`,
        allowedMentions: { repliedUser: false },
      });
    }
  },
};
