export interface IUser {
	id: number;
	id42: number;
	username: string;
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
	userId: number,
	user: IUser,

	channelId: number,
	channel: IChannel,

	until: Date,
}

export interface IChannelInvitedUser{
	userId: number,
	user: IUser,

	inviterId: number,
	inviter: IUser,

	channelId: number,
	channel: IChannel,

	invited_at: Date,
}

export interface IChannelMessage{
	id: number,

	senderId: number,
	sender: IUser,

	channelId: number,
	channel: IChannel,

	message: string,

	sentAt: Date,
}
