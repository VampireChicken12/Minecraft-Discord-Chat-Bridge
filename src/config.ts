import Bourne from "@hapi/bourne";
import dotenv from "dotenv";
import JoiBase from "joi";

import { MessageTypes, ServerTypes } from "./typings";

// Parse arrays and objects
const Joi: typeof JoiBase = JoiBase.extend(
	{
		type: "object",
		base: JoiBase.object(),
		coerce: {
			from: "string",
			method(value) {
				if (value[0] !== "{" && !/^\s*\{/.test(value)) {
					return { value: undefined };
				}
				try {
					return { value: Bourne.parse(value) };
				} catch (ignoreErr) {
					return { value: undefined };
				}
			}
		}
	},
	{
		type: "array",
		base: JoiBase.array(),
		coerce: {
			from: "string",
			method(value) {
				if (
					typeof value !== "string" ||
					(value[0] !== "[" && !/^\s*\[/.test(value))
				) {
					return { value: undefined };
				}
				try {
					return { value: Bourne.parse(value) };
				} catch (ignoreErr) {
					return { value: undefined };
				}
			}
		}
	}
);

dotenv.config();
export interface ENV {
	TOKEN: string;
	GAME_CHAT_CHANNEL: string;
	START_COMMAND: string;
	PREFIX: string;
	RCON_HOST: string;
	RCON_PASSWORD: string;
	SERVER_TYPE: ServerTypes;
	MESSAGE_TYPE: MessageTypes;
	LOG_UNMATCHED_MESSAGES: string;
	UNMATCHED_LOG_CHANNEL: string;
	DEPLOY_COMMANDS: string;
}
const envVarsSchema = Joi.object<ENV>()
	.keys({
		TOKEN: Joi.string().required().description("Discord bot token"),
		GAME_CHAT_CHANNEL: Joi.string()
			.required()
			.description(
				"Discord channel ID for the bot to post minecraft chat messages in."
			),
		START_COMMAND: Joi.string()
			.required()
			.description("Command to run to listen to server logs"),
		PREFIX: Joi.string().required().description("Prefix for commands"),
		RCON_HOST: Joi.string()
			.required()
			.description("Minecraft servers RCON host to connect to."),
		RCON_PASSWORD: Joi.string()
			.required()
			.description("Minecraft servers RCON password."),
		SERVER_TYPE: Joi.string()
			.required()
			.description("Minecraft server type")
			.valid("paper", "spigot", "vanilla", "purpur", "forge"),
		MESSAGE_TYPE: Joi.string()
			.required()
			.description("Format of messages sent in discord.")
			.valid("text", "embed"),
		LOG_UNMATCHED_MESSAGES: Joi.boolean()
			.required()
			.description(
				"Set to true to send all messages that aren't matched as a death, or chat message or achievement, advancement or goal to a log channel"
			),
		UNMATCHED_LOG_CHANNEL: Joi.string()
			.optional()
			.description("Discord channel ID for the bot to post unmatched logs in.")
			.allow(""),
		DEPLOY_COMMANDS: Joi.boolean()
			.optional()
			.default(false)
			.description(
				"Set to true to deploy slash commands to the server the chat channel is from."
			)
	})
	.unknown();

const { value: envVars, error } = envVarsSchema
	.prefs({ errors: { label: "key" } })
	.validate(process.env);

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

let config = {
	prefix: envVars.PREFIX,
	token: envVars.TOKEN,
	startCommand: envVars.START_COMMAND,
	gameChatChannelId: envVars.GAME_CHAT_CHANNEL,
	rcon: {
		host: envVars.RCON_HOST,
		password: envVars.RCON_PASSWORD
	},
	serverType: envVars.SERVER_TYPE,
	messageType: envVars.MESSAGE_TYPE,
	logUnmatchedMessages: envVars.LOG_UNMATCHED_MESSAGES,
	unmatchedLogChannelId: envVars.UNMATCHED_LOG_CHANNEL,
	deployCommands: envVars.DEPLOY_COMMANDS
};

export default config;
export function updateConfig(newEnvVars: ENV) {
	console.log(newEnvVars);
	config = {
		prefix: newEnvVars.PREFIX,
		token: newEnvVars.TOKEN,
		startCommand: newEnvVars.START_COMMAND,
		gameChatChannelId: newEnvVars.GAME_CHAT_CHANNEL,
		rcon: {
			host: newEnvVars.RCON_HOST,
			password: newEnvVars.RCON_PASSWORD
		},
		serverType: newEnvVars.SERVER_TYPE,
		messageType: newEnvVars.MESSAGE_TYPE,
		logUnmatchedMessages: newEnvVars.LOG_UNMATCHED_MESSAGES,
		unmatchedLogChannelId: newEnvVars.UNMATCHED_LOG_CHANNEL,
		deployCommands: newEnvVars.DEPLOY_COMMANDS
	};
	console.log(config);
}
