export interface IUser {
	id: number;
	id42: number;
	username: string;
	elo: number;
	wins: number;
	loses: number;
	scores: IScore[];
}

export interface IScore 
{
	me: number;
	op: number;
	op_name: string;
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
	banned: IUser[];
	muted: IUser[];
	invited: IUser[];
  }
