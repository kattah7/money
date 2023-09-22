export type Config = {
	Alts: string[];
	DEBUG: boolean;
	REDIS: string;
	JOINER: {
		username: string;
		user_id: string;
		client_id: string;
		client_secret: string;
		refresh_token: string;
		viewer_limit: number;
		max_pool_size: number;
		int_pool_count: number;
		pubsub_token: string;
	};
};
