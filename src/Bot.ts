import { Client, Collection, GatewayIntentBits } from "discord.js";

import { apiVersion } from ".";
import { allCommands } from "./commands";
import { allEvents } from "./events";
import { Command } from "./structures";

export default class Bot {
	client: Client;
	private _commands: Collection<string, Command<any>>;
	constructor() {
		this.client = new Client({
			rest: { version: apiVersion },
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.GuildWebhooks
			],
			allowedMentions: { repliedUser: true, parse: ["roles", "users"] }
		});
		this._commands = new Collection();
		this.setupEvents();
		this.setupCommands();
	}
	setupEvents() {
		allEvents.forEach(({ name, handler }) => {
			this.client.on(name, handler);
		});
	}
	setupCommands() {
		allCommands.forEach((cmd) => {
			this.commands.set(cmd.name, cmd);
		});
	}
	get commands() {
		return this._commands;
	}
}
