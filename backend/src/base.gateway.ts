import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChannelsService } from './channels/channels.service';
import { GamesService } from './games/games.service';
import { SocketWithUser } from './types';
import { User } from './users/entities/user.entity';
import { Status } from './users/enums/status.enum';
import { UsersService } from './users/users.service';

@Injectable()
export class ConnectedClientsService {
	private clients = new Map<number, SocketWithUser>();
	// user id, socket id

	add(userId: number, socket: SocketWithUser) {
		this.clients.set(userId, socket);
	}

	get(userId: number) {
		if (!this.clients.has(userId)) {
			// TODO: disconnect the user (give up every games)
			// User is not connected, so we return an object that will not emit anything
			return {
				emit: () => {
					/* Do nothing */
				},
				leave: () => {
					/* Do nothing */
				},
				join: () => {
					/* Do nothing */
				},
			} as unknown as SocketWithUser;
		}
		return this.clients.get(userId);
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
		try {
			const user = await this.usersService.getUserFromSocket(socket);

			// Save the user id in the socket
			socket.userId = user.id;

			// Check if the user is already connected
			if (
				this.connectedClientsService.has(user.id) &&
				this.connectedClientsService.get(user.id).id != socket.id
			) {
				console.log(
					`Client already connected (disconnecting): ${user.username} (${socket.id})`,
				);
				this.connectedClientsService.get(user.id).emit('error', {
					statusCode: 409,
					message: 'Conflict',
					errors: ['You are connected somewhere else'],
				});
				this.connectedClientsService.get(user.id).disconnect();
				this.connectedClientsService.delete(
					this.connectedClientsService.get(user.id).userId,
				);
			}

			console.log(`Client connected: ${user.username} (${socket.id})`);

			this.connectedClientsService.add(user.id, socket);

			// Make the user join all the channels he is in
			const channels = await this.channelsService.listJoined(user.id);
			channels.forEach((channel) => {
				socket.join(`channel_${channel.id}`);
			});

			// Join every friends channel
			user.friends.forEach((friend) => {
				socket.join(`user_${friend.id}`);
			});

			// Make the join his own channel
			socket.join(`user_${user.id}`);
			socket.join(`me_${user.id}`);

			// Propagate new user status
			this.gamesService.usersService
				.changeStatus(user.id, Status.Online)
				.catch(() => {
					// Ignore error
				});
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
		if (!socket.userId) return;
		if (!this.connectedClientsService.has(socket.userId)) {
			console.log(
				`Client already disconnected: ${socket.userId} (${socket.id})`,
			);
			return;
		} else
			console.log(`Client disconnected: ${socket.userId} (${socket.id})`);

		this.connectedClientsService.delete(socket.userId);

		// Make the user give up all the games he is in
		const games = [...this.gamesService.games].filter((g) => {
			const game = g[1];
			return game.players.find(
				(player) => player.user.id == socket.userId,
			);
		});
		for (const game of games) {
			game[1].giveUp(socket.userId);
		}

		// Propagate new user status
		this.gamesService.usersService
			.changeStatus(socket.userId, Status.Offline)
			.catch(() => {
				// Ignore error
			});
	}

	async afterInit() {
		this.usersService.gateway = this;
	}

	async propagateUserUpdate(updatedUser: User, event: string) {
		const channels = await this.channelsService.listJoined(updatedUser.id);

		let socket: Server | SocketWithUser = this.server;
		if (this.connectedClientsService.has(updatedUser.id)) {
			socket = this.connectedClientsService.get(updatedUser.id);
		}

		// Send to every friends and in every channels the user is in
		socket
			.to(`user_${updatedUser.id}`)
			.to(channels.map((c) => `channel_${c.id}`))
			.emit(event, updatedUser);
	}
}
