import {
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder
} from "@discordjs/builders";
import { CommandInteraction, Message } from "discord.js";

export type CommandExecuteOptions = {
	message?: Message;
	interaction?: CommandInteraction;
	args?: string[];
};
export type CommandExecute = (
	CommandExecuteArgument: CommandExecuteOptions
) => void | Promise<void>;
export type SlashCommandUnion =
	| SlashCommandBuilder
	| SlashCommandSubcommandsOnlyBuilder
	| SlashCommandOptionsOnlyBuilder
	| Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
export interface SubCommandsExecute {
	[key: string]: CommandExecute | SubCommandsExecute;
}
export type CommandOptions<NAME> = {
	name: NAME;
	definition: SlashCommandUnion;

	execute: CommandExecute | SubCommandsExecute;
};

export type CommandType<NAME> = {
	name: NAME;
	definition: SlashCommandUnion;
	execute: CommandExecute | SubCommandsExecute;
};
export class Command<NAME> {
	name: NAME;
	definition: SlashCommandUnion;
	execute: CommandExecute | SubCommandsExecute;

	constructor(options: CommandOptions<NAME>) {
		this.name = options.name;
		this.definition = options.definition;
		this.execute = options.execute;
	}
}
