import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChannelsService } from './channels/channels.service';
import { GamesService } from './games/games.service';
import { SocketWithUser } from './types';
import { UsersService } from './users/users.service';

@Injectable()
export class ConnectedClientsService {
	private clients = new Map<number, SocketWithUser>();
	// user id, socket id

	add(userId: number, socket: SocketWithUser) {
		this.clients.set(userId, socket);
	}

	delete(userId: number) {
		this.clients.delete(userId);
	}

	has(userId: number) {
		return this.clients.has(userId);
	}

	array(): [number, SocketWithUser][] {
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
		// TODO: fix, fired 3 times, one for each gateway
		try {
			const user = await this.usersService.getUserFromSocket(socket);
			socket.user = user;
			this.connectedClientsService.add(user.id, socket);
			console.log(`Client connected: ${user.username} (${socket.id})`);
			// socket.on('disconnect', () => {
			// 	this.connectedClientsService.remove(socket.id);
			// });
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

	async handleDisconnect(socket: SocketWithUser) {
		// TODO: fix, fired 3 times, one for each gateway
		if (!socket.user) return;
		this.connectedClientsService.delete(socket.user.id);
		console.log(
			`Client disconnected: ${socket.user.username} (${socket.id})`,
		);

		// Make the user give up all the games he is in
		console.log('Giving up games');
		console.log(this.gamesService.games);
		const games = [...this.gamesService.games].filter((g) => {
			const game = g[1];
			return game.players.find(
				(player) => player.socket.user.id == socket.user.id,
			);
		});
		console.log(games);
		for (const game of games) {
			game[1].giveUp(socket);
		}
	}
}
