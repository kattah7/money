type WSMsg = Record<string, any>;

export const handleWSMsg = async (msg: WSMsg = {}): Promise<void> => {
	if (!msg.type) return Bot.Logger.Warn('No type in WS message', JSON.stringify(msg));

	if (msg.type === 'user_moderation_action') {
		if (msg.data.action === 'ban' || msg.data.action === 'timeout') {
			await Bot.Redis.set(`banned:${msg.data.channel_id}`, '1');

			Bot.Logger.Warn(`Got banned in channel ${msg.data.channel_id}, added to redis`);
		}
	}
};
