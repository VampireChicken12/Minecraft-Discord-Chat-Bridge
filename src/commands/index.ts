import { logUnmatchedCommand } from "./logUnmatched";
import { setChannelCommand } from "./setChatChannel";
import { setUnmatchedLogChannelCommand } from "./setUnmatchedLogChannel";
export const allCommands = [
	setChannelCommand,
	setUnmatchedLogChannelCommand,
	logUnmatchedCommand
];
