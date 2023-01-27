import {
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from './users.service';

@WebSocketGateway({
	cors: {
		origin: 'http://transcendence.local',
		credentials: true,
	},
})
export class UsersGateway {
	@WebSocketServer()
	server: Server;

	constructor(private readonly usersService: UsersService) {}

	// @UseGuards(WsGuard)
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

	// @UseGuards(WsGuard)
	@SubscribeMessage('message')
	handleMessage(client: any, payload: any): string {
		return `Hello ${client.user.username}, you said: ${payload}`;
	}
}
