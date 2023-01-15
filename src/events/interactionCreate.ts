import { CommandInteractionOptionResolver, InteractionType } from "discord.js";

import { bot } from "..";
import { Event } from "../structures";

export const interactionCreateEvent = new Event({
	name: "interactionCreate",
	handler: (interaction) => {
		if (interaction.type === InteractionType.ApplicationCommand) {
			const { commandName } = interaction;
			const command = bot.commands.get(commandName);
			if (!command) return;
			const subcommandGroup = (
				interaction.options as CommandInteractionOptionResolver
			).getSubcommandGroup(false);
			const subcommandName = (
				interaction.options as CommandInteractionOptionResolver
			).getSubcommand(false);
			if (typeof command.execute === "object") {
				if (subcommandName) {
					if (subcommandGroup) {
						if (
							command.execute[subcommandName][subcommandGroup] &&
							typeof command.execute[subcommandName][subcommandGroup] ===
								"function"
						) {
							command.execute[subcommandName][subcommandGroup]({ interaction });
						}
					} else {
						if (
							command.execute[subcommandName] &&
							typeof command.execute[subcommandName] === "function"
						) {
							command.execute[subcommandName]({ interaction });
						}
					}
					return;
				}
			}
			if (typeof command.execute === "function") {
				command.execute({ interaction });
			}
		}
	}
});
