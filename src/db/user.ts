import { User, UserState } from "@prisma/client";
import { GuildMember } from "discord.js";
import { query } from "./util.js";

export function createUserIfNotExists(member: GuildMember) {
  return query((db) =>
    db.user.upsert({
      create: {
        userId: member.id,
        type: "REGULAR",
      },
      update: {
        userId: member.id,
        type: "REGULAR",
      },
      where: {
        userId: member.id,
      },
    })
  );
}

export function fetchUserById(userId: string) {
  return query((db) =>
    db.user.findUnique({
      where: {
        userId,
      },
    })
  );
}

export function updateUserState(user: User, newState: UserState) {
  return query((db) =>
    db.user.update({
      where: {
        id: user.id,
      },
      data: {
        state: newState,
      },
    })
  );
}
