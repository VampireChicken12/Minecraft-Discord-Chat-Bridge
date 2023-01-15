declare module "@hapi/bourne" {
	function parse(text: string, ...args: any[]): object;
	function scan(obj: any, options: object): void;
	function safeParse(text: string, reviver: any): object;
}
