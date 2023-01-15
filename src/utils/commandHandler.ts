import { Message } from "discord.js";

import { bot } from "..";
import config from "../config";

const { prefix } = config;
export default function commandHandler(message: Message) {
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const desiredCommand = args.shift()?.toLowerCase();
	if (desiredCommand === undefined) return;
	const command = bot.commands.get(desiredCommand);
	if (command === undefined) return;
	const [subcommand] = args;
	if (typeof command.execute === "object") {
		if (
			command.execute[subcommand] &&
			typeof command.execute[subcommand] === "function"
		) {
			command.execute[subcommand]({ message, args: args.slice(1) });
		}
	} else {
		command.execute({ message, args });
	}
}
// TODO: setup dynamic command loading
// TODO: if command has subcommands add folder for command with files in it for handling individual subcommands and have main file register all commands
