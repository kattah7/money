import { ChatClient } from '@twurple/chat';
import { ChatClientForwarder } from './ChatClientForwarder.js';
import { EventBinder } from '@d-fischer/typed-event-emitter';

export class Pool extends ChatClientForwarder {
	private _chatClient: ChatClient | null = null;
	private fillSize: number = 0;

	public readonly onFillLevelChange: EventBinder<[fillLevel: number]> = this.registerEvent();

	constructor(private readonly id: string) {
		super();
	}

	get chatClient(): ChatClient | null {
		return this._chatClient;
	}

	getFillLevel(): number {
		return this.fillSize;
	}

	async setChatClient(chatClient: ChatClient): Promise<void> {
		this._chatClient = chatClient;
		this._chatClient.onJoin(() => {
			this.fillSize++;
			this.emit(this.onFillLevelChange, this.fillSize);
		});
		this._chatClient.onPart(() => {
			this.fillSize--;
			this.emit(this.onFillLevelChange, this.fillSize);
		});
		this._chatClient.onDisconnect(() => {
			this.fillSize = 0;
			this.emit(this.onFillLevelChange, this.fillSize);
		});
		await this._chatClient.connect();
	}
}
