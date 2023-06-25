import yargs from "yargs";
import { fetchThreadsForUser } from "../db/thread.js";
import { Command } from "./types.js";

const argSchema = yargs().option("user", {
  type: "string",
  defaultDescription: "the caller",
});

export const logs: Command<typeof argSchema> = {
  name: "logs",
  description: "view the threads for a user",
  aliases: [],
  argSchema,
  run: async ({ client, message, args }) => {
    let targetId: string;

    if (args.user) {
      targetId = args.user;
    } else {
      targetId = message.author.id;
    }

    const threads = await fetchThreadsForUser(targetId);

    await message.reply({
      content: threads
        .filter((a, b) => a.state === 'CLOSED')
        .map((t) => `${t.id} - (closed by <@${t.close?.closedById}>) - "${t.messages[0]?.content.substring(0, 30) ?? "None"}"`)
        .join("\n") || "No threads found",
      allowedMentions: { repliedUser: false, users: [] },
    });
  },
};
