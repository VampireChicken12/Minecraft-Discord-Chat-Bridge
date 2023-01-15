import { TextChannel } from "discord.js";

import {
	InfoLengthRegExps,
	logger,
	ptyProcess,
	ServerStopped as Stopped
} from "..";
import config from "../config";
import { regexes } from "../death_message_regex";
import { Event } from "../structures";
import SendData from "../utils/SendData";

const { gameChatChannelId, logUnmatchedMessages, unmatchedLogChannelId } =
	config;
export const readyEvent = new Event({
	name: "ready",
	handler: async (client) => {
		logger.log(`Logged in as ${client.user.tag}!`);
		let ServerStopped = Stopped;
		const gameChannelExists = client.channels.cache.has(gameChatChannelId);
		if (gameChannelExists) {
			const gameChatChannel = client.channels.cache.find(
				(channel) => channel.id === gameChatChannelId
			) as TextChannel;
			const unMatchedLogChannel = client.channels.cache.has(
				unmatchedLogChannelId
			)
				? (client.channels.cache.find(
						(channel) => channel.id === unmatchedLogChannelId
				  ) as TextChannel)
				: undefined;
			const gameChatChannelWebhooks = await gameChatChannel?.fetchWebhooks();
			if (gameChatChannel && gameChatChannelWebhooks.size === 0) {
				gameChatChannel.createWebhook({
					name: "Minecraft Chat Webhook",
					avatar: client.user.displayAvatarURL({ size: 2048 })
				});
			}
			const unMatchedLogChannelWebhooks =
				await unMatchedLogChannel?.fetchWebhooks();
			if (unMatchedLogChannel && unMatchedLogChannelWebhooks?.size === 0) {
				unMatchedLogChannel.createWebhook({
					name: "Minecraft Unmatched Log Webhook",
					avatar: client.user.displayAvatarURL({ size: 2048 })
				});
			}
			const unMatchedLogChannelWebhook = unMatchedLogChannelWebhooks?.find(
				(webhook) => webhook.name === "Minecraft Unmatched Log Webhook"
			);
			const gameChatChannelWebhook = gameChatChannelWebhooks.find(
				(webhook) => webhook.name === "Minecraft Chat Webhook"
			);
			if (gameChatChannelWebhook) {
				ptyProcess.on("data", (data) => {
					logger.log(`Data from log: ${data}`);
					let FilteredData = data.toString();
					const DataType = InfoLengthRegExps.chat_regex.test(FilteredData)
						? "chat"
						: InfoLengthRegExps.info_regex.test(FilteredData)
						? "info"
						: null;
					if (DataType === null) {
						return;
					}
					const DataInfoLength =
						(DataType === "chat"
							? FilteredData.match(InfoLengthRegExps.chat_regex)?.[0]?.length
							: FilteredData.match(InfoLengthRegExps.info_regex)?.[0]
									?.length) ?? 0;

					if (
						FilteredData.slice(DataInfoLength).charAt(0) == "<" &&
						FilteredData.includes(">")
					) {
						FilteredData = FilteredData.split("\n").join(" ");
						FilteredData = FilteredData.slice(DataInfoLength);
						FilteredData = /^<\[.*\]/.test(FilteredData)
							? FilteredData.replace(
									FilteredData.match(/^<(\[.*\])/)?.[1] + " " ?? "",
									""
							  )
							: FilteredData;

						SendData({ webhook: gameChatChannelWebhook, client, FilteredData });
						return;
					}
					if (
						InfoLengthRegExps.join_regex.test(FilteredData) &&
						!FilteredData.includes("tellraw")
					) {
						FilteredData = FilteredData.split("\n").join(" ");
						FilteredData =
							FilteredData.match(InfoLengthRegExps.join_regex)?.[1] ??
							FilteredData;
						SendData({ webhook: gameChatChannelWebhook, client, FilteredData });
						return;
					}

					if (
						InfoLengthRegExps.leave_regex.test(FilteredData) &&
						!FilteredData.includes("tellraw")
					) {
						FilteredData = FilteredData.split("\n").join(" ");
						FilteredData =
							FilteredData.match(InfoLengthRegExps.leave_regex)?.[1] ??
							FilteredData;
						SendData({ webhook: gameChatChannelWebhook, client, FilteredData });
						return;
					}
					if (
						FilteredData.includes("Starting minecraft server") &&
						!FilteredData.includes("<") &&
						!FilteredData.includes("tellraw")
					) {
						ServerStopped = false;
						SendData({
							webhook: gameChatChannelWebhook,
							client,
							FilteredData: "The server is starting"
						});
						return;
					}
					if (
						FilteredData.includes("Stopping the server") &&
						!FilteredData.includes("<") &&
						!FilteredData.includes("tellraw")
					) {
						ServerStopped = true;
						SendData({
							webhook: gameChatChannelWebhook,
							client,
							FilteredData: "The server is stopping"
						});
						return;
					}
					if (
						InfoLengthRegExps.goal_regex.test(FilteredData) &&
						!FilteredData.includes("<") &&
						!FilteredData.includes("tellraw")
					) {
						SendData({
							client,
							webhook: gameChatChannelWebhook,
							FilteredData:
								"<" +
								FilteredData.match(InfoLengthRegExps.goal_regex)?.[1]
									?.replace("[", "**")
									.replace("]", "**")
						});
						return;
					}
					if (
						InfoLengthRegExps.challenge_regex.test(FilteredData) &&
						!FilteredData.includes("<") &&
						!FilteredData.includes("tellraw")
					) {
						SendData({
							client,
							webhook: gameChatChannelWebhook,
							FilteredData:
								"<" +
								FilteredData.match(InfoLengthRegExps.challenge_regex)?.[1]
									?.replace("[", "**")
									.replace("]", "**")
						});
						return;
					}
					if (
						InfoLengthRegExps.advancement_regex.test(FilteredData) &&
						!FilteredData.includes("<") &&
						!FilteredData.includes("tellraw")
					) {
						SendData({
							client,
							webhook: gameChatChannelWebhook,
							FilteredData:
								"<" +
								FilteredData.match(InfoLengthRegExps.advancement_regex)?.[1]
									?.replace("[", "**")
									.replace("]", "**")
						});
						return;
					}
					for (const regex of regexes) {
						if (regex.test(FilteredData)) {
							FilteredData = FilteredData.split("\r\n").join("");
							SendData({
								client,
								webhook: gameChatChannelWebhook,
								FilteredData:
									"<" +
									FilteredData.match(regex)?.[2] +
									"> " +
									FilteredData.match(regex)?.[3]
							});
							break;
						}
					}
					// If we get here, it was probably an unhandled death message
					if (
						InfoLengthRegExps.info_regex.test(FilteredData) &&
						logUnmatchedMessages === "true" &&
						unMatchedLogChannelWebhook !== undefined
					) {
						FilteredData = FilteredData.split("\r\n").join("");
						FilteredData = FilteredData.slice(DataInfoLength);
						SendData({
							client,
							webhook: unMatchedLogChannelWebhook,
							FilteredData
						});
					}
					if (
						ServerStopped &&
						FilteredData.includes("All dimensions are saved")
					) {
						setTimeout(() => process.exit(), 2000);
					}
				});
			}
		} else {
			throw Error("Invalid Game Chat Channel ID provided");
		}
	}
});
