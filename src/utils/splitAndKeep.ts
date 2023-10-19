import { Message } from "discord.js";

import { decimalToHex, validURL } from ".";
import type { SplitMethod } from "../typings";

function splitAndKeep(
	str: string,
	separator: string,
	method: SplitMethod = "separate"
) {
	let result: string[] = [];
	if (method == "separate") {
		result = str.split(new RegExp(`(${separator})`, "g"));
	} else if (method == "beginning") {
		result = str.split(new RegExp(`(?=${separator})`, "g"));
	} else if (method == "behind") {
		result = str.split(new RegExp(`(.*?${separator})`, "g"));
		result = result.filter(function (el) {
			return el !== "";
		});
	}
	return result;
}
export default function splitAndKeepParse(
	message: Message,
	part_tellraw: any[],
	message_part: string
) {
	splitAndKeep(message_part, " ").map((part) => {
		if (/<@!?(\d{17,19})>/.test(part)) {
			const member = message.guild?.members.cache.get(
				part.match(/<@!?(\d{17,19})>/)?.[1] ?? ""
			);
			if (member) {
				part_tellraw.push({
					text:
						"[" +
						(member.nickname !== null
							? member.nickname
							: member.user.username) +
						"]",
					color: "#" + decimalToHex(member.roles.highest.color),
					hoverEvent: {
						action: "show_text",
						contents: [
							`${member.user.username}#${member.user.discriminator}\nID: ${member.user.id}`
						]
					}
				});
			}
		} else if (/<@&(\d{17,19})>/.test(part)) {
			const role = message.guild?.roles.cache.find(
				(role) => role.id === part.match(/<@&(\d{17,19})>/)?.[1]
			);
			if (role) {
				part_tellraw.push({
					text: "(" + role.name + ")",
					color: "#" + decimalToHex(role.color),
					hoverEvent: { action: "show_text", contents: [""] }
				});
			}
		} else if (/<#(\d{17,19})>/.test(part)) {
			const channel = message.guild?.channels.cache.find(
				(channel) => channel.id === part.match(/<#(\d{17,19})>/)?.[1]
			);
			if (channel) {
				part_tellraw.push({
					text: channel.name,
					color: "green",
					hoverEvent: {
						action: "show_text",
						contents: ["Click me to open channel in discord"]
					},
					clickEvent: {
						action: "open_url",
						value: `https://discord.com/channels/${channel.guildId}/${channel.id}`
					}
				});
			}
		} else {
			if (validURL(part)) {
				part_tellraw.push({
					text: part,
					color: "blue",
					hoverEvent: {
						action: "show_text",
						contents: ["Click me to open link in browser"]
					},
					clickEvent: { action: "open_url", value: part }
				});
			} else {
				// Grab last element in part_tellraw and append to it if it is normal text
				if (part_tellraw.length > 0) {
					const last_message_part = part_tellraw[part_tellraw.length - 1];
					if (
						last_message_part.color == "white" &&
						JSON.stringify(last_message_part.hoverEvent) ==
							JSON.stringify({ action: "show_text", contents: [""] })
					) {
						last_message_part.text += part;
						return;
					}
				}
				// If it is not normal text, create a new element
				part_tellraw.push({
					text: part,
					color: "white",
					hoverEvent: { action: "show_text", contents: [""] }
				});
			}
		}
	});
}
