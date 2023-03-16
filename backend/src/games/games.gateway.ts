import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { BaseGateway } from 'src/base.gateway';
import { ConfigService } from '@nestjs/config';
import { SocketWithUser, WSResponse } from 'src/types';
import { exceptionToObj, isWsResponse } from 'src/utils';
import { LocalGameInfo } from './game.class';
import { Game } from './entities/game.entity';
import { Leaderboards, StatsUser } from './interfaces/leaderboards.interface';

@WebSocketGateway({
	cors: {
		origin: async (origin, callback) => {
			const configService = new ConfigService();
			callback(null, configService.get<string>('CORS_ORIGIN') || '*');
		},
		credentials: true,
	},
})
export class GamesGateway extends BaseGateway {
	@SubscribeMessage('games_create')
	async create(
		socket: SocketWithUser,
		payload: any,
	): Promise<LocalGameInfo | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.maxDuration === undefined)
			errors.push('Max duration is not specified');
		if (payload.maxScore === undefined)
			errors.push('Max score is not specified');
		if (payload.mode === undefined) errors.push('Mode is not specified');
		if (payload.visibility === undefined)
			errors.push('Visibility is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Create game
		return this.gamesService
			.create(
				socket.userId,
				payload,
				this.connectedClientsService,
				this.server,
			)
			.then(async (game) => {
				const init = await game
					.initGame()
					.then(() => true)
					.catch((err) => exceptionToObj(err));
				if (isWsResponse(init)) {
					await game.end();
					return init;
				}
				return game.getInfo();
			})
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_join')
	async join(
		socket: SocketWithUser,
		payload: any,
	): Promise<LocalGameInfo | WSResponse> {
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
			.join(payload.id, socket.userId)
			.then((game) => game)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_quit')
	async quit(
		socket: SocketWithUser,
		payload: any,
	): Promise<LocalGameInfo | WSResponse> {
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
			.quit(payload.id, socket.userId)
			.then((game) => game)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_joinMatchmaking')
	async joinMatchmaking(
		socket: SocketWithUser,
	): Promise<boolean | WSResponse> {
		// Join Matchmaking
		return this.gamesService
			.joinMatchmaking(socket.userId)
			.then((res) => res)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_quitMatchmaking')
	async quitMatchmaking(
		socket: SocketWithUser,
	): Promise<boolean | WSResponse> {
		// Quit Matchmaking
		return this.gamesService
			.leaveMatchmaking(socket.userId)
			.then((res) => res)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_playerMove')
	async move(
		socket: SocketWithUser,
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
			.movePlayer(payload.id, socket.userId, payload.y)
			.then(() => null)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_startWatching')
	async startWatching(
		socket: SocketWithUser,
		payload: any,
	): Promise<LocalGameInfo | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined && payload.user_id === undefined)
			errors.push(
				'Game id and User id are not specified (provide one of them)',
			);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Start watching
		const game = await this.gamesService
			.findStartedGame(payload.id || payload.user_id)
			.then((game) => game)
			.catch((err) => exceptionToObj(err));
		if (isWsResponse(game)) return game;

		socket.join(`game_watch_${game.id}`);
		return game.getInfo();
	}

	@SubscribeMessage('games_stopWatching')
	async stopWatching(
		socket: SocketWithUser,
		payload: any,
	): Promise<LocalGameInfo | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined || payload.user_id === undefined)
			errors.push(
				'Game id and User id are not specified (provide one of them)',
			);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Stop watching
		const game = await this.gamesService
			.findStartedGame(payload.id || payload.user_id)
			.then((game) => game)
			.catch((err) => exceptionToObj(err));
		if (isWsResponse(game)) return game;

		socket.leave(`game_watch_${game.id}`);
		return game.getInfo();
	}

	@SubscribeMessage('games_invite')
	async invite(
		socket: SocketWithUser,
		payload: any,
	): Promise<any | WSResponse> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		// if (payload.id === undefined)
		// 	errors.push('Game id pos is not specified');
		if (payload.user_id === undefined)
			errors.push('Id of user to invite is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};
		return await this.gamesService
			.create(
				socket.userId,
				payload,
				this.connectedClientsService,
				this.server,
			)
			.then(async (game) => {
				const init = await game
					.initGame()
					.then(() => true)
					.catch((err) => exceptionToObj(err));
				if (isWsResponse(init)) {
					await game.end();
					return init;
				}
				return await this.gamesService
					.invite(game.id, socket.userId, payload.user_id)
					.then(async (invitee) => {
						// Send notification to invitee
						this.connectedClientsService
							.get(invitee.id)
							.emit('games_invitation', {
								game: await this.gamesService.info(game.id),
								inviter: await this.usersService.findOne(
									socket.userId,
								),
							});
						return game.getInfo();
					})
					.catch(async (err) => {
						await game.end();
						return exceptionToObj(err);
					});
			})
			.catch((err) => exceptionToObj(err));

		// Invite player
		// return this.gamesService
		// 	.invite(game.id, socket.userId, payload.user_id)
		// 	.then(async (invitee) => {
		// 		// Send notification to invitee
		// 		this.connectedClientsService
		// 			.get(invitee.id)
		// 			.emit('games_invitation', {
		// 				game: await this.gamesService.info(payload.id),
		// 				inviter: await this.usersService.findOne(socket.userId),
		// 			});

		// 		return invitee;
		// 	})
		// 	.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_info')
	async info(
		socket: SocketWithUser,
		payload: any,
	): Promise<LocalGameInfo | WSResponse> {
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

		// Get game info
		return this.gamesService
			.info(payload.id)
			.then((game) => game)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_history')
	async history(
		socket: SocketWithUser,
		payload: any,
	): Promise<Game[] | WSResponse> {
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

		// Get game history
		return this.gamesService
			.getHistory(payload.id)
			.then((history) => history)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_leaderboards')
	async leaderboard(): Promise<Leaderboards | WSResponse> {
		// Get leaderboards
		return this.gamesService
			.getLeaderboards()
			.then((history) => history)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_userStats')
	async userStats(
		socket: SocketWithUser,
		payload: any,
	): Promise<StatsUser | WSResponse> {
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

		// Get user stats
		return this.gamesService
			.getUserStats(payload.id)
			.then((history) => history)
			.catch((err) => exceptionToObj(err));
	}

	@SubscribeMessage('games_available')
	async available(): Promise<LocalGameInfo[] | WSResponse> {
		// Get Available games
		return this.gamesService
			.getAvailableGamesInfo()
			.then((games) => games)
			.catch((err) => exceptionToObj(err));
	}
}
