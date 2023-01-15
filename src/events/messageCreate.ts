import { Message } from "discord.js";

import { logger, rcon, ServerStopped } from "..";
import config from "../config";
import { Event } from "../structures";
import { parseMessageParts, splitToSubstrings } from "../utils";
import commandHandler from "../utils/commandHandler";

const { prefix, gameChatChannelId } = config;
export const messageCreateEvent = new Event({
	name: "messageCreate",
	handler: (message) => {
		if (message.author.bot || !message.content) return;
		if (message.channel.id !== gameChatChannelId || ServerStopped) return;
		if (message.content.startsWith(prefix)) {
			return commandHandler(message);
		}

		logger.log(`Processing ${message.content}`);

		const message_parts = splitToSubstrings(message.content, "\n", 1024);

		const tellraw_parts = parseMessageParts(message as Message, message_parts);

		tellraw_parts.forEach(async (tellraw) => {
			await rcon.send(`tellraw @a ${JSON.stringify(tellraw)}`);
		});
	}
});
