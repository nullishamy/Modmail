import { ping } from "./ping.js";
import { reply } from "./reply.js";
import { close } from "./close.js";
import { Command } from "./types.js";
import { config } from "./config.js";
import { logs } from "./logs.js";
import { block } from "./block.js";
import { unblock } from "./unblock.js";
import { help } from "./help.js";
import { alias } from "./alias.js";

export const commands = [
  ping,
  reply,
  close,
  config,
  logs,
  block,
  unblock,
  help,
  alias,
] as Command[];
