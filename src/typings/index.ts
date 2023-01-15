export type SplitMethod = "separate" | "beginning" | "behind";
export type MessageTypes = "embed" | "text";
export type ServerTypes = "paper" | "spigot" | "vanilla" | "purpur" | "forge";

export type HexColor = `#${string}`;

export type MinecraftColors =
	| "black"
	| "dark_blue"
	| "dark_green"
	| "dark_aqua"
	| "dark_red"
	| "dark_purple"
	| "gold"
	| "gray"
	| "dark_gray"
	| "blue"
	| "green"
	| "aqua"
	| "red"
	| "light_purple"
	| "yellow"
	| "white"
	| "reset";

export type Color = MinecraftColors | HexColor;

export type HoverEventActions = "show_text" | "show_item" | "show_entity";
export type ClickEventActions =
	| "run_command"
	| "suggest_command"
	| "open_url"
	| "open_item"
	| "copy_to_clipboard";
export interface StandardPart {
	text: string;
	color: Color;
	hoverEvent: {
		action: HoverEventActions;
		contents: string[];
	};
}

export interface ClickPart extends StandardPart {
	clickEvent: {
		action: ClickEventActions;
		value: string;
	};
}

export type Part = ClickPart | StandardPart;
