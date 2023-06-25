import yargs from "yargs";
import { commands } from "./index.js";
import { Command } from "./types.js";

export const help: Command = {
  name: "help",
  description: "shows the command list",
  argSchema: yargs(),
  aliases: [],
  run: async ({ message }) => {
    const commandList = commands
      .map((c) => `${c.name} - ${c.description}`)
      .join("\n");
    await message.reply({
      content: `Run "++<command> --help" to get detailed help for a given command\n\n${commandList}`,
      allowedMentions: { repliedUser: false },
    });
  },
};
