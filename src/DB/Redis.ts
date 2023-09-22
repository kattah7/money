import { createClient, RedisClientType } from 'redis';

export class Redis {
	private _client: RedisClientType;
	private namespace: string = `JOINER:`;

	constructor(url: string) {
		this._client = createClient({ url });
		this._client.connect().then(() => Bot.Logger.Log('Connected to redis.'));
		this._client.on('error', (err: Error) => {
			Bot.Logger.Error(new Error(`Redis error: ${err}`));

			process.exit(0);
		});
	}

	static New(url: string): Redis {
		return new Redis(url);
	}

	public async get(key: string) {
		const value = await this._client.get(this.namespace + key);
		return value !== null ? JSON.parse(value) : null;
	}

	public async set(key: string, value: {}) {
		return await this._client.set(this.namespace + key, JSON.stringify(value));
	}

	public async tempSet(key: string, value: {}, expires_in: number) {
		return await this._client.setEx(this.namespace + key, expires_in, JSON.stringify(value));
	}

	public async getAll(pattern: string) {
		return await this._client.keys(pattern);
	}

	public get client(): RedisClientType {
		return this._client;
	}
}
