import fetch from "node-fetch";
export default async function GetPlayerIcon(
	Username: string | undefined
): Promise<string> {
	if (!Username)
		return "https://crafthead.net/avatar/6a6e65e5-76dd-4c3c-a625-162924514568";
	return await new Promise((resolve) => {
		fetch(`https://api.mojang.com/users/profiles/minecraft/${Username}`, {
			method: "Get"
		})
			.then((res) => res.json())
			.then(async (json) => {
				resolve(`https://crafthead.net/avatar/${json.id}`);
			})
			.catch(() => {
				resolve(
					"https://crafthead.net/avatar/6a6e65e5-76dd-4c3c-a625-162924514568"
				);
			});
	});
}
