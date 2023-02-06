export interface IUser {
	id: number;
	id42: number;
	username: string;
}

export interface IAuth {
	bearer: string | null;
	otp_ok: boolean;
}
