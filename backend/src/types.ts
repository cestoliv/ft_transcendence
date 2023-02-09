import { Socket } from 'socket.io';
import { User } from './users/entities/user.entity';

export type SocketWithUser = Socket & { user: User };

export type WSResponse = {
	statusCode: number;
	error: string;
	messages: string[];
};
