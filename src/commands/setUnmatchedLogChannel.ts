import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord.js";

import { logger } from "..";
import { Command } from "../structures";
import { updateEnv } from "../utils";

export const setUnmatchedLogChannelCommand = new Command<"set-uml-channel">({
	name: "set-uml-channel",
	definition: new SlashCommandBuilder()
		.setName("set-uml-channel")
		.setDescription("Used to set the channel to unmatched minecraft logs to.")
		.setDMPermission(false)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setRequired(true)
				.setDescription("The channel to send unmatched minecraft logs to.")
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
			updateEnv("UNMATCHED_LOG_CHANNEL", id);
			if (message) {
				message.channel.send(`Unmatched Log Channel set to <#${id}>`);
			} else {
				interaction?.reply({
					content: `Unmatched Log Channel set to <#${id}>`,
					ephemeral: true
				});
			}
		} catch (err) {
			if (err) {
				if (message) {
					message.channel.send(
						`I ran into an error when setting the unmatched log channel\n${err.message}`
					);
				} else {
					interaction?.reply({
						content: `I ran into an error when setting the unmatched log channel\n${err.message}`,
						ephemeral: true
					});
				}
				return logger.error(err.toString());
			}
		}
	}
});
