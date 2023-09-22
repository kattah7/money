import { EventBinder, EventEmitter } from "@d-fischer/typed-event-emitter";
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import {
    ChatBitsBadgeUpgradeInfo,
    ChatClient,
    ChatCommunityPayForwardInfo,
    ChatCommunitySubInfo,
    ChatPrimeCommunityGiftInfo,
    ChatRaidInfo,
    ChatRewardGiftInfo,
    ChatRitualInfo,
    ChatStandardPayForwardInfo,
    ChatSubExtendInfo,
    ChatSubGiftInfo,
    ChatSubGiftUpgradeInfo,
    ChatSubInfo,
    ChatSubUpgradeInfo,
    ClearMsg,
    ClearChat,
    UserNotice,
    Whisper,
} from "@twurple/chat";
import { Message, MessageTypes } from "ircv3";

/**
 * This class basically just exists to forward client events from any client within any pool
 */
export class ChatClientForwarder extends EventEmitter {
    /**
     * Fires when a user is timed out from a channel.
     *
     * @eventListener
     * @param channel The channel the user is timed out from.
     * @param user The timed out user.
     * @param duration The duration of the timeout, in seconds.
     * @param msg The message that was sent with the timeout.
     */
    readonly onTimeout: EventBinder<[channel: string, user: string, duration: number, msg: ClearChat]> = this.registerEvent();

    /**
     * Fires when a user is permanently banned from a channel.
     *
     * @eventListener
     * @param channel The channel the user is banned from.
     * @param user The banned user.
     */
    readonly onBan: EventBinder<[channel: string, user: string, msg: ClearChat]> = this.registerEvent();

    /**
     * Fires when a user upgrades their bits badge in a channel.
     *
     * @eventListener
     * @param channel The channel where the bits badge was upgraded.
     * @param user The user that has upgraded their bits badge.
     * @param ritualInfo Additional information about the upgrade.
     * @param msg The full message object containing all message and user information.
     */
    readonly onBitsBadgeUpgrade: EventBinder<[channel: string, user: string, upgradeInfo: ChatBitsBadgeUpgradeInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when the chat of a channel is cleared.
     *
     * @eventListener
     * @param channel The channel whose chat is cleared.
     * @param msg The full message object containing all message and user information.
     */
    readonly onChatClear: EventBinder<[channel: string, msg: ClearChat]> = this.registerEvent();

    /**
     * Fires when emote-only mode is toggled in a channel.
     *
     * @eventListener
     * @param channel The channel where emote-only mode is being toggled.
     * @param enabled Whether emote-only mode is being enabled. If false, it's being disabled.
     */
    readonly onEmoteOnly: EventBinder<[channel: string, enabled: boolean]> = this.registerEvent();

    /**
     * Fires when followers-only mode is toggled in a channel.
     *
     * @eventListener
     * @param channel The channel where followers-only mode is being toggled.
     * @param enabled Whether followers-only mode is being enabled. If false, it's being disabled.
     * @param delay The time (in minutes) a user needs to follow the channel to be able to talk. Only available when `enabled === true`.
     */
    readonly onFollowersOnly: EventBinder<[channel: string, enabled: boolean, delay?: number]> = this.registerEvent();

    /**
     * Fires when a channel hosts another channel.
     *
     * @eventListener
     * @param channel The hosting channel.
     * @param target The channel that is being hosted.
     * @param viewers The number of viewers in the hosting channel.
     *
     * If you're not logged in as the owner of the channel, this is undefined.
     */
    readonly onHost: EventBinder<[channel: string, target: string, viewers?: number]> = this.registerEvent();

    /**
     * Fires when a channel you're logged in as its owner is being hosted by another channel.
     *
     * @eventListener
     * @param channel The channel that is being hosted.
     * @param byChannel The hosting channel.
     * @param auto Whether the host was triggered automatically (by Twitch's auto-host functionality).
     * @param viewers The number of viewers in the hosting channel.
     */
    readonly onHosted: EventBinder<[channel: string, byChannel: string, auto: boolean, viewers?: number]> = this.registerEvent();

    /**
     * Fires when Twitch tells you the number of hosts you have remaining in the next half hour for the channel
     * for which you're logged in as owner after hosting a channel.
     *
     * @eventListener
     * @param channel The hosting channel.
     * @param numberOfHosts The number of hosts remaining in the next half hour.
     */
    readonly onHostsRemaining: EventBinder<[channel: string, numberOfHosts: number]> = this.registerEvent();

    /**
     * Fires when a user joins a channel.
     *
     * The join/part events are cached by the Twitch chat server and will be batched and sent every 30-60 seconds.
     *
     * Please note that unless you enabled the `requestMembershipEvents` option, this will only react to your own joins.
     *
     * @eventListener
     * @param channel The channel that is being joined.
     * @param user The user that joined.
     */
    readonly onJoin: EventBinder<[channel: string, user: string]> = this.registerEvent();

    /**
     * Fires when you fail to join a channel.
     *
     * @eventListener
     * @param channel The channel that you tried to join.
     * @param reason The reason for the failure.
     */
    readonly onJoinFailure: EventBinder<[channel: string, reason: string]> = this.registerEvent();

    /**
     * Fires when a user leaves ("parts") a channel.
     *
     * The join/part events are cached by the Twitch chat server and will be batched and sent every 30-60 seconds.
     *
     * Please note that unless you enabled the `requestMembershipEvents` option, this will only react to your own parts.
     *
     * @eventListener
     * @param channel The channel that is being left.
     * @param user The user that left.
     */
    readonly onPart: EventBinder<[channel: string, user: string]> = this.registerEvent();

    /**
     * Fires when a single message is removed from a channel.
     *
     * @eventListener
     * @param channel The channel where the message was removed.
     * @param messageId The ID of the message that was removed.
     * @param msg The full message object containing all message and user information.
     *
     * This is *not* the message that was removed. The text of the message is available using `msg.params.message` though.
     */
    readonly onMessageRemove: EventBinder<[channel: string, messageId: string, msg: ClearMsg]> = this.registerEvent();

    /**
     * Fires when R9K mode is toggled in a channel.
     *
     * @eventListener
     * @param channel The channel where R9K mode is being toggled.
     * @param enabled Whether R9K mode is being enabled. If false, it's being disabled.
     */
    readonly onR9k: EventBinder<[channel: string, enabled: boolean]> = this.registerEvent();

    /**
     * Fires when host mode is disabled in a channel.
     *
     * @eventListener
     * @param channel The channel where host mode is being disabled.
     */
    readonly onUnhost: EventBinder<[channel: string]> = this.registerEvent();

    /**
     * Fires when a user raids a channel.
     *
     * @eventListener
     * @param channel The channel that was raided.
     * @param user The user that has raided the channel.
     * @param raidInfo Additional information about the raid.
     * @param msg The full message object containing all message and user information.
     */
    readonly onRaid: EventBinder<[channel: string, user: string, raidInfo: ChatRaidInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user cancels a raid.
     *
     * @eventListener
     * @param channel The channel where the raid was cancelled.
     * @param msg The full message object containing all message and user information.
     */
    readonly onRaidCancel: EventBinder<[channel: string, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user performs a "ritual" in a channel.
     *
     * @eventListener
     * @param channel The channel where the ritual was performed.
     * @param user The user that has performed the ritual.
     * @param ritualInfo Additional information about the ritual.
     * @param msg The full message object containing all message and user information.
     */
    readonly onRitual: EventBinder<[channel: string, user: string, ritualInfo: ChatRitualInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when slow mode is toggled in a channel.
     *
     * @eventListener
     * @param channel The channel where slow mode is being toggled.
     * @param enabled Whether slow mode is being enabled. If false, it's being disabled.
     * @param delay The time (in seconds) a user has to wait between sending messages. Only set when enabling slow mode.
     */
    readonly onSlow: EventBinder<[channel: string, enabled: boolean, delay?: number]> = this.registerEvent();

    /**
     * Fires when sub only mode is toggled in a channel.
     *
     * @eventListener
     * @param channel The channel where sub only mode is being toggled.
     * @param enabled Whether sub only mode is being enabled. If false, it's being disabled.
     */
    readonly onSubsOnly: EventBinder<[channel: string, enabled: boolean]> = this.registerEvent();

    /**
     * Fires when a user subscribes to a channel.
     *
     * @eventListener
     * @param channel The channel that was subscribed to.
     * @param user The subscribing user.
     * @param subInfo Additional information about the subscription.
     * @param msg The full message object containing all message and user information.
     */
    readonly onSub: EventBinder<[channel: string, user: string, subInfo: ChatSubInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user resubscribes to a channel.
     *
     * @eventListener
     * @param channel The channel that was resubscribed to.
     * @param user The resubscribing user.
     * @param subInfo Additional information about the resubscription.
     * @param msg The full message object containing all message and user information.
     */
    readonly onResub: EventBinder<[channel: string, user: string, subInfo: ChatSubInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user gifts a subscription to a channel to another user.
     *
     * Community subs also fire multiple `onSubGift` events.
     * To prevent alert spam, check [Sub gift spam](/docs/chat/examples/sub-gift-spam).
     *
     * @eventListener
     * @param channel The channel that was subscribed to.
     * @param user The user that the subscription was gifted to. The gifting user is defined in `subInfo.gifter`.
     * @param subInfo Additional information about the subscription.
     * @param msg The full message object containing all message and user information.
     */
    readonly onSubGift: EventBinder<[channel: string, user: string, subInfo: ChatSubGiftInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user gifts random subscriptions to the community of a channel.
     *
     * Community subs also fire multiple `onSubGift` events.
     * To prevent alert spam, check [Sub gift spam](/docs/chat/examples/sub-gift-spam).
     *
     * @eventListener
     * @param channel The channel that was subscribed to.
     * @param user The gifting user.
     * @param subInfo Additional information about the community subscription.
     * @param msg The full message object containing all message and user information.
     */
    readonly onCommunitySub: EventBinder<[channel: string, user: string, subInfo: ChatCommunitySubInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user extends their subscription using a Sub Token.
     *
     * @eventListener
     * @param channel The channel where the subscription was extended.
     * @param user The user that extended their subscription.
     * @param subInfo Additional information about the subscription extension.
     * @param msg The full message object containing all message and user information.
     */
    readonly onSubExtend: EventBinder<[channel: string, user: string, subInfo: ChatSubExtendInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user gifts rewards during a special event.
     *
     * @eventListener
     * @param channel The channel where the rewards were gifted.
     * @param user The user that gifted the rewards.
     * @param rewardGiftInfo Additional information about the reward gift.
     * @param msg The full message object containing all message and user information.
     */
    readonly onRewardGift: EventBinder<[channel: string, user: string, rewardGiftInfo: ChatRewardGiftInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user upgrades their Prime subscription to a paid subscription in a channel.
     *
     * @eventListener
     * @param channel The channel where the subscription was upgraded.
     * @param user The user that upgraded their subscription.
     * @param subInfo Additional information about the subscription upgrade.
     * @param msg The full message object containing all message and user information.
     */
    readonly onPrimePaidUpgrade: EventBinder<[channel: string, user: string, subInfo: ChatSubUpgradeInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user upgrades their gift subscription to a paid subscription in a channel.
     *
     * @eventListener
     * @param channel The channel where the subscription was upgraded.
     * @param user The user that upgraded their subscription.
     * @param subInfo Additional information about the subscription upgrade.
     * @param msg The full message object containing all message and user information.
     */
    readonly onGiftPaidUpgrade: EventBinder<[channel: string, user: string, subInfo: ChatSubGiftUpgradeInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user gifts a Twitch Prime benefit to the channel.
     *
     * @eventListener
     * @param channel The channel where the benefit was gifted.
     * @param user The user that received the gift.
     *
     * **WARNING:** This is a *display name* and thus will not work as an identifier for the API (login) in some cases.
     * @param subInfo Additional information about the gift.
     * @param msg The full message object containing all message and user information.
     */
    readonly onPrimeCommunityGift: EventBinder<[channel: string, user: string, subInfo: ChatPrimeCommunityGiftInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user pays forward a subscription that was gifted to them to a specific user.
     *
     * @eventListener
     * @param channel The channel where the gift was forwarded.
     * @param user The user that forwarded the gift.
     * @param forwardInfo Additional information about the gift.
     * @param msg The full message object containing all message and user information.
     */
    readonly onStandardPayForward: EventBinder<[channel: string, user: string, forwardInfo: ChatStandardPayForwardInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when a user pays forward a subscription that was gifted to them to the community.
     *
     * @eventListener
     * @param channel The channel where the gift was forwarded.
     * @param user The user that forwarded the gift.
     * @param forwardInfo Additional information about the gift.
     * @param msg The full message object containing all message and user information.
     */
    readonly onCommunityPayForward: EventBinder<[channel: string, user: string, forwardInfo: ChatCommunityPayForwardInfo, msg: UserNotice]> = this.registerEvent();

    /**
     * Fires when receiving a whisper from another user.
     *
     * @eventListener
     * @param user The user that sent the whisper.
     * @param message The message text.
     * @param msg The full message object containing all message and user information.
     */
    readonly onWhisper: EventBinder<[user: string, message: string, msg: Whisper]> = this.registerEvent();

    /**
     * Fires when you tried to execute a command you don't have sufficient permission for.
     *
     * @eventListener
     * @param channel The channel that a command without sufficient permissions was executed on.
     * @param message The message text.
     */
    readonly onNoPermission: EventBinder<[channel: string, message: string]> = this.registerEvent();

    /**
     * Fires when a message you tried to send gets rejected by the ratelimiter.
     *
     * @eventListener
     * @param channel The channel that was attempted to send to.
     * @param message The message text.
     */
    readonly onMessageRatelimit: EventBinder<[channel: string, message: string]> = this.registerEvent();

    /**
     * Fires when authentication fails.
     *
     * @eventListener
     * @param channel The channel that a command without sufficient permissions was executed on.
     * @param retryCount The amount of retries left.
     */
    readonly onAuthenticationFailure: EventBinder<[channel: string, retryCount: number]> = this.registerEvent();

    /**
     * Fires when sending a message fails.
     *
     * @eventListener
     * @param channel The channel that rejected the message.
     * @param reason The reason for the failure, e.g. you're banned (msg_banned)
     */
    readonly onMessageFailed: EventBinder<[channel: string, reason: string]> = this.registerEvent();

    /**
     * Fires when a user sends a message to a channel.
     *
     * @eventListener
     * @param channel The channel the message was sent to.
     * @param user The user that send the message.
     * @param message The message text.
     * @param msg The full message object containing all message and user information.
     */

    readonly onMessage: EventBinder<[channel: string, user: string, message: string, msg: TwitchPrivateMessage]> = this.registerEvent();

    readonly onConnect: EventBinder<[]> = this.registerEvent();

    readonly onRegister: EventBinder<[]> = this.registerEvent();

    readonly onDisconnect: EventBinder<[manually: boolean, reason?: Error]> = this.registerEvent();

    readonly onPrivmsg: EventBinder<[target: string, user: string, message: string, msg: MessageTypes.Commands.PrivateMessage]> = this.registerEvent();

    readonly onAction: EventBinder<[target: string, user: string, message: string, msg: MessageTypes.Commands.PrivateMessage]> = this.registerEvent();

    readonly onNotice: EventBinder<[target: string, user: string, message: string, msg: MessageTypes.Commands.Notice]> = this.registerEvent();

    readonly onNickChange: EventBinder<[oldNick: string | undefined, newNick: string, msg: MessageTypes.Commands.NickChange]> = this.registerEvent();

    readonly onCtcp: EventBinder<[target: string, user: string, command: string, params: string, msg: MessageTypes.Commands.PrivateMessage]> = this.registerEvent();

    readonly onCtcpReply: EventBinder<[target: string, user: string, command: string, params: string, msg: MessageTypes.Commands.Notice]> = this.registerEvent();

    readonly onPasswordError: EventBinder<[error: Error]> = this.registerEvent();

    readonly onAnyMessage: EventBinder<[msg: Message]> = this.registerEvent();

    protected attachEvents(chatClient: ChatClient) {
        chatClient.onMessage((...args) => this.emit(this.onMessage, ...args));
        chatClient.onAction((...args) => this.emit(this.onAction, ...args));
        chatClient.onAnyMessage((...args) => this.emit(this.onAnyMessage, ...args));
        chatClient.onAuthenticationFailure((...args) => this.emit(this.onAuthenticationFailure, ...args));
        chatClient.onBan((...args) => this.emit(this.onBan, ...args));
        chatClient.onBitsBadgeUpgrade((...args) => this.emit(this.onBitsBadgeUpgrade, ...args));
        chatClient.onChatClear((...args) => this.emit(this.onChatClear, ...args));
        chatClient.onCommunityPayForward((...args) => this.emit(this.onCommunityPayForward, ...args));
        chatClient.onCommunitySub((...args) => this.emit(this.onCommunitySub, ...args));
        chatClient.onConnect((...args) => this.emit(this.onConnect, ...args));
        chatClient.onCtcp((...args) => this.emit(this.onCtcp, ...args));
        chatClient.onCtcpReply((...args) => this.emit(this.onCtcpReply, ...args));
        chatClient.onDisconnect((...args) => this.emit(this.onDisconnect, ...args));
        chatClient.onEmoteOnly((...args) => this.emit(this.onEmoteOnly, ...args));
        chatClient.onFollowersOnly((...args) => this.emit(this.onFollowersOnly, ...args));
        chatClient.onGiftPaidUpgrade((...args) => this.emit(this.onGiftPaidUpgrade, ...args));
        chatClient.onHost((...args) => this.emit(this.onHost, ...args));
        chatClient.onHosted((...args) => this.emit(this.onHosted, ...args));
        chatClient.onHostsRemaining((...args) => this.emit(this.onHostsRemaining, ...args));
        chatClient.onJoin((...args) => this.emit(this.onJoin, ...args));
        chatClient.onJoinFailure((...args) => this.emit(this.onJoinFailure, ...args));
        chatClient.onMessageFailed((...args) => this.emit(this.onMessageFailed, ...args));
        chatClient.onMessageRatelimit((...args) => this.emit(this.onMessageRatelimit, ...args));
        chatClient.onMessageRemove((...args) => this.emit(this.onMessageRemove, ...args));
        chatClient.onNickChange((...args) => this.emit(this.onNickChange, ...args));
        chatClient.onNoPermission((...args) => this.emit(this.onNoPermission, ...args));
        chatClient.onNotice((...args) => this.emit(this.onNotice, ...args));
        chatClient.onPart((...args) => this.emit(this.onPart, ...args));
        chatClient.onPasswordError((...args) => this.emit(this.onPasswordError, ...args));
        chatClient.onPrimeCommunityGift((...args) => this.emit(this.onPrimeCommunityGift, ...args));
        chatClient.onPrimePaidUpgrade((...args) => this.emit(this.onPrimePaidUpgrade, ...args));
        chatClient.onR9k((...args) => this.emit(this.onR9k, ...args));
        chatClient.onRaid((...args) => this.emit(this.onRaid, ...args));
        chatClient.onRaidCancel((...args) => this.emit(this.onRaidCancel, ...args));
        chatClient.onRegister((...args) => this.emit(this.onRegister, ...args));
        chatClient.onResub((...args) => this.emit(this.onResub, ...args));
        chatClient.onRewardGift((...args) => this.emit(this.onRewardGift, ...args));
        chatClient.onRitual((...args) => this.emit(this.onRitual, ...args));
        chatClient.onSlow((...args) => this.emit(this.onSlow, ...args));
        chatClient.onStandardPayForward((...args) => this.emit(this.onStandardPayForward, ...args));
        chatClient.onSub((...args) => this.emit(this.onSub, ...args));
        chatClient.onSubExtend((...args) => this.emit(this.onSubExtend, ...args));
        chatClient.onSubGift((...args) => this.emit(this.onSubGift, ...args));
        chatClient.onSubsOnly((...args) => this.emit(this.onSubsOnly, ...args));
        chatClient.onTimeout((...args) => this.emit(this.onTimeout, ...args));
        chatClient.onUnhost((...args) => this.emit(this.onUnhost, ...args));
        chatClient.onWhisper((...args) => this.emit(this.onWhisper, ...args));
        chatClient.onPrivmsg((...args) => this.emit(this.onPrivmsg, ...args));
    }
}
