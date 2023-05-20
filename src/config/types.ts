import { CategoryChannel, Guild } from "discord.js"

export interface BotConfig {
    token: string
    guildId: string
    categoryId: string
}

export interface GuildConfig {
    threadCategory: CategoryChannel
    guild: Guild
}