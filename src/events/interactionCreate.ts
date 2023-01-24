import { CommandInteractionOptionResolver, InteractionType } from "discord.js";

import { bot } from "..";
import { Event } from "../structures";
import { CommandExecute } from "../structures/Command";

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
			console.log(subcommandGroup, subcommandName);
			console.log(command);
			console.log(typeof command.execute);
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
							(command.execute[subcommandName] as CommandExecute)({
								interaction
							});
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
