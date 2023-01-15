import { Message } from "discord.js";

import { rcon, ServerStopped } from "..";
import config from "../config";
import { Event } from "../structures";
import { parseMessageParts, splitToSubstrings } from "../utils";
import commandHandler from "../utils/commandHandler";

const { prefix, gameChatChannelId } = config;
export const messageUpdateEvent = new Event({
	name: "messageUpdate",
	handler: async (oldMessage, newMessage) => {
		if (oldMessage.content === newMessage.content) return;
		if (newMessage.partial) await newMessage.fetch();
		if (oldMessage.author?.bot || !oldMessage.content) return;
		if (oldMessage.channel.id !== gameChatChannelId || ServerStopped) return;
		if ((newMessage as Message).content.startsWith(prefix)) {
			return commandHandler(newMessage as Message);
		}
		const message_parts = splitToSubstrings(
			(newMessage as Message).content,
			"\n",
			1024
		);

		const tellraw_parts = parseMessageParts(
			newMessage as Message,
			message_parts
		);

		tellraw_parts.forEach(async (tellraw) => {
			await rcon.send(`tellraw @a ${JSON.stringify(tellraw)}`);
		});
	}
});
