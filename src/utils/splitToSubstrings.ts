export default function splitToSubstrings(
	str: string,
	splitCharacter: string,
	length: number
) {
	const splitted = str.split(splitCharacter);
	const result: string[] = [];

	for (const portion of splitted) {
		const last = result.length - 1;
		if (result[last] && (result[last] + portion).length < length) {
			result[last] = result[last] + splitCharacter + portion;
		} else {
			result.push(portion);
		}
	}
	return result;
}
