import { GuildConfig } from "@prisma/client";
import { query } from "./util.js";

export function initGuildConfig(guildId: string) {
  return query((db) =>
    db.guildConfig.create({
      data: {
        guildId,
      },
    })
  );
}

export function updateGuildConfigValue(
  guildId: string,
  key: keyof GuildConfig,
  value: string
) {
  return query((db) =>
    db.guildConfig.update({
      where: {
        guildId,
      },
      data: {
        [key]: value,
      },
    })
  );
}

export function resetGuildConfig(guildId: string) {
  return query((db) =>
    db.guildConfig.update({
      where: {
        guildId,
      },
      data: {},
    })
  );
}
