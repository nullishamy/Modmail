import { MessageType, Thread } from "@prisma/client";
import { Message } from "discord.js";
import { query } from "./util.js";

export function createMessage(
  message: Message,
  messageType: MessageType,
  thread: Thread,
  contentOverride?: string
) {
  return query((db) =>
    db.message.create({
      data: {
        id: message.id,
        content: contentOverride ?? message.content,
        type: messageType,
        authorId: message.author.id,
        threadId: thread.channelId,
      },
    })
  );
}
