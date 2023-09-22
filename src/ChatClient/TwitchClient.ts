import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ChatClientPool } from './ChatClientPool.js';
import { ApiClient } from '@twurple/api';

export class TwitchClient {
	private static _instance: TwitchClient;
	private static _client: ChatClientPool;
	private static apiClient: ApiClient;

	private constructor() {
		// Private constructor to prevent direct instantiation
	}

	public static async getInstance(): Promise<TwitchClient> {
		if (!TwitchClient._instance) {
			const authProvider = new RefreshingAuthProvider(
				{
					clientId: Bot.Config.JOINER.client_id,
					clientSecret: Bot.Config.JOINER.client_secret,
					onRefresh: async () => Bot.Logger.Log('Token successfully refreshed.'),
				},
				{
					refreshToken: Bot.Config.JOINER.refresh_token,
					expiresIn: 1000,
					obtainmentTimestamp: 0,
				},
			) as RefreshingAuthProvider;

			const createClient = () => new ChatClient({ authProvider, botLevel: 'verified' }) as ChatClient;

			const maxPoolSize = Bot.Config.JOINER.max_pool_size;
			const intPoolCount = Bot.Config.JOINER.int_pool_count;

			TwitchClient._client = new ChatClientPool(maxPoolSize, intPoolCount, createClient) as ChatClientPool;
			TwitchClient.apiClient = new ApiClient({ authProvider }) as ApiClient;
			TwitchClient._instance = new TwitchClient();
		}

		return TwitchClient._instance;
	}

	public getChatClient(): ChatClientPool {
		return TwitchClient._client;
	}

	public getApiClient(): ApiClient {
		return TwitchClient.apiClient;
	}
}
