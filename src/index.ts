import { Client, IntentsBitField, TextChannel, Webhook } from "discord.js";
import dotenv from "dotenv";
import { readFileSync, writeFile } from "fs";
import jimp from "jimp";
import fetch from "node-fetch";
import { spawn } from "node-pty-prebuilt-multiarch";
import { Rcon } from "rcon-client";

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
	]
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

if (!["paper", "spigot", "vanilla", "purpur"].includes(SERVER_TYPE)) {
	logger.error(`Environment variable SERVER_TYPE's value is invalid. Valid values are 'paper' , 'spigot' ,'vanilla'`);
	process.exit();
}

function getInfoLength(server_type: ServerTypes) {
	switch (server_type) {
		case "spigot": {
			return {
				chat_regex: /\[\d{2}:\d{2}:\d{2}\] \[Async Chat Thread - #\d.*\/INFO\]: /i,
				info_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i,
				join_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* joined the game)/i,
				leave_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* left the game)/i,
				goal_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has reached the goal \[.*\])/i,
				challenge_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has completed the challenge \[.*\])/i,
				advancement_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has made the advancement \[.*\])/i
			};
		}
		case "vanilla": {
			return {
				chat_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i,
				info_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i,
				join_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* joined the game)/i,
				leave_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* left the game)/i,
				goal_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has reached the goal \[.*\])/i,
				challenge_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has completed the challenge \[.*\])/i,
				advancement_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has made the advancement \[.*\])/i
			};
		}
		case "paper": {
			return {
				chat_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i,
				info_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i,
				join_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* joined the game)/i,
				leave_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* left the game)/i,
				goal_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has reached the goal \[.*\])/i,
				challenge_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has completed the challenge \[.*\])/i,
				advancement_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has made the advancement \[.*\])/i
			};
		}
		case "purpur": {
			return {
				chat_regex: /\[\d{2}:\d{2}:\d{2}\] \[Async Chat Thread - #\d.*\/INFO\]: /i,
				info_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i,
				join_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* joined the game)/i,
				leave_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* left the game)/i,
				goal_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has reached the goal \[.*\])/i,
				challenge_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has completed the challenge \[.*\])/i,
				advancement_regex: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has made the advancement \[.*\])/i
			};
		}
	}
}
type ServerTypes = "paper" | "spigot" | "vanilla" | "purpur";
const InfoLengthRegexes = getInfoLength(SERVER_TYPE);
const shell = process.platform === "win32" ? "powershell.exe" : "bash";

const ptyProcess = spawn(shell, [], {
	name: "xterm-color",
	cols: 100,
	rows: 40,
	cwd: process.cwd()
});
ptyProcess.write(`${START_COMMAND}\r`);

client.on("ready", async (client) => {
	logger.info(`Logged in as ${client.user.tag}`);
	const gameChannelExists = client.channels.cache.has(GAME_CHAT_CHANNEL);
	if (gameChannelExists) {
		const gameChannel = client.channels.cache.find((channel) => channel.id === GAME_CHAT_CHANNEL)! as TextChannel;

		const webhooks = await gameChannel.fetchWebhooks();
		if (webhooks.size === 0) {
			gameChannel.createWebhook({ name: "Minecraft Chat Webhook", avatar: client.user.displayAvatarURL({ size: 2048 }) });
		}
		const webhook = webhooks.find((webhook) => webhook.name === "Minecraft Chat Webhook");
		if (webhook) {
			const rcon = await Rcon.connect({ host: RCON_HOST, password: RCON_PASSWORD });
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
										return console.log(err);
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

				var UserName = message.author.username;

				if (message.member!.nickname) UserName = message.member!.nickname;

				const tellraw_parts = [
					JSON.parse(
						`{"text":"[${UserName}] ", "color":  "#${decimalToHex(
							message.member!.roles.highest.color
						)}","hoverEvent":{"action":"show_text","contents":["${message.author.username}#${message.author.discriminator}\\nID: ${
							message.author.id
						}"]}}`
					)
				];

				splitAndKeep(message.content, " ").map((part) => {
					if (
						(part.trim().includes("<@!") && part.trim().includes(">")) ||
						(part.trim().includes("<@") && !part.trim().includes("<@&") && part.trim().includes(">"))
					) {
						const member = message.mentions.members!.get(part.trim().replace("<@!", "").replace(">", "").replace("<@", ""))!;

						tellraw_parts.push({
							text: "[" + (member.nickname !== null ? member.nickname : member.user.username) + "]",
							color: "#" + decimalToHex(member.roles.highest.color),
							hoverEvent: { action: "show_text", contents: [`${member.user.username}#${member.user.discriminator}\nID: ${member.user.id}`] }
						});
					} else if (part.trim().includes("<@&") && part.trim().includes(">")) {
						const role = message.mentions.roles.find((role) => role.id === part.replace("<@&", "").replace(">", ""))!;
						tellraw_parts.push({
							text: "(" + role.name + ")",
							color: "#" + decimalToHex(role.color),
							hoverEvent: { action: "show_text", contents: [""] }
						});
					} else if (part.trim().includes("<#") && part.trim().includes(">")) {
						const channel = message.mentions.channels.find((channel) => channel.id === part.replace("<#", "").replace(">", ""))! as TextChannel;
						tellraw_parts.push({
							text: channel.name,
							color: "green",
							hoverEvent: { action: "show_text", contents: ["Click me to open channel in discord"] },
							clickEvent: { action: "open_url", value: `https://discord.com/channels/${channel.guildId}/${channel.id}` }
						});
					} else {
						if (validURL(part)) {
							tellraw_parts.push({
								text: part,
								color: "blue",
								hoverEvent: { action: "show_text", contents: [""] },
								clickEvent: { action: "open_url", value: part }
							});
						} else {
							tellraw_parts.push({ text: part, color: "white", hoverEvent: { action: "show_text", contents: [""] } });
						}
					}
				});
				await rcon.send(`tellraw @a ${JSON.stringify(tellraw_parts)}`);
			});
			ptyProcess.on("data", function (data) {
				var FilteredData = data.toString();
				const DataType = InfoLengthRegexes.chat_regex.test(FilteredData) ? "chat" : InfoLengthRegexes.info_regex.test(FilteredData) ? "info" : null;
				if (DataType === null) {
					return;
				}
				const DataInfoLength =
					(DataType === "chat"
						? FilteredData.match(InfoLengthRegexes.chat_regex)?.[0]!.length
						: FilteredData.match(InfoLengthRegexes.info_regex)?.[0]!.length) ?? 0;

				if (FilteredData.slice(DataInfoLength).charAt(0) == "<" && FilteredData.includes(">")) {
					FilteredData = FilteredData.split("\n").join(" ");
					FilteredData = FilteredData.slice(DataInfoLength);

					SendData(webhook, FilteredData);
					return;
				}
				if (InfoLengthRegexes.join_regex.test(FilteredData) && !FilteredData.includes("tellraw")) {
					FilteredData = FilteredData.split("\n").join(" ");
					FilteredData = FilteredData.match(InfoLengthRegexes.join_regex)?.[1] ?? FilteredData;
					SendData(webhook, FilteredData);
					return;
				}

				if (InfoLengthRegexes.leave_regex.test(FilteredData) && !FilteredData.includes("tellraw")) {
					FilteredData = FilteredData.split("\n").join(" ");
					FilteredData = FilteredData.match(InfoLengthRegexes.leave_regex)?.[1] ?? FilteredData;
					SendData(webhook, FilteredData);
					return;
				}

				if (FilteredData.includes("Stopping the server") && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					ServerStopped = true;
					SendData(webhook, "The server is stopping");
					return;
				}
				if (InfoLengthRegexes.goal_regex.test(FilteredData) && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					SendData(webhook, "<" + FilteredData.match(InfoLengthRegexes.goal_regex)![1]!.replace("[", "**").replace("]", "**"));
					return;
				}
				if (InfoLengthRegexes.challenge_regex.test(FilteredData) && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					SendData(webhook, "<" + FilteredData.match(InfoLengthRegexes.challenge_regex)![1]!.replace("[", "**").replace("]", "**"));
					return;
				}
				if (InfoLengthRegexes.advancement_regex.test(FilteredData) && !FilteredData.includes("<") && !FilteredData.includes("tellraw")) {
					SendData(webhook, "<" + FilteredData.match(InfoLengthRegexes.advancement_regex)![1]!.replace("[", "**").replace("]", "**"));
					return;
				}
				for (const regex of regexes) {
					if (regex.test(FilteredData)) {
						FilteredData = FilteredData.split("\r\n").join("");
						SendData(webhook, "<" + FilteredData.match(regex)![2] + "> " + FilteredData.match(regex)![3]);
						break;
					}
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

async function SendData(webhook: Webhook, FilteredData: string) {
	if (FilteredData.includes("<")) {
		let username = FilteredData.split(" ")[0]!.slice(1, -1);

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
			console.log(err);
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
type SplitMethod = "seperate" | "infront" | "behind";
function splitAndKeep(str: string, separator: string, method: SplitMethod = "seperate") {
	let result: string[] = [];
	if (method == "seperate") {
		result = str.split(new RegExp(`(${separator})`, "g"));
	} else if (method == "infront") {
		result = str.split(new RegExp(`(?=${separator})`, "g"));
	} else if (method == "behind") {
		result = str.split(new RegExp(`(.*?${separator})`, "g"));
		result = result.filter(function (el) {
			return el !== "";
		});
	}
	return result;
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
