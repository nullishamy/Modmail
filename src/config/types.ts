import { CategoryChannel, Guild, TextChannel } from "discord.js"

export interface BotConfig {
    token: string
    guildId: string
}

export interface GuildConfig {
    threadCategory: CategoryChannel,
    logChannel: TextChannel
    guild: Guild
}