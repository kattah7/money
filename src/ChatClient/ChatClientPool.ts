import { ChatClient } from '@twurple/chat';
import { Pool } from './Pool.js';
import { RoundRobin } from '../Utils/RoundRobin.js';
import { EventBinder } from '@d-fischer/typed-event-emitter';
import { ChatClientForwarder } from './ChatClientForwarder.js';

export type ClientFactory = () => ChatClient;

// import {randomUUID} from "crypto";
// const idProvider = () => randomUUID();

let id = 0;
const idProvider = () => 'pool-' + ++id;

export class ChatClientPool extends ChatClientForwarder {
	pools: Map<string, Pool> = new Map();
	public bans: number = 0;
	public failedJoins: number = 0;
	private roundRobin = new RoundRobin();

	/**
	 * Invoked when the pool is ready and all initial pools have been set up.
	 */
	public readonly onReady: EventBinder<[]> = this.registerEvent();

	/**
	 * Map of all channels with their assigned pool id.
	 */
	public readonly channelPoolMap: Map<string, string> = new Map();

	constructor(private readonly maxPoolSize: number, private readonly initialPoolSize: number, private readonly clientFactory: ClientFactory) {
		super();

		const setup = async () => {
			for (let i = 0; i < initialPoolSize; i++) {
				await this.setupNewPool();
			}
			this.emit(this.onReady);
		};
		void setup();
	}

	async joinAll(channels: string[]): Promise<void> {
		for (let channel of channels) {
			this.join(channel);
			await new Promise((r) => setTimeout(r, 8));
		}
	}

	async part(channel: string): Promise<void> {
		const poolId = this.channelPoolMap.get('#' + channel);
		if (poolId) {
			const pool = this.pools.get(poolId);
			if (pool && pool.chatClient) {
				pool.chatClient.part(channel);
			}
		}
	}

	async join(channel: string): Promise<void> {
		if (this.pools.size === 0) {
			await this.setupNewPool(channel);
			return;
		}

		const selectedId = this.roundRobin.get();
		//Logger.info(selectedId ? `Picked pool ${selectedId} for ${channel}` : `Creating new pool for ${channel}`);
		const pool = this.pools.get(selectedId) as any;

		if (selectedId === null || !this.pools.has(selectedId) || pool.getFillLevel() >= this.maxPoolSize) {
			if (selectedId && pool.getFillLevel() >= this.maxPoolSize) {
				Bot.Logger.Log(`Pool ${selectedId} reached maxPoolSize of ${this.maxPoolSize}`);
			}
			// this.initialPoolSize minus 1 so we can create a new one manually with the channel in.
			for (let i = 0; i < this.initialPoolSize - 1; i++) {
				await this.setupNewPool();
			}
			await this.setupNewPool(channel);
			return;
		}

		try {
			await pool.chatClient.join(channel);
		} catch (err) {
			if (err) {
				if (err === 'msg_banned') {
					this.bans++;
					const c = channel.replace('#', '');
					Bot.Redis.set(`banned:${c}`, '1').then(() => {
						Bot.Logger.Warn(`Got banned in channel ${c}, added to redis`);
					});
					this.channelPoolMap.delete(channel);
				} else {
					this.failedJoins++;
				}
			}
		}
	}

	private async setupNewPool(channel?: string) {
		const [id, pool] = this.createNewPool();
		const client = this.clientFactory();
		this.attachEvents(client);

		client.onDisconnect(() => {
			Bot.Logger.Error(new Error(`Client ${id} disconnected, cleaning up channelPoolMap..`));

			this.channelPoolMap.forEach((poolId, channel, map) => {
				if (poolId === id) {
					this.channelPoolMap.delete(channel);
				}
			});
		});

		client.onJoin((channel) => {
			this.channelPoolMap.set(channel, id);

			if (Bot.Config.DEBUG) {
				Bot.Logger.Log(`Joined ${channel} with pool ${id}`);
			}
		});

		client.onPart((channel) => {
			const c = channel.replace('#', '');

			Bot.Redis.set(`banned:${c}`, '1').then(() => {
				Bot.Logger.Warn(`Got banned in channel ${c}, added to redis`);
			});
			this.channelPoolMap.delete(channel);
		});

		client.onJoinFailure((channel) => {
			this.channelPoolMap.delete(channel);
		});

		if (channel) {
			client.onRegister(async () => {
				try {
					await client.join(channel);
				} catch (err) {
					Bot.Logger.Error(err as Error);
				}
			});
		}

		if (channel) {
			client.onRegister(async () => {
				await client.join(channel);
			});
		}

		await pool.setChatClient(client);
	}

	private createNewPool(): [string, Pool] {
		const id = idProvider();
		const pool = new Pool(id);

		Bot.Logger.Log(`Created pool ${id}`);

		this.pools.set(id, pool);

		pool.onFillLevelChange((fillLevel) => {
			if (fillLevel >= this.maxPoolSize) {
				this.roundRobin.remove(id);
			} else {
				this.roundRobin.add(id);
			}
		});

		this.roundRobin.add(id);
		return [id, pool];
	}

	get poolSize(): number {
		return this.pools.size;
	}
}
