import { Routes } from "discord-api-types/v10";
import { Guild, TextChannel } from "discord.js";

import { bot, discordRest, logger } from "..";
import { allCommands } from "../commands";
import config from "../config";

export default async function deployCommands() {
	logger.info("deployCommands: Started refreshing application commands.");
	const channel = bot.client.channels.cache.has(config.gameChatChannelId)
		? (bot.client.channels.cache.get(config.gameChatChannelId) as TextChannel)
		: null;
	if (!channel)
		logger.error(
			"deployCommands: Unable to find game chat channel therefore the application is unable to deploy commands to the server."
		);
	const guild = channel
		? (bot.client.guilds.cache.get(channel.guild.id) as Guild)
		: null;
	if (!guild) return;
	await discordRest
		.put(
			Routes.applicationGuildCommands(bot.client.user?.id as string, guild.id),
			{
				body: allCommands.map((cmd) => cmd.definition.toJSON())
			}
		)
		.then(() =>
			logger.info("deployCommands: Successfully deployed application commands.")
		);
}
