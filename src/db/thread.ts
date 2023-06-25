import { Thread, ThreadState } from "@prisma/client";
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

interface CloseOpts {
  thread: Thread;
  closerId: string;
  closeMessage: string | undefined;
  silent: boolean;
  closeAt: Date;
}

export function createThreadClose({
  thread,
  closerId,
  closeMessage,
  closeAt,
  silent,
}: CloseOpts) {
  return query((db) =>
    db.threadClose.create({
      data: {
        closeAt,
        closedById: closerId,
        silent,
        threadId: thread.id,
        message: closeMessage,
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

export function updateThreadState(thread: Thread, state: ThreadState) {
  return query((db) =>
    db.thread.update({
      where: {
        channelId: thread.channelId,
      },
      data: {
        state,
      },
    })
  );
}

export function fetchThreadsForUser(userId: string) {
  return query((db) =>
    db.thread.findMany({
      where: {
        authorId: userId,
      },
      include: {
        messages: {
          take: 1,
        },
        close: true,
      },
    })
  );
}

export function fetchScheduledThreads() {
  // All threads where there's a close entry, but the thread has yet to be marked close
  // We cannot simply compare the close time to 'now' because we may have had downtime that 
  // went further than the close date, but we do not want to fetch all past threads, and 
  // also do not want to clear the close records, as they are useful for viewing in the log viewer
  return query((db) =>
    db.threadClose.findMany({
      where: {
        thread: {
          state: {
            equals: "OPEN",
          },
        },
      },
      include: {
        thread: true,
      },
    })
  );
}
