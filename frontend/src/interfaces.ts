import { SetCookie, RemoveCookie } from './types';

export interface IUser {
	id: number;
	id42: number;
	username: string;
	elo: number;
	wins: number;
	loses: number;
	scores: IScore[];
	picture: string;
	invitedFriends: IUserFriend[];
	friendOf: IUserFriend[];
	friends: IUser[];
	blocked: IUser[]
}

export interface IScore {
	me: number;
	op: number;
	op_name: string;
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
	muted: IUser[];
	invited: IChannelInvitedUser[];
}

export interface IChannelBannedUser {
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
