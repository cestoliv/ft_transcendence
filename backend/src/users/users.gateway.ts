import { ConfigService } from '@nestjs/config';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { validateSync } from 'class-validator';
import { BaseGateway } from 'src/base.gateway';
import { SocketWithUser, WSResponse } from 'src/types';
import { exceptionToObj } from 'src/utils';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFriend } from './entities/user-friend.entity';
import { User } from './entities/user.entity';

@WebSocketGateway({
	cors: {
		origin: async (origin, callback) => {
			const configService = new ConfigService();
			callback(null, configService.get<string>('FRONTEND_URL') || '*');
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
		client: SocketWithUser,
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
	 * The client must the user himself
	 */
	@SubscribeMessage('users_update')
	async update(
		client: SocketWithUser,
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
			.update(client.user, payload.id, updateUserDto)
			.then((user) => user)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Invite friend
	 */
	@SubscribeMessage('users_inviteFriend')
	async inviteFriend(
		client: SocketWithUser,
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

		// Try to invite friend
		return await this.usersService
			.inviteFriend(client.user, payload.id)
			.then((userFriend) => userFriend)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Accept friend
	 */
	@SubscribeMessage('users_acceptFriend')
	async acceptFriend(
		client: SocketWithUser,
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
			.acceptFriendship(client.user, payload.id)
			.then((userFriend) => userFriend)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Remove friend
	 */
	@SubscribeMessage('users_removeFriend')
	async removeFriend(
		client: SocketWithUser,
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
			.removeFriendship(client.user, payload.id)
			.then((userFriend) => userFriend)
			.catch((error) => exceptionToObj(error));
	}
}
