import { ConfigService } from '@nestjs/config';
import {
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from './users.service';

@WebSocketGateway({
	cors: {
		// TODO: Should use ConfigService instead of process.env
		origin: process.env.FRONTEND_URL || '*',
		credentials: true,
	},
})
export class UsersGateway {
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly usersService: UsersService,
		private readonly configService: ConfigService,
	) {}

	/*
	 * This function is called when a client connects to the socket
	 * We use it to authenticate the user
	 * If the user is not authenticated, we reject the connection
	 */
	async handleConnection(socket: Socket) {
		try {
			const user = await this.usersService.getUserFromSocket(socket);
			socket['user'] = user;
		} catch (error) {
			// Reject connection
			socket.emit('error', {
				code: 401,
				message: 'Unauthorized',
			});
			socket.disconnect(true);
		}
	}

	@SubscribeMessage('message')
	handleMessage(client: any, payload: any): string {
		return `Hello ${client.user.username}, you said: ${payload}`;
	}
}
