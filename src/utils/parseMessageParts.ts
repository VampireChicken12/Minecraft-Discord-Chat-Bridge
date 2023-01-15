import { Message } from "discord.js";

import { decimalToHex, splitAndKeepParse } from ".";
import { Part } from "../typings";

export default function parseMessageParts(
	message: Message,
	messages: string[]
): Part[][] {
	const repliedMessage = message.reference
		? message.reference.messageId
			? message.channel.messages.cache.get(message.reference.messageId)
			: null
		: null;

	const tellraw_parts: Part[][] = [];
	messages.forEach((message_part) => {
		let part_tellraw: Part[] = [];
		if (repliedMessage) {
			const repliedMember = message.guild?.members.cache.get(
				repliedMessage.author.id
			);
			if (repliedMember) {
				part_tellraw.push({
					text: `[${
						repliedMember.nickname
							? repliedMember.nickname
							: repliedMessage.author?.username
					}] `,
					color: `#${decimalToHex(repliedMember.roles.highest.color)}`,
					hoverEvent: {
						action: "show_text",
						contents: [
							`${repliedMember.user?.username}#${repliedMember.user?.discriminator}\\nID: ${repliedMember.user?.id}`
						]
					}
				});
				splitAndKeepParse(repliedMessage, part_tellraw, repliedMessage.content);

				tellraw_parts.push(part_tellraw);
				part_tellraw = [];
				part_tellraw.push({
					text: `[${
						message.member?.nickname
							? message.member?.nickname
							: message.author?.username
					}] `,
					color: `#${
						message.member
							? decimalToHex(message.member.roles.highest.color)
							: "000000"
					}`,
					hoverEvent: {
						action: "show_text",
						contents: [
							`${message.author?.username}#${message.author?.discriminator}\\nID: ${message.author?.id}`
						]
					}
				});
				part_tellraw.push({
					text: "replied to ",
					color: "white",
					hoverEvent: { action: "show_text", contents: [""] }
				});
				part_tellraw.push({
					text:
						"[" +
						(repliedMember.nickname !== null
							? repliedMember.nickname
							: repliedMember.user.username) +
						"]",
					color: `#${decimalToHex(repliedMember.roles.highest.color)}`,
					hoverEvent: {
						action: "show_text",
						contents: [
							`${repliedMember.user.username}#${repliedMember.user.discriminator}\nID: ${repliedMember.user.id}`
						]
					}
				});

				tellraw_parts.push(part_tellraw);
				part_tellraw = [];
			}
		}
		part_tellraw.push({
			text: `[${
				message.member?.nickname
					? message.member?.nickname
					: message.author?.username
			}] `,
			color: `#${
				message.member
					? decimalToHex(message.member.roles.highest.color)
					: "000000"
			}`,
			hoverEvent: {
				action: "show_text",
				contents: [
					`${message.author?.username}#${message.author?.discriminator}\\nID: ${message.author?.id}`
				]
			}
		});
		splitAndKeepParse(message, part_tellraw, message_part);
		tellraw_parts.push(part_tellraw);
	});
	return tellraw_parts;
}
