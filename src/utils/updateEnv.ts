import { readFile, writeFile } from "fs/promises";

import { logger } from "..";
import { type ENV, updateConfig } from "../config";

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
			.filter(Boolean)
			.map((envLine) => envLine.split("#"))
			.filter(([keyValuePart]) => keyValuePart !== undefined)
			.map(([keyValuePart, comment]) => [
				(keyValuePart as string).split("="),
				comment ? `#${comment}` : ""
			])
	);

	if (Object.prototype.hasOwnProperty.call(parsedEnvVars, env_key)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		parsedEnvVars[env_key]![0] = env_value;
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
