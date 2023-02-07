import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChannelsService } from './channels/channels.service';
import { UsersService } from './users/users.service';

@Injectable()
export abstract class BaseGateway implements OnGatewayConnection {
	constructor(
		@Inject(forwardRef(() => UsersService))
		readonly usersService: UsersService,
		@Inject(forwardRef(() => ChannelsService))
		readonly channelsService: ChannelsService,
	) {}

	@WebSocketServer() server;

	async handleConnection(socket: Socket) {
		try {
			const user = await this.usersService.getUserFromSocket(socket);
			socket['user'] = user;
			socket['socket'] = socket;
			// Make the user join all the channels he is in
			const channels = await this.channelsService.listJoined(user);
			for (const channel of channels) {
				socket.join(`channel_${channel.id}`);
				console.log(`User ${user.id} joined channel ${channel.id}`);
			}
		} catch (error) {
			// Reject connection
			socket.emit('error', {
				code: 401,
				message: 'Unauthorized',
				error: error.message,
			});
			socket.disconnect(true);
		}
	}

	// abstract afterInit(): void;
}
