import { Client, IntentsBitField, Message, TextChannel, Webhook } from "discord.js";
import dotenv from "dotenv";
import { readFileSync, writeFile } from "fs";
import jimp from "jimp";
import fetch from "node-fetch";
import { spawn } from "node-pty-prebuilt-multiarch";
import { Rcon } from "rcon-client";
import { EmbedBuilder } from "discord.js";
import { regexes } from "./death_message_regex";
import Logger from "./logger";

const logger = new Logger();
const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMessageTyping,
		IntentsBitField.Flags.GuildWebhooks
	],
	allowedMentions: { repliedUser: true, parse: ["roles", "users"] }
});
dotenv.config();
interface ENV {
	TOKEN: string | undefined;
	GAME_CHAT_CHANNEL: string | undefined;
	START_COMMAND: string | undefined;
	PREFIX: string | undefined;
	RCON_HOST: string | undefined;
	RCON_PASSWORD: string | undefined;
	SERVER_TYPE: string | undefined;
}
interface Config {
	TOKEN: string;
	GAME_CHAT_CHANNEL: string;
	START_COMMAND: string;
	PREFIX: string;
	RCON_HOST: string;
	RCON_PASSWORD: string;
	SERVER_TYPE: ServerTypes;
}
const getEnv = (): ENV => {
	return {
		TOKEN: process.env.TOKEN,
		GAME_CHAT_CHANNEL: process.env.GAME_CHAT_CHANNEL,
		START_COMMAND: process.env.START_COMMAND,
		PREFIX: process.env.PREFIX,
		RCON_HOST: process.env.RCON_HOST,
		RCON_PASSWORD: process.env.RCON_PASSWORD,
		SERVER_TYPE: process.env.SERVER_TYPE
	};
};
const getSanitizedEnv = (env: ENV) => {
	for (const [key, value] of Object.entries(env)) {
		if (value === undefined) {
			throw new Error(`${key} is a required environment variable that is missing.`);
		}
	}
	return env as Config;
};
const config = getEnv();

const { TOKEN, GAME_CHAT_CHANNEL, START_COMMAND, PREFIX, RCON_HOST, RCON_PASSWORD, SERVER_TYPE } = getSanitizedEnv(config);
let ServerStopped = false;

if (!["paper", "spigot", "vanilla", "purpur", "forge"].includes(SERVER_TYPE)) {
	logger.error(`Environment variable SERVER_TYPE's value is invalid. Valid values are 'paper' , 'spigot' ,'vanilla', 'purpur', 'forge'.`);
	process.exit();
}

function getInfoLength(server_type: ServerTypes) {
	return {
		...{
			chat_regex: ["purpur", "spigot"].includes(server_type)
				? /\[\d{2}:\d{2}:\d{2}\] \[Async Chat Thread - #\d.*\/INFO\]: /i
				: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i
		},
		...(server_type === "forge"
			? {
					chat_regex: /\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: /i,
					info_regex: /\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: /i,
					join_regex:
						/\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: (.* joined the game)/i,
					leave_regex:
						/\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: (.* left the game)/i,
					goal_regex:
						/\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: (.* has reached the goal \[.*\])/i,
					challenge_regex:
						/\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: (.* has completed the challenge \[.*\])/i,
					advancement_regex:
						/\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: (.* has made the advancement \[.*\])/i
			  }
			: {
					info_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i,
					join_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* joined the game)/i,
					leave_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* left the game)/i,
					goal_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has reached the goal \[.*\])/i,
					challenge_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has completed the challenge \[.*\])/i,
					advancement_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has made the advancement \[.*\])/i
			  })
	};
}
type ServerTypes = "paper" | "spigot" | "vanilla" | "purpur" | "forge";
const InfoLengthRegExps = getInfoLength(SERVER_TYPE);
const shell = process.platform === "win32" ? "powershell.exe" : "bash";

const ptyProcess = spawn(shell, [], {
	name: "xterm-color",
	cols: 100,
	rows: 40,
	cwd: process.cwd()
});
console.log(`Starting ${shell} with command: ${START_COMMAND}`);
ptyProcess.write(`${START_COMMAND}\r`);

client.on("ready", async (client) => {
	logger.info(`Logged in as ${client.user.tag}`);
	const gameChannelExists = client.channels.cache.has(GAME_CHAT_CHANNEL);
	if (gameChannelExists) {
		const gameChannel = client.channels.cache.find((channel) => channel.id === GAME_CHAT_CHANNEL)! as TextChannel;

		const webhooks = await gameChannel.fetchWebhooks();
		if (webhooks.size === 0) {
			gameChannel.createWebhook({
				name: "Minecraft Chat Webhook",
				avatar: client.user.displayAvatarURL({ size: 2048 })
			});
		}
		const webhook = webhooks.find((webhook) => webhook.name === "Minecraft Chat Webhook");
		if (webhook) {
			const rcon = await Rcon.connect({
				host: RCON_HOST,
				password: RCON_PASSWORD
			});
			client.on("messageCreate", async (message) => {
				if (message.author.bot || !message.content || message.content.startsWith(PREFIX)) {
					const args = message.content.slice(PREFIX.length).trim().split(/ +/);
					const command = args.shift()!.toLowerCase();
					if (command === "setchannel") {
						const fileName = "./.env";
						const file = readFileSync(fileName).toString();
						if (file.match(/GAME_CHAT_CHANNEL=\d{17,19}/gi)) {
							writeFile(
								fileName,
								file.replace(
									/GAME_CHAT_CHANNEL=\d{17,19}/gi,
									`GAME_CHAT_CHANNEL=${message.mentions.channels.first() ? message.mentions.channels.first()!.id : args[0]}`
								),
								function (err) {
									if (err) {
										message.channel.send("I ran into an error when setting the chat channel");
										return console.error(err);
									}
									logger.log("Written to " + fileName);
									return message.channel
										.send(
											`Chat channel set to ${
												message.mentions.channels.first() ? message.mentions.channels.first() : "<#" + args[0] + ">"
											}\nRestarting bot and server to apply change.`
										)
										.then(() => {
											process.exit();
										});
								}
							);
						}
					}
				}

				if (message.author.bot || !message.content || message.channel.id !== GAME_CHAT_CHANNEL || ServerStopped) return;

				console.log(`Processing ${message.content}`);

				const message_parts = splitToSubstrings(message.content, "\n", 1024);

				const tellraw_parts = parseMessageParts(message as Message, message_parts);

				tellraw_parts.forEach(async (tellraw) => {
					await rcon.send(`tellraw @a ${JSON.stringify(tellraw)}`);
				});
			});
			client.on("messageUpdate", async (oldMessage, newMessage) => {
				if (oldMessage.content === newMessage.content) return;
				if (newMessage.partial) await newMessage.fetch();
				if (newMessage.author?.bot || !newMessage.content || newMessage.channel.id !== GAME_CHAT_CHANNEL || ServerStopped) return;
				const message_parts = splitToSubstrings(newMessage.content, "\n", 1024);

				const tellraw_parts = parseMessageParts(newMessage as Message, message_parts);

				tellraw_parts.forEach(async (tellraw) => {
					await rcon.send(`tellraw @a ${JSON.stringify(tellraw)}`);
				});
			});
			ptyProcess.on("data", function (data) {
				console.log(`Data from log: ${data}`);
				var FilteredData = data.toString();
				const DataType = InfoLengthRegExps.chat_regex.test(FilteredData) ? "chat" : InfoLengthRegExps.info_regex.test(FilteredData) ? "info" : null;
				if (DataType === null) {
					return;
				}
				const DataInfoLength =
					(DataType === "chat"
						? FilteredData.match(InfoLengthRegExps.chat_regex)?.[0]!.length
						: FilteredData.match(InfoLengthRegExps.info_regex)?.[0]!.length) ?? 0;

				if (FilteredData.slice(DataInfoLength).charAt(0) == "<" && FilteredData.includes(">")) {
					FilteredData = FilteredData.split("\n").join(" ");
					FilteredData = FilteredData.slice(DataInfoLength);
					FilteredData = /^<\[.*\]/.test(FilteredData) ? FilteredData.replace(FilteredData.match(/^<(\[.*\])/)?.[1] + " " ?? "", "") : FilteredData;

					SendData(webhook, FilteredData);
					return;
				}
				if (InfoLengthRegExps.join_regex.test(FilteredData) && !FilteredData.includes("tellraw")) {
					FilteredData = FilteredData.split("\n").join(" ");
					FilteredData = FilteredData.match(InfoLengthRegExps.join_regex)?.[1] ?? FilteredData;
					SendData(webhook, FilteredData);
					return;
				}

				if (InfoLengthRegExps.leave_regex.test(FilteredData) && !FilteredData.includes("tellraw")) {
					FilteredData = FilteredData.split("\n").join(" ");
					FilteredData = FilteredData.match(InfoLengthRegExps.leave_regex)?.[1] ?? FilteredData;
					SendData(webhook, FilteredData);
					return;
				}
				if (FilteredData.includes("Starting minecraft server") && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					ServerStopped = false;
					SendData(webhook, "The server is starting");
					return;
				}
				if (FilteredData.includes("Stopping the server") && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					ServerStopped = true;
					SendData(webhook, "The server is stopping");
					return;
				}
				if (InfoLengthRegExps.goal_regex.test(FilteredData) && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					SendData(webhook, "<" + FilteredData.match(InfoLengthRegExps.goal_regex)![1]!.replace("[", "**").replace("]", "**"));
					return;
				}
				if (InfoLengthRegExps.challenge_regex.test(FilteredData) && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					SendData(webhook, "<" + FilteredData.match(InfoLengthRegExps.challenge_regex)![1]!.replace("[", "**").replace("]", "**"));
					return;
				}
				if (InfoLengthRegExps.advancement_regex.test(FilteredData) && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					SendData(webhook, "<" + FilteredData.match(InfoLengthRegExps.advancement_regex)![1]!.replace("[", "**").replace("]", "**"));
					return;
				}
				for (const regex of regexes) {
					if (regex.test(FilteredData)) {
						FilteredData = FilteredData.split("\r\n").join("");
						SendData(webhook, "<" + FilteredData.match(regex)![2] + "> " + FilteredData.match(regex)![3]);
						break;
					}
				}
				// If we get here, it was probably an unhandled death message
				if (InfoLengthRegExps.info_regex.test(FilteredData)) {
					FilteredData = FilteredData.split("\r\n").join("");
					FilteredData = FilteredData.slice(DataInfoLength);
					SendData(webhook, FilteredData + " :skull:");
				}
				if (ServerStopped && FilteredData.includes("All dimensions are saved")) {
					setTimeout(() => process.exit(), 2000);
				}
			});
		}
	} else {
		throw Error("Invalid Game Chat Channel ID provided");
	}
});
function parseMessageParts(message: Message, messages: string[]) {
	const repliedMessage = message.reference ? message.channel.messages.cache.get(message.reference?.messageId!) : null;

	const tellraw_parts: any[] = [];
	messages.forEach((message_part) => {
		let part_tellraw = [];
		if (repliedMessage) {
			const repliedMember = message.guild?.members.cache.get(repliedMessage.author.id);
			if (repliedMember) {
				part_tellraw.push(
					JSON.parse(
						`{"text":"[${repliedMember?.nickname ? repliedMember?.nickname : repliedMessage.author?.username}] ", "color":  "#${decimalToHex(
							repliedMember!.roles.highest.color
						)}","hoverEvent":{"action":"show_text","contents":["${message.author?.username}#${message.author?.discriminator}\\nID: ${
							message.author?.id
						}"]}}`
					)
				);
				splitAndKeepParse(repliedMessage, part_tellraw, repliedMessage.content);

				tellraw_parts.push(part_tellraw);
				part_tellraw = [];
				part_tellraw.push(
					JSON.parse(
						`{"text":"[${message.member?.nickname ? message.member?.nickname : message.author?.username}] ", "color":  "#${decimalToHex(
							message.member!.roles.highest.color
						)}","hoverEvent":{"action":"show_text","contents":["${message.author?.username}#${message.author?.discriminator}\\nID: ${
							message.author?.id
						}"]}}`
					)
				);
				part_tellraw.push({
					text: "replied to ",
					color: "white",
					hoverEvent: { action: "show_text", contents: [""] }
				});
				part_tellraw.push({
					text: "[" + (repliedMember.nickname !== null ? repliedMember.nickname : repliedMember.user.username) + "]",
					color: "#" + decimalToHex(repliedMember.roles.highest.color),
					hoverEvent: {
						action: "show_text",
						contents: [`${repliedMember.user.username}#${repliedMember.user.discriminator}\nID: ${repliedMember.user.id}`]
					}
				});

				tellraw_parts.push(part_tellraw);
				part_tellraw = [];
			}
		}
		part_tellraw.push(
			JSON.parse(
				`{"text":"[${message.member?.nickname ? message.member?.nickname : message.author?.username}] ", "color":  "#${decimalToHex(
					message.member!.roles.highest.color
				)}","hoverEvent":{"action":"show_text","contents":["${message.author?.username}#${message.author?.discriminator}\\nID: ${
					message.author?.id
				}"]}}`
			)
		);
		splitAndKeepParse(message, part_tellraw, message_part);
		tellraw_parts.push(part_tellraw);
	});
	return tellraw_parts;
}
function splitToSubstrings(str: string, splitCharacter: string, length: number) {
	const splitted = str.split(splitCharacter);
	const result: string[] = [];

	for (let portion of splitted) {
		const last = result.length - 1;
		if (result[last] && (result[last] + portion).length < length) {
			result[last] = result[last] + splitCharacter + portion;
		} else {
			result.push(portion);
		}
	}
	return result;
}
async function SendData(webhook: Webhook, FilteredData: string) {
	console.log(`Trying to send data: ${FilteredData}`);
	if (FilteredData.includes("<")) {
		let username = FilteredData.replace(/<|>/g, "").split(" ")[0]!;
		webhook.send({
			content: FilteredData.slice(username.length + 2),
			username: username,
			avatarURL: (await GetPlayerIcon(webhook, username))!
		});
	} else {
		webhook.send({
			content: FilteredData,
			username: "Server",
			avatarURL: client.user!.avatarURL()!
		});
	}
}

async function GetPlayerIcon(webhook: Webhook, Username: string) {
	await jimp
		.read(await StealSkin(Username))
		.then((image) => {
			image.crop(8, 8, 8, 8).resize(128, 128, jimp.RESIZE_NEAREST_NEIGHBOR).contain(128, 256).contain(256, 256).write("skin_face.png");
		})
		.catch((err) => {
			console.error(err);
		});

	return (await webhook.edit({ avatar: "./skin_face.png" })).avatarURL();
}

async function StealSkin(Username: string) {
	let SkinURL = "";

	try {
		await fetch(`https://api.mojang.com/users/profiles/minecraft/${Username}`, {
			method: "Get"
		})
			.then((res) => res.json())
			.then(async (json) => {
				await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${json.id}/`, { method: "Get" })
					.then((res) => res.json())
					.then(async (json) => {
						SkinURL = await JSON.parse(Buffer.from(json.properties[0].value, "base64").toString()).textures.SKIN.url;
					});
			});
	} catch (err) {
		SkinURL = "http://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b";
	}

	return SkinURL;
}
type SplitMethod = "separate" | "beginning" | "behind";
function splitAndKeep(str: string, separator: string, method: SplitMethod = "separate") {
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
function splitAndKeepParse(message: Message, part_tellraw: any[], message_part: string) {
	splitAndKeep(message_part, " ").map((part) => {
		if (/<@!?(\d{17,19})>/.test(part)) {
			const member = message.guild!.members.cache!.get(part.match(/<@!?(\d{17,19})>/)?.[1] ?? "")!;
			if (!member) return;
			part_tellraw.push({
				text: "[" + (member.nickname !== null ? member.nickname : member.user.username) + "]",
				color: "#" + decimalToHex(member.roles.highest.color),
				hoverEvent: {
					action: "show_text",
					contents: [`${member.user.username}#${member.user.discriminator}\nID: ${member.user.id}`]
				}
			});
		} else if (/<@&(\d{17,19})>/.test(part)) {
			const role = message.guild!.roles.cache.find((role) => role.id === part.match(/<@&(\d{17,19})>/)![1])!;
			part_tellraw.push({
				text: "(" + role.name + ")",
				color: "#" + decimalToHex(role.color),
				hoverEvent: { action: "show_text", contents: [""] }
			});
		} else if (/<#(\d{17,19})>/.test(part)) {
			const channel = message.guild!.channels.cache.find((channel) => channel.id === part.match(/<#(\d{17,19})>/)![1])! as TextChannel;
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
					var last_message_part = part_tellraw[part_tellraw.length - 1];
					if (
						last_message_part.color == "white" &&
						JSON.stringify(last_message_part.hoverEvent) == JSON.stringify({ action: "show_text", contents: [""] })
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
function decimalToHex(d: number, padding?: number | null) {
	var hex = Number(d).toString(16);
	padding = typeof padding === "undefined" || padding === null ? (padding = 2) : padding;

	while (hex.length < padding) {
		hex = "0" + hex;
	}

	return hex.toUpperCase();
}
function validURL(str: string) {
	const urlRegex =
		"^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d\\{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$";
	const url = new RegExp(urlRegex, "i");
	return url.test(str.replace(/(<|>)/g, ""));
}

client.login(TOKEN);
