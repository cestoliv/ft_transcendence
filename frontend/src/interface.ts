export interface InfosConvProps {
	convList: IConvList[];
}

export interface IConvList {
	name: string;
	id: number;
}

export interface friendsListProps {
	friendsList: IFriendsList[];
}

export interface IFriendsList {
	name: string;
	id: number;
	status: string;
}

export interface chanssListProps {
	friendsList: IChansList[];
}

export interface IChansList {
	name: string;
	motdepasse: string;
	id: number;
}

export interface INameList {
	first: string;
	last: string;
	status: string;
}

export interface IUser {
	first: string;
	last: string;
	status: string;
	googleAuth: boolean;
}

// interface IFuncProps {
//     activeConv(event: any) : void;
// }
