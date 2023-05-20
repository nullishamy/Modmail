import yargs from "yargs";
import { Command } from "./types.js";

const argSchema = yargs().boolean("anon")

export const ping: Command<typeof argSchema> = {
  name: "ping",
  description: "Tests the bots ping",
  aliases: [],
  argSchema,
  run: async ({ client, message }) => {
    const start = Date.now();
    await client.user?.fetch(true);
    const dif = Date.now() - start;

    await message.reply({
      content: `${dif} ms`,
      allowedMentions: { repliedUser: false },
    });
  },
};
