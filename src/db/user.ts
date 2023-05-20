import { GuildMember } from "discord.js";
import { query } from "./util.js";

export function createUserIfNotExists(member: GuildMember) {
  return query((db) =>
    db.user.upsert({
      create: {
        id: member.id,
        type: "REGULAR",
      },
      update: {
        id: member.id,
        type: "REGULAR",
      },
      where: {
        id: member.id,
      },
    })
  );
}

export function fetchUserById(userId: string) {
  return query((db) =>
    db.user.findUnique({
      where: {
        id: userId,
      },
    })
  );
}
