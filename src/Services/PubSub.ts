import WS from 'ws';
import crypto from 'crypto';
import RWS from 'reconnecting-websocket';
import { handleWSMsg } from '../Handler/PubSubHandler.js';

interface Options {
	WebSocket: typeof WS;
	connectionTimeout: number;
}

interface topics {
	channel: { id: string };
	sub: string;
	nonce: string;
}

interface connection {
	ws: RWS;
	topics: topics[];
}

interface msg {
	type: string;
	data: {
		action?: string;
		channel_id?: string;
		target_id?: string;
		reason?: string;
		user_is_restricted?: boolean;
		ChannelID?: string;
	};
}

export let topics: topics[] = [];
export let connections: connection[] = [];
let id: number = 0;

const listen = (channels: [{ id: string }], subs: string[]) => {
	for (const channel of channels) {
		for (const sub of subs) {
			const nonce = crypto.randomBytes(20).toString('hex').slice(-8);
			topics.push({ channel, sub, nonce });
		}
	}
};

export async function init(): Promise<void> {
	listen([{ id: Bot.Config.JOINER.user_id }], ['chatrooms-user-v1']);
	const splitTopics = Bot.Utils.splitArray(topics, 100);
	for (const topic of splitTopics) {
		try {
			const ws: RWS = new RWS(`wss://pubsub-edge.twitch.tv/v1`, [], {
				WebSocket: WS,
				connectionTimeout: 5000,
			} as Options);

			connections.push({ ws, topics });
			connect(ws, topic, id++);
			await Bot.Utils.sleep(1000);
		} catch (err) {
			console.log(err);
		}
	}
}

const connect = (ws: any, topics: topics[], id: number) => {
	ws.addEventListener('error', (e: string) => {
		console.log(e);
	});

	ws.addEventListener('close', () => {
		Bot.Logger.Warn(`[${id}] PubSub Disconnected`);
	});

	ws.addEventListener('open', () => {
		Bot.Logger.Log(`[${id}] PubSub Connected`);
		for (const topic of topics) {
			const msg = {
				data: {
					auth_token: Bot.Config.JOINER.pubsub_token,
					topics: [`${topic.sub}.${topic.channel.id}`],
				},
				nonce: topic.nonce,
				type: 'LISTEN',
			};

			ws.send(JSON.stringify(msg));
		}
	});

	ws.addEventListener('message', ({ data }: any) => {
		const msg = JSON.parse(data);
		let msgData: msg;

		switch (msg.type) {
			case 'PONG':
				Bot.Logger.Log(`[${id}] PubSub PONG`);
				break;
			case 'RESPONSE':
				if (msg.error) {
					Bot.Logger.Error(new Error(`[${id}] PubSub Error`), msg.error);
				}
				break;
			case 'MESSAGE':
				if (!msg.data) return Bot.Logger.Warn(`[${id}] PubSub No Data`, msg);
				msgData = JSON.parse(msg.data.message);
				handleWSMsg({ ...msgData });
				break;
			case 'RECONNECT':
				Bot.Logger.Warn(`[${id}] PubSub Reconnect`);
				ws.reconnect();
				break;
			default:
				Bot.Logger.Warn(`[${id}] PubSub Unknown Message`, msg);
				break;
		}
	});

	setInterval(() => {
		ws.send(
			JSON.stringify({
				type: 'PING',
			}),
		);
	}, 250 * 1000);

	ws.reconnect();
};
