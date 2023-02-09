import { ConfigService } from '@nestjs/config';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from 'src/base.gateway';
import { SocketWithUser, WSResponse } from 'src/types';
import { exceptionToObj } from 'src/utils';
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
	async getUser(
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

		// Get user
		return await this.usersService
			.findOne(payload.id)
			.then((user) => user)
			.catch((error) => exceptionToObj(error));
	}
}
