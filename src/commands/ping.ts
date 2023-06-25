import yargs from "yargs";
import { Command } from "./types.js";

export const ping: Command = {
  name: "ping",
  description: "tests the bots ping",
  argSchema: yargs(),
  aliases: [],
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
