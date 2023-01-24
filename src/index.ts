import { REST } from "@discordjs/rest";
import { spawn } from "node-pty-prebuilt-multiarch";
import { Rcon } from "rcon-client";

import Bot from "./Bot";
import config from "./config";
import Logger from "./logger";
import { getInfoLength } from "./utils";
import deployCommands from "./utils/deployCommands";

export const logger = new Logger();
export const apiVersion = "10";
const {
	token,
	startCommand,
	serverType,
	rcon: { host, password }
} = config;
export const discordRest = new REST({ version: apiVersion }).setToken(token);
export const bot = new Bot();
export const ServerStopped = false;

export const InfoLengthRegExps = getInfoLength(serverType);
const shell = process.platform === "win32" ? "powershell.exe" : "bash";

export const ptyProcess = spawn(shell, [], {
	name: "xterm-color",
	cols: 100,
	rows: 40,
	cwd: process.cwd()
});
logger.log(`Starting ${shell} with command: ${startCommand}`);
ptyProcess.write(`${startCommand}\r`);
export let rcon: Rcon;
(async () => {
	rcon = await Rcon.connect({
		host,
		password
	});
	await bot.client.login(token);
	if (config.deployCommands) {
		setTimeout(async () => {
			await deployCommands();
		}, 2000);
	}
})();
process
	.on("unhandledRejection", (reason, p) => {
		logger.error("Unhandled Rejection at: Promise ", p, " reason: ", reason);
	})
	.on("uncaughtException", (exception) => {
		logger.error("Uncaught Exception ", exception);
	});
process.on("SIGTERM", async () => {
	bot.client.destroy();
	process.exit(0);
});
// TODO: fix unmatched log messages
// TODO: fix webhook token issue
