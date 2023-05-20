import { Message } from "discord.js";
import { fetchGuildConfig } from "../config/fetch.js";
import { createMessage } from "../db/message.js";
import { createThread, fetchThreadByAuthorId } from "../db/thread.js";
import { createUserIfNotExists } from "../db/user.js";
import { client } from "../index.js";
import { threadMessageEmbed } from "../ui/thread.js";

export async function onDirectMessage(message: Message) {
  const existingThread = await fetchThreadByAuthorId(message.author.id);
  if (existingThread) {
    const threadChannel = client.channels.cache.get(existingThread.channelId);

    if (!threadChannel?.isTextBased()) {
      // Thread is broken
      await message.channel.send("Broken thread");
      return;
    }

    await threadChannel.send({
      embeds: [threadMessageEmbed(message, message.content, 'THREAD_USER')]
    });
    await message.react("👍");
    await createMessage(message, "THREAD_USER", existingThread);
    return;
  }

  const question = await message.channel.send(
    "Would you like to start a thread with the moderators?"
  );

  await question.react("👍");
  await question.react("👎");

  const response = await question
    .awaitReactions({
      filter: (_, user) => {
        return user.id === message.author.id;
      },
      max: 1,
      time: 10_000,
      errors: ["time"],
    })
    .catch(async () => {
      await message.channel.send("Timeout.");
      return undefined;
    });

  if (!response) {
    return;
  }

  const confirmed = response.has("👍");

  if (!confirmed) {
    await message.channel.send("Aborted.");
    return;
  }

  const { threadCategory, guild } = fetchGuildConfig();

  const thread = await threadCategory.children.create({
    name: `${message.author.username}-${message.author.discriminator}`,
    reason: "Modmail thread",
    topic: `Modmail thread for ${message.author.id}`,
  });

  const member = await guild.members.fetch(message.author.id);

  await createUserIfNotExists(member);

  const threadDb = await createThread(thread, message.author);
  await createMessage(message, 'THREAD_USER', threadDb)

  await thread.send(message.content);
}
