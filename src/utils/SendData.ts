import { type APIEmbed, Client, EmbedBuilder, Webhook } from "discord.js";

import { logger } from "..";
import config from "../config";
import GetPlayerIcon from "./GetPlayerIcon";

const { messageType } = config;
export default async function SendData({
	webhook,
	FilteredData,
	client
}: {
	webhook: Webhook;
	FilteredData: string;
	client: Client;
}) {
	logger.log(`Trying to send data: ${FilteredData}`);

	if (FilteredData.includes("<")) {
		const [username] = FilteredData.replace(/<|>/g, "").split(" ");
		if (messageType === "embed") {
			const embed = new EmbedBuilder()
				.setThumbnail(await GetPlayerIcon(username))
				.setAuthor({ name: username ?? "No Username" })
				.setDescription(FilteredData.slice((username ?? "").length + 2))
				.toJSON();
			webhook.send({
				embeds: [embed] as APIEmbed[],
				username: username,
				avatarURL: client.user?.avatarURL() ?? undefined
			});
		} else {
			webhook.send({
				content: FilteredData.slice((username ?? "").length + 2),
				username: username,
				avatarURL: await GetPlayerIcon(username)
			});
		}
	} else {
		if (messageType === "embed") {
			const embed = new EmbedBuilder()
				.setAuthor({ name: "Server" })
				.setThumbnail(client.user?.avatarURL() ?? null)
				.setDescription(FilteredData)
				.toJSON();
			webhook.send({
				embeds: [embed] as APIEmbed[],
				username: "Server",
				avatarURL: client.user?.avatarURL() ?? undefined
			});
		} else {
			webhook.send({
				content: FilteredData,
				username: "Server",
				avatarURL: client.user?.avatarURL() ?? undefined
			});
		}
	}
}
