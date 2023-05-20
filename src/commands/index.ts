import { ping } from "./ping.js";
import { reply } from "./reply.js";
import { Command } from "./types.js";

export const commands = [
    ping,
    reply
] as Command[]