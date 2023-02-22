import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { SocketWithUser } from 'src/types';
import { GameOptions, LocalGame } from './game.class';
import { Game } from './entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { ConnectedClientsService } from 'src/base.gateway';

@Injectable()
export class GamesService {
	constructor(
		@Inject(UsersService)
		private readonly usersService: UsersService,
		@InjectRepository(Game)
		private readonly gamesRepository: Repository<Game>,
	) {}

	public games = new Map<string, LocalGame>(); // Game ID -> Game
	public queue: Array<SocketWithUser> = [];

	async create(
		creator: SocketWithUser,
		payload: any,
		connectedClientsService: ConnectedClientsService,
	) {
		const options = new GameOptions(
			payload.maxDuration,
			payload.maxScore,
			payload.mode,
			payload.visibility,
		);

		const id = uuidv4();
		const game = new LocalGame(
			id,
			creator,
			options,
			this,
			connectedClientsService,
		);
		this.games.set(id, game);
		return game.getInfo();
	}

	async join(id: string, joiner: SocketWithUser) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		game.addPlayer(joiner);
		return game.getInfo();
	}

	async quit(id: string, quitter: SocketWithUser) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');

		if (game.players.length == 1) game.end();
		else if (game.players[0].socket.user.id == quitter.user.id)
			game.giveUp(game.players[1].socket);
		else if (game.players[1].socket.user.id == quitter.user.id)
			game.giveUp(game.players[0].socket);
		else throw new NotFoundException('Player not found');

		return game.getInfo();
	}

	async movePlayer(id: string, player: SocketWithUser, y: number) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		return game.movePlayer(player, y);
	}

	async save(localGame: LocalGame) {
		const game = new Game();
		game.visibility = localGame.options.visibility;
		game.mode = localGame.options.mode;
		game.maxDuration = localGame.options.maxDuration;
		game.maxScore = localGame.options.maxScore;
		game.winner = localGame.winner.user;
		game.winnerScore = localGame.winner.score;
		game.loser = localGame.loser.user;
		game.loserScore = localGame.loser.score;
		return this.gamesRepository.save(game);
	}

	async invite(id: string, inviter: SocketWithUser, inviteeId: number) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		const invitee = await this.usersService.findOne(inviteeId);
		if (!invitee) throw new NotFoundException('User not found');
		return game.invite(inviter.user, invitee);
	}

	async joinMatchmaking(user: SocketWithUser) {
		this.queue.push(user);
		return true;
	}

	@Interval(1000 / 60)
	loop(): void {
		this.games.forEach((game) => {
			game.update();
		});
	}

	@Interval(5000)
	async matchmaking(): Promise<void> {
		this.queue.forEach(async (socket) => {
			await this.matchmake(socket);
		});
	}

	async matchmake(socket: SocketWithUser) {
		// Find public games, in waiting state and with space
		const publicGames = Array.from(this.games.values()).filter(
			(game) =>
				game.options.visibility === 'public' &&
				game.state === 'waiting' &&
				game.players.length < 2,
		);

		// If there are public games, join the first one
		if (publicGames.length > 0) {
			await this.join(publicGames[0].id, socket);
			// Remove the user from the queue
			this.queue = this.queue.filter((user) => user !== socket);
		}
	}
}
