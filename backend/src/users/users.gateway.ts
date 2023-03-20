import { ConfigService } from '@nestjs/config';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { validateSync } from 'class-validator';
import { DateTime } from 'luxon';
import { BaseGateway } from 'src/base.gateway';
import { SocketWithUser, WSResponse } from 'src/types';
import { exceptionToObj } from 'src/utils';
import { UpdateUserDto } from './dto/update-user.dto';
import { BannedUser } from './entities/user-banned.entity';
import { UserFriend } from './entities/user-friend.entity';
import { MutedUser } from './entities/user-muted.entity';
import { User } from './entities/user.entity';
import { UserMessage } from './entities/user.message.entity';

@WebSocketGateway({
	cors: {
		origin: async (origin, callback) => {
			const configService = new ConfigService();
			callback(null, configService.get<string>('CORS_ORIGIN') || '*');
		},
		credentials: true,
	},
})
export class UsersGateway extends BaseGateway {
	/*
	 * Get user
	 */
	@SubscribeMessage('users_get')
	async get(
		socket: SocketWithUser,
		payload: any,
	): Promise<User | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to get user
		return await this.usersService
			.findOne(payload.id)
			.then((user) => user)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Update user
	 * The client must be the user himself
	 */
	@SubscribeMessage('users_update')
	async update(
		socket: SocketWithUser,
		payload: any,
	): Promise<User | WSResponse> {
		// Validate payload
		let errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');

		// Create updateUserDto
		const updateUserDto = new UpdateUserDto();
		if (payload !== undefined && typeof payload == 'object') {
			updateUserDto.username = payload.username;
		}

		const val = validateSync(updateUserDto);
		if (val.length != 0)
			errors = errors.concat(
				val.map((e) => Object.values(e.constraints)).flat(1),
			);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to update user
		return await this.usersService
			.update(socket.userId, payload.id, updateUserDto)
			.then((user) => {
				// Propagate user update
				this.propagateUserUpdate(user, 'users_update');
				return user;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Invite friend
	 */
	@SubscribeMessage('users_inviteFriend')
	async inviteFriend(
		socket: SocketWithUser,
		payload: any,
	): Promise<UserFriend | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.username === undefined)
			errors.push('Username is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to invite friend
		return await this.usersService
			.inviteFriend(socket.userId, payload.username)
			.then((userFriend) => {
				// Propagate friendship invitation
				this.connectedClientsService
					.get(userFriend.inviteeId)
					.emit('users_friendshipInvitation', userFriend);

				return userFriend;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Accept friend
	 */
	@SubscribeMessage('users_acceptFriend')
	async acceptFriend(
		socket: SocketWithUser,
		payload: any,
	): Promise<UserFriend | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to accept friend
		return await this.usersService
			.acceptFriendship(socket.userId, payload.id)
			.then((userFriend) => {
				// Propagate friendship acceptance
				this.connectedClientsService
					.get(userFriend.inviterId)
					.emit('users_friendshipAccepted', userFriend);
				return userFriend;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Remove friend
	 */
	@SubscribeMessage('users_removeFriend')
	async removeFriend(
		socket: SocketWithUser,
		payload: any,
	): Promise<UserFriend | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to remove friend
		return await this.usersService
			.removeFriendship(socket.userId, payload.id)
			.then((userFriend) => {
				// Propagate friendship removal
				this.connectedClientsService
					.get(payload.id)
					.emit('users_friendshipRemoved', userFriend);
				return userFriend;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Ban user
	 */
	@SubscribeMessage('users_ban')
	async ban(
		socket: SocketWithUser,
		payload: any,
	): Promise<BannedUser | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');
		if (payload.until === undefined) errors.push('Until is not specified');

		const until = DateTime.fromISO(payload.until);
		if (!until.isValid) errors.push('Until date: ', until.invalidReason);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to ban user
		return await this.usersService
			.ban(socket.userId, payload.id, until.toJSDate())
			.then((user) => {
				// Propagate user ban
				this.connectedClientsService
					.get(user.banned.id)
					.emit('users_banned', user);
				return user;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Mute user
	 */
	@SubscribeMessage('users_mute')
	async mute(
		socket: SocketWithUser,
		payload: any,
	): Promise<MutedUser | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');
		if (payload.until === undefined) errors.push('Until is not specified');

		const until = DateTime.fromISO(payload.until);
		if (!until.isValid) errors.push('Until date: ', until.invalidReason);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to mute user
		return await this.usersService
			.mute(socket.userId, payload.id, until.toJSDate())
			.then((user) => {
				// Propagate user mute
				this.connectedClientsService
					.get(user.muted.id)
					.emit('users_muted', user);
				return user;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Send message
	 */
	@SubscribeMessage('users_sendMessage')
	async sendMessage(
		socket: SocketWithUser,
		payload: any,
	): Promise<UserMessage | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');
		if (payload.message === undefined)
			errors.push('Message is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to send message
		return await this.usersService
			.sendMessage(socket.userId, payload.id, payload.message)
			.then((message) => {
				// Send message to the user
				this.connectedClientsService
					.get(message.receiverId)
					.emit('users_message', { message: message });
				return message;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Get user messages
	 * Return the 50 message before the given date.
	 */
	@SubscribeMessage('users_getMessages')
	async getMessages(
		socket: SocketWithUser,
		payload: any,
	): Promise<UserMessage[] | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('User id is not specified');
		if (payload.before === undefined)
			errors.push('Before date is not specified');

		const before = DateTime.fromISO(payload.before);
		if (!before.isValid) errors.push('Before date: ', before.invalidReason);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to get messages
		return await this.usersService
			.getMessages(socket.userId, payload.id, before.toJSDate())
			.then((messages) => messages)
			.catch((error) => exceptionToObj(error));
	}
}
