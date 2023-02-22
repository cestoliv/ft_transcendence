import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { BaseGateway } from 'src/base.gateway';
import { ConfigService } from '@nestjs/config';
import { SocketWithUser, WSResponse } from 'src/types';
import { exceptionToObj } from 'src/utils';
import { GameOptions } from './game.class';

@WebSocketGateway({
	cors: {
		origin: async (origin, callback) => {
			const configService = new ConfigService();
			callback(null, configService.get<string>('FRONTEND_URL') || '*');
		},
		credentials: true,
	},
})
export class GamesGateway extends BaseGateway {
	@SubscribeMessage('games_create')
	async create(
		client: SocketWithUser,
		payload: any,
	): Promise<any | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		const options = new GameOptions(1, 5, 'classic', 'public');

		// Create game
		return this.gamesService
			.create(client, options, this.connectedClientsService)
			.then((game) => game)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_join')
	async join(
		client: SocketWithUser,
		payload: any,
	): Promise<any | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined) errors.push('Game id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Join game
		return this.gamesService
			.join(payload.id, client)
			.then((game) => game)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_joinMatchmaking')
	async joinMatchmaking(client: SocketWithUser): Promise<any | WSResponse> {
		// Join Matchmaking
		return this.gamesService
			.joinMatchmaking(client)
			.then((res) => res)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_playerMove')
	async move(
		client: SocketWithUser,
		payload: any,
	): Promise<any | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Game id pos is not specified');
		if (payload.y === undefined) errors.push('New Y pos is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Move player
		return this.gamesService
			.movePlayer(payload.id, client, payload.y)
			.then(() => null)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_invite')
	async invite(
		client: SocketWithUser,
		payload: any,
	): Promise<any | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Game id pos is not specified');
		if (payload.user_id === undefined)
			errors.push('Id of user to invite is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Invite player
		return this.gamesService
			.invite(payload.id, client, payload.user_id)
			.then((invitee) => invitee)
			.catch((err) => exceptionToObj(err));
	}
}
