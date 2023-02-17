import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChannelsService } from './channels/channels.service';
import { GamesService } from './games/games.service';
import { SocketWithUser } from './types';
import { UsersService } from './users/users.service';

@Injectable()
export class ConnectedClientsService {
	private clients = new Set<string>();

	add(clientId: string) {
		this.clients.add(clientId);
	}

	remove(clientId: string) {
		this.clients.delete(clientId);
	}

	get(): string[] {
		return Array.from(this.clients);
	}
}

@Injectable()
export abstract class BaseGateway implements OnGatewayConnection {
	constructor(
		@Inject(forwardRef(() => UsersService))
		readonly usersService: UsersService,
		@Inject(forwardRef(() => ChannelsService))
		readonly channelsService: ChannelsService,
		@Inject(forwardRef(() => GamesService))
		readonly gamesService: GamesService,

		readonly connectedClientsService: ConnectedClientsService,
	) {}

	@WebSocketServer() server: Server;

	async handleConnection(socket: SocketWithUser) {
		try {
			const user = await this.usersService.getUserFromSocket(socket);
			socket.user = user;
			this.connectedClientsService.add(socket.id);
			socket.on('disconnect', () => {
				this.connectedClientsService.remove(socket.id);
			});
			// Make the user join all the channels he is in
			const channels = await this.channelsService.listJoined(user);
			for (const channel of channels) {
				socket.join(`channel_${channel.id}`);
			}
			// Make the join his own channel
			socket.join(`user_${user.id}`);
		} catch (error) {
			// Reject connection
			socket.emit('error', {
				statusCode: 401,
				message: 'Unauthorized',
				errors: [error.message],
			});
			socket.disconnect(true);
		}
	}

	// abstract afterInit(): void;
}
