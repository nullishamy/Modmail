import { MessageType } from "@prisma/client";
import { EmbedBuilder, Message } from "discord.js";

const DEFAULT_AVATAR_URL = "https://cdn.discordapp.com/embed/avatars/0.png";

const colours = {
  user: 0xf8c4b4,
  mod: 0x90c8ac,
};

export function threadMessageEmbed(
  message: Message,
  content: string,
  messageType: MessageType
) {
  return new EmbedBuilder()
    .setDescription(content)
    .setTimestamp(new Date())
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.avatarURL() ?? DEFAULT_AVATAR_URL,
    })
    .setFooter({
        text: messageType === 'THREAD_MODERATOR' ? 'From staff' : 'From user'
    })
    .setColor(messageType === 'THREAD_MODERATOR' ? colours.mod : colours.user);
}
