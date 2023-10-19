import { CommandInteractionOptionResolver, InteractionType } from "discord.js";

import { bot } from "..";
import { Event } from "../structures";
import type { CommandExecute, SubCommandsExecute } from "../structures/Command";

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
				if (subcommandName && subcommandGroup) {
					if (
						command.execute[subcommandName] !== undefined &&
						typeof command.execute[subcommandName] === "object" &&
						(command.execute[subcommandName] as SubCommandsExecute)[
							subcommandGroup
						] !== undefined &&
						typeof (command.execute[subcommandName] as SubCommandsExecute)[
							subcommandGroup
						] === "function"
					) {
						(
							(command.execute[subcommandName] as SubCommandsExecute)[
								subcommandGroup
							] as CommandExecute
						)({
							interaction
						});
					}
				} else if (subcommandName && !subcommandGroup) {
					if (
						command.execute[subcommandName] &&
						typeof command.execute[subcommandName] === "function"
					) {
						(command.execute[subcommandName] as CommandExecute)({
							interaction
						});
					}
				}
			}
			if (typeof command.execute === "function") {
				command.execute({ interaction });
			}
		}
	}
});
