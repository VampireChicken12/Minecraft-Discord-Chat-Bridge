import { ServerTypes } from "../typings";

export default function getInfoLength(server_type: ServerTypes) {
	return {
		...{
			chat_regex: ["purpur", "spigot"].includes(server_type)
				? /\[\d{2}:\d{2}:\d{2}\] \[Async Chat Thread - #\d.*\/INFO\]: /i
				: /\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: /i
		},
		...(server_type === "forge"
			? {
					chat_regex:
						/\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: /i,
					info_regex:
						/\[\d{2}\w{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3}\] \[Server thread\/INFO\] \[net.minecraft.server.dedicated.DedicatedServer\/]: /i,
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
					join_regex:
						/\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* joined the game)/i,
					leave_regex:
						/\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* left the game)/i,
					goal_regex:
						/\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has reached the goal \[.*\])/i,
					challenge_regex:
						/\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has completed the challenge \[.*\])/i,
					advancement_regex:
						/\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.* has made the advancement \[.*\])/i
			  })
	};
}
