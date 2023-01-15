import { readFile, writeFile } from "fs/promises";

import { logger } from "..";
import { ENV, updateConfig } from "../config";

export default async function updateEnv(
	env_key: keyof ENV,
	env_value: ENV[keyof ENV]
) {
	const fileName = "./.env";
	const file = (await readFile(fileName)).toString();
	const parsedEnvVars: {
		[k in keyof ENV]?: [ENV[keyof ENV], string];
	} = Object.fromEntries(
		file
			.split("\n")
			.map((envLine) => envLine.split("#"))
			.map(([keyValuePart, comment]) => [
				keyValuePart.split("="),
				comment ? `#${comment}` : ""
			])
			.map(([[key, value], comment]: [[string, string], string]) => [
				key,
				["true", "false"].includes(value)
					? [JSON.parse(value), comment]
					: [value, comment]
			])
	);

	if (Object.prototype.hasOwnProperty.call(parsedEnvVars, env_key)) {
		parsedEnvVars[env_key][0] = env_value;
	} else {
		parsedEnvVars[env_key] = [env_value, ""];
	}

	await writeFile(
		fileName,
		Array.from(Object.entries(parsedEnvVars))
			.map(
				([key, [value, comment]]: [string, [string, string]]) =>
					`${key}=${value}${comment}`
			)
			.join("\n")
	);

	logger.log("Written to " + fileName);
	updateConfig(
		Object.fromEntries(
			Array.from(Object.entries(parsedEnvVars)).map(([key, [value]]) => [
				key,
				value
			])
		) as unknown as ENV
	);
}
