export default function decimalToHex(d: number, padding?: number | null) {
	let hex = Number(d).toString(16);
	padding =
		typeof padding === "undefined" || padding === null
			? (padding = 2)
			: padding;

	while (hex.length < padding) {
		hex = "0" + hex;
	}

	return hex.toUpperCase();
}
