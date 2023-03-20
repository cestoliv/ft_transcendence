import { SetCookie, RemoveCookie } from './types';

export interface IUser {
	id: number;
	id42: number; // null for non-42 users
	username: string;
	displayName: string;
	status: 'online' | 'offline' | 'playing';
	elo: number;
	invitedFriends: IUserFriend[];
	friendOf: IUserFriend[];
	friends: IUser[];
	profile_picture: string;
	firstConnection: boolean;
	muted: IMutedUser[];
}

export interface IMutedUser {
	userId: number;
	user: IUser;

	mutedId: number;
	muted: IUser;
	until: Date;
}

export interface IGame {
	id: number;
	visibility: 'public' | 'private';
	mode: 'classic' | 'hardcore';
	maxDuration: 1 | 2 | 3;
	maxScore: 5 | 10 | 30 | null;

	winner: IUser;
	winnerScore: number;

	loser: IUser;
	loserScore: number;

	isDraw: boolean;
}

export interface ILeaderboards {
	elo: IUser[];
	mostPlayed: IStat[];
}

export interface IStat {
	user: IUser;
	stats: {
		games: number;
		wins: number;
		losses: number;
		winrate: number;
	};
}

export interface IUserMessage {
	id: number;

	senderId: number;
	sender: IUser;

	receiverId: number;
	receiver: IUser;

	message: string;

	sentAt: Date;
}

export interface IUserFriend {
	inviterId: number;
	inviter: IUser;

	inviteeId: number;
	invitee: IUser;

	accepted: boolean;
}

export interface IAuth {
	bearer: string | null;
	otp_ok: boolean;
	user: IUser | null;
}

export interface IChannel {
	id: number;
	code: string;
	owner: IUser;
	name: string;
	visibility: 'public' | 'private' | 'password-protected';
	admins: IUser[];
	members: IUser[];
	banned: IChannelBannedUser[];
	muted: IChannelMutedUser[];
	invited: IChannelInvitedUser[];
}

export interface IChannelBannedUser {
	userId: number;
	user: IUser;

	channelId: number;
	channel: IChannel;

	until: Date;
}

export interface IChannelMutedUser {
	userId: number;
	user: IUser;

	channelId: number;
	channel: IChannel;

	until: Date;
}

export interface IChannelInvitedUser {
	userId: number;
	user: IUser;

	inviterId: number;
	inviter: IUser;

	channelId: number;
	channel: IChannel;

	invited_at: Date;
}

export interface IChannelMessage {
	id: number;

	senderId: number;
	sender: IUser;

	channelId: number;
	channel: IChannel;

	message: string;

	sentAt: Date;
}

export interface ILogin {
	fetchUser: () => Promise<void>;
	setCookie: SetCookie;
	removeCookie: RemoveCookie;
}

export interface IOtp {
	fetchUser: () => Promise<void>;
	setCookie: SetCookie;
	removeCookie: RemoveCookie;
}

export interface ILocalGameInfo {
	id: string;
	state: 'waiting' | 'started' | 'ended' | 'saved';
	startAt: number | null;
	players: Array<{
		user: IUser;
		score: number;
	}>;
	paddleHeight: number;
	isWatching: boolean;
}

export interface IMusic {
	id: number;
	title: string;
	url: string;
}

export interface IPlayList {
	id: number;
	title: string;
	music_list: IMusic[];
}
