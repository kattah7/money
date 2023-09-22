// import fetch from 'node-fetch';

export class Utils {
	private static _instance: Utils;

	static New(): Utils {
		if (!this._instance) {
			return new Utils();
		}

		return this._instance;
	}

	public splitArray<T>(arr: T[], len: number): T[][] {
		const chunks: T[][] = [];
		let i = 0;
		const n = arr.length;

		while (i < n) {
			chunks.push(arr.slice(i, (i += len)));
		}
		return chunks;
	}

	public sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// public async IVR(id: string, options?: { isUsername: boolean }): Promise<any> {
	// 	options = options || { isUsername: false };
	// 	const url = new URL(`https://api.ivr.fi/v2/twitch/user?${options.isUsername ? 'login=' : 'id='}${id}`);
	// 	try {
	// 		const res = await fetch(url, {
	// 			method: 'GET',
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 				'User-Agent': 'IF YOU SEE THIS VI VON ZULUL',
	// 			},
	// 		}).then((res) => res.json());

	// 		if (!res || res.length === 0) return;
	// 		return res[0];
	// 	} catch (error) {
	// 		Bot.Logger.Error(error as Error);
	// 	}
	// }
}
