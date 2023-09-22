import { Config } from './types';

declare global {
	var Bot: {
		Config: Config;
		// SQL: import('../DB/Postgres').Postgres;
		Redis: import('../DB/Redis').Redis;
		Logger: import('../Utils/Logger').Logger;
		Utils: import('../Utils/Utility').Utils;
		// Bans: import('../Handler/BansHandler').Bans;
		// WS: import('../Handler/WSHandler').SocketServerBans;
		Twitch: import('../ChatClient/TwitchClient').TwitchClient;
	};
}

export {};
