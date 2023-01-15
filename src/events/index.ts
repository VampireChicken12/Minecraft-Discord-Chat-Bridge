import { Event } from "../structures";
import { interactionCreateEvent } from "./interactionCreate";
import { messageCreateEvent } from "./messageCreate";
import { messageUpdateEvent } from "./messageUpdate";
import { readyEvent } from "./ready";

export const allEvents: Event<any>[] = [
	readyEvent,
	messageCreateEvent,
	messageUpdateEvent,
	interactionCreateEvent
];
