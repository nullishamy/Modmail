import { Alias } from "@prisma/client";
import { query } from "./util.js";

export async function fetchAllAliases() {
  return query((db) => db.alias.findMany());
}

export async function fetchAliasByName(name: string) {
  return query((db) =>
    db.alias.findFirst({
      where: {
        key: name,
      },
    })
  );
}

export async function createAlias(name: string, text: string) {
  return query((db) =>
    db.alias.create({
      data: {
        key: name,
        text,
      },
    })
  );
}

export async function updateAlias(alias: Alias, newText: string) {
  return query((db) =>
    db.alias.update({
      where: {
        id: alias.id,
      },
      data: {
        text: newText,
      },
    })
  );
}
