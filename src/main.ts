import fs from 'fs';
import { Logger as Log } from './Utils/Logger.js';
import { Utils } from './Utils/Utility.js';
import { Redis } from './DB/Redis.js';
import { init } from './Services/PubSub.js';
import { TwitchClient } from './ChatClient/TwitchClient.js';
import cron from 'node-cron';

// cron every 12 hours to check if the bot is still running
cron.schedule('0 */12 * * *', () => {
	process.exit(0);
});

(async () => {
	// @ts-ignore
	global.Bot = {};
	// @ts-ignore
	Bot.Utils = Utils.New();
	//@ts-ignore;
	Bot.Logger = Log.New();
	// @ts-ignore
	Bot.Config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	// @ts-ignore
	Bot.Twitch = await TwitchClient.getInstance();
	// @ts-ignore
	Bot.Redis = Redis.New(Bot.Config.REDIS);

	const Client = Bot.Twitch.getChatClient();
	const API = Bot.Twitch.getApiClient();
	const maxViewers = Bot.Config.JOINER.viewer_limit;

	let lastApiFetch = '';
	Client.onReady(async () => {
		const fetchAndJoin = async (cursor?: string): Promise<void> => {
			try {
				const streams = await API.streams.getStreams({
					after: cursor,
					limit: 100,
					type: 'live',
				});

				const streamsToJoin = [];
				for (const stream of streams.data) {
					const redis_id = await Bot.Redis.get(`banned:${stream.userId}`);
					const redis_name = await Bot.Redis.get(`banned:${stream.userName}`);

					if (!Client.channelPoolMap.has(`#${stream.userName}`)) {
						if (stream.viewers < maxViewers) {
							if (redis_id != 1 || redis_name != 1) {
								streamsToJoin.push(stream.userName);
							} else {
								Bot.Logger.Log(
									`Skipping banned stream: ${stream.userName}`,
								);

								await Client.part(stream.userName);
							}
						}
					}
				}

				if (streamsToJoin.length == 0) {
					return fetchAndJoin(streams.cursor);
				}

				lastApiFetch = new Date().toJSON();
				await Client.joinAll(streamsToJoin);
				fetchAndJoin(streams.cursor);
			} catch (err: string | any) {
				Bot.Logger.Error(new Error('Error while fetching streams..'), err);
				await Bot.Utils.sleep(5000);
				fetchAndJoin();
			}
		};

		await init();
		await fetchAndJoin();
	});

	Client.onBan(async (channel, user) => {
		if (Bot.Config.Alts.includes(user)) {
			const c = channel.replace('#', '');
			Bot.Redis.set(`banned:${c}`, '1').then(() => {
				Bot.Logger.Warn(`Got banned in channel ${c}, added to redis`);
			});
			Client.channelPoolMap.delete(channel);
		}
	});

	Client.onTimeout(async (channel, user) => {
		if (Bot.Config.Alts.includes(user)) {
			const c = channel.replace('#', '');
			Bot.Redis.set(`banned:${c}`, '1').then(() => {
				Bot.Logger.Warn(`Got banned in channel ${c}, added to redis`);
			});
			Client.channelPoolMap.delete(channel);
		}
	});
})();

process.on('unhandledRejection', (error) => {
	Bot.Logger.Error(error as Error);
});
