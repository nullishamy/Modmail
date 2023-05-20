import { TextChannel, User } from "discord.js";
import { query } from "./util.js";

export function createThread(threadChannel: TextChannel, author: User) {
  return query((db) => {
    return db.thread.create({
      data: {
        channelId: threadChannel.id,
        authorId: author.id,
        state: "OPEN",
      },
    });
  });
}

export function fetchThreadByAuthorId(authorId: string) {
  return query((db) =>
    db.thread.findFirst({
      where: {
        authorId,
        state: "OPEN",
      },
    })
  );
}

export function fetchThreadByChannelId(channelId: string) {
  return query((db) =>
    db.thread.findFirst({
      where: {
        channelId,
        state: "OPEN",
      },
    })
  );
}