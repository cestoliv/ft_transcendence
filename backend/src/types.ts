import { Socket } from 'socket.io';

export type SocketWithUser = Socket & { userId: number };

export type WSResponse = {
	statusCode: number;
	error: string;
	messages: string[];
};
