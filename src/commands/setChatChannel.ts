import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord.js";

import { logger } from "..";
import { Command } from "../structures";
import { updateEnv } from "../utils";

export const setChannelCommand = new Command<"set-chat-channel">({
	name: "set-chat-channel",
	definition: new SlashCommandBuilder()
		.setName("set-chat-channel")
		.setDescription(
			"Used to set the channel to send minecraft chat messages to."
		)
		.setDMPermission(false)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setRequired(true)
				.setDescription("The channel to send minecraft chat messages to.")
				.addChannelTypes(ChannelType.GuildText)
		),
	execute: async ({ interaction, message, args }) => {
		const id = interaction
			? interaction.options.get("channel")?.channel?.id
			: message && args
			? args[0]
			: null;
		if (!id) return;

		try {
			updateEnv("GAME_CHAT_CHANNEL", id);
			if (message) {
				message.channel.send(`Chat channel set to <#${id}>`);
			} else {
				interaction?.reply({
					content: `Chat channel set to <#${id}>`,
					ephemeral: true
				});
			}
		} catch (err) {
			if (err instanceof Error) {
				if (message) {
					message.channel.send(
						`I ran into an error when setting the chat channel\n${err.message}`
					);
				} else {
					interaction?.reply({
						content: `I ran into an error when setting the chat channel\n${err.message}`,
						ephemeral: true
					});
				}
				return logger.error(err.toString());
			}
		}
	}
});
