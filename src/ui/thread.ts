import { MessageType } from "@prisma/client";
import { EmbedBuilder, GuildMember, Message, time, User } from "discord.js";

const colours = {
  user: 0xf8c4b4,
  mod: 0x90c8ac,
};

export function threadMessageEmbed(
  author: User,
  content: string,
  messageType: MessageType,
  anon: boolean
) {
  const embed = new EmbedBuilder()
    .setDescription(content)
    .setTimestamp(new Date())
    .setFooter({
      text: messageType === "THREAD_MODERATOR" ? "From staff" : "From user",
    })
    .setColor(messageType === "THREAD_MODERATOR" ? colours.mod : colours.user);

  if (!anon) {
    embed.setAuthor({
      name: `@${author.username}`,
      iconURL: author.displayAvatarURL(),
    });
  }
  return embed;
}

export function informativeEmbed(
  startingMessage: Message,
  member: GuildMember
) {
  // @XT was created 12 days ago, joined 5 days ago with no past threads.
  return new EmbedBuilder()
    .setDescription(
      `<@${startingMessage.author.id}> created ${time(
        startingMessage.author.createdAt,
        "R"
      )}, joined ${time(member.joinedAt ?? new Date(), "R")}`
    )
    .setAuthor({
      name: `@${startingMessage.author.username}`,
      iconURL: startingMessage.author.displayAvatarURL(),
    })
    .setColor(colours.user);
}
