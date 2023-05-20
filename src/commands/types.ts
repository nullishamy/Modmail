import { Client, Message } from "discord.js";
import { Argv } from "yargs";
import { BotConfig } from "../config/types.js";

export interface CommandParameters<TArgs> {
  client: Client;
  message: Message;
  config: BotConfig;
  args: TArgs;
}

type InferArgv<TArgs> = TArgs extends Argv<infer R>
  ? R & {
      [x: string]: unknown;
      _: (string | number)[];
      $0: string;
    }
  : never;

export interface Command<TArgs = Argv<object>> {
  name: string;
  description: string;
  aliases: string[];
  argSchema: TArgs;

  run(params: CommandParameters<InferArgv<TArgs>>): Promise<unknown> | unknown;
}
