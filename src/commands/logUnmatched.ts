import { SlashCommandBuilder } from "@discordjs/builders";

import { logger } from "..";
import { Command } from "../structures";
import { updateEnv } from "../utils";

export const logUnmatchedCommand = new Command<"log-unmatched">({
	name: "log-unmatched",
	definition: new SlashCommandBuilder()
		.setName("log-unmatched")
		.setDescription(
			"Used to enable the sending of unmatched logs to the unmatched log channel."
		)
		.setDMPermission(false)
		.addBooleanOption((option) =>
			option
				.setName("log")
				.setRequired(true)
				.setDescription("Whether or not to send unmatched logs.")
		),
	execute: async ({ interaction, message, args }) => {
		const value = interaction
			? (interaction.options.get("log").value as string)
			: message && args
			? ["true", "false", "yes", "no"].includes(args[0])
				? ["true", "yes"].includes(args[0])
					? "true"
					: "false"
				: null
			: null;
		if (!value) return;
		try {
			updateEnv("LOG_UNMATCHED_MESSAGES", value);
			if (message) {
				message.channel.send(`Log unmatched messages set to ${value}`);
			} else {
				interaction?.reply({
					content: `Log unmatched messages set to ${value}`,
					ephemeral: true
				});
			}
		} catch (err) {
			if (err) {
				if (message) {
					message.channel.send(
						`I ran into an error when setting the log unmatched messages setting\n${err.message}`
					);
				} else {
					interaction?.reply({
						content: `I ran into an error when setting the log unmatched messages setting\n${err.message}`,
						ephemeral: true
					});
				}
				return logger.error(err.toString());
			}
		}
	}
});
