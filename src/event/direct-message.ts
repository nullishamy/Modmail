import { Message } from "discord.js";
import { fetchGuildConfig } from "../config/fetch.js";
import { createMessage } from "../db/message.js";
import { createThread, fetchThreadByAuthorId } from "../db/thread.js";
import { createUserIfNotExists } from "../db/user.js";
import { client } from "../index.js";
import { informativeEmbed, threadMessageEmbed } from "../ui/thread.js";

export async function onDirectMessage(message: Message) {
  const guildConfig = await fetchGuildConfig();

  if (!guildConfig.success) {
    if (guildConfig.error === "no-config-present") {
      // We have no config at all, we can only log to error
      logger.error(
        "No guild config has been setup, but a thread is being created. Cannot continue thread creation. Please setup the guild config."
      );
      await message.channel.send(
        "Sorry, the server you are trying to communicate with has not set me up! Please let them know, and try again soon."
      );
      return;
    } else {
      logger.error(
        `Missing required guild config attribute "${guildConfig.data}" (evaluated during thread creation). Please set the value and try again.`
      );
      await message.channel.send(
        `Sorry, the server you are trying to communicate with has not set me up entirely! Please let them know, quote the value '${guildConfig.data}', and try again soon.`
      );
      return;
    }
  }

  const { threadCategory, guild } = guildConfig.data;

  const member = await guild.members.fetch(message.author.id);
  const modmailUser = await createUserIfNotExists(member);

  if (modmailUser.state !== 'UNBLOCKED') {
    return await message.channel.send("You are blocked from using Modmail at this time.")
  }

  const existingThread = await fetchThreadByAuthorId(message.author.id);
  if (existingThread) {
    const threadChannel = client.channels.cache.get(existingThread.channelId);

    if (!threadChannel?.isTextBased()) {
      // Thread is broken
      await message.channel.send("Broken thread");
      return;
    }

    await threadChannel.send({
      embeds: [threadMessageEmbed(message.author, message.content, "THREAD_USER", false)],
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

  const thread = await threadCategory.children.create({
    name: `${message.author.username}`,
    reason: "Modmail thread",
    topic: `Modmail thread for ${message.author.id}`,
  });

  const threadDb = await createThread(thread, message.author);
  await createMessage(message, "THREAD_USER", threadDb);

  await thread.send({
    embeds: [
      informativeEmbed(message, member),
      threadMessageEmbed(message.author, message.content, "THREAD_USER", false),
    ],
  });

  await message.channel.send(
    "Thread created, the staff team will get back to you shortly."
  );
}
