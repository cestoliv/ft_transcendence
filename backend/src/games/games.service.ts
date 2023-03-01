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
import { Leaderboards, StatsUser } from './interfaces/leaderboards.interface';
import { User } from 'src/users/entities/user.entity';

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

	async getHistory(userId: number) {
		const user = await this.usersService.findOne(userId);
		if (!user) throw new NotFoundException('User not found');

		const games = await this.gamesRepository.find({
			where: [{ winner: { id: user.id } }, { loser: { id: user.id } }],
		});
		return games;
	}

	async getUserStats(userId: number) {
		const user = await this.usersService.findOne(userId);
		if (!user) throw new NotFoundException('User not found');

		// Get public games (visibility: public)
		const games = await this.gamesRepository.find({
			where: [
				{ winner: { id: user.id }, visibility: 'public' },
				{ loser: { id: user.id }, visibility: 'public' },
			],
		});

		// Stats
		const player: StatsUser = {
			user: user,
			stats: {
				games: games.length,
				wins: 0,
				losses: 0,
				winrate: 0,
			},
		};

		// Compute stats
		games.forEach((game) => {
			if (game.winner.id == user.id) player.stats.wins++;
			else if (game.loser.id == user.id) player.stats.losses++;
		});
		player.stats.winrate =
			(player.stats.wins / (player.stats.wins + player.stats.losses)) *
			100;

		return player;
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

	async info(id: string) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		return game.getInfo();
	}

	async joinMatchmaking(user: SocketWithUser) {
		this.queue.push(user);
		return true;
	}

	async leaveMatchmaking(user: SocketWithUser) {
		this.queue = this.queue.filter((socket) => socket !== user);
		return false;
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

	async updateElo(
		userId: number,
		opponentId: number,
		result: 0 | 0.5 | 1,
	): Promise<User> {
		const user = await this.usersService.findOne(userId);
		if (!user) throw new NotFoundException('User not found');
		const opponent = await this.usersService.findOne(opponentId);
		if (!opponent) throw new NotFoundException('User not found');

		// See: https://fr.wikipedia.org/wiki/Classement_Elo

		const publicGamesCount = await this.gamesRepository.count({
			where: [{ winner: { id: user.id } }, { loser: { id: user.id } }],
		});

		let K = 40;
		if (publicGamesCount > 30) K = 20;
		if (user.elo > 2400) K = 10;

		const victoryProbability =
			1 / (1 + 10 ** ((opponent.elo - user.elo) / 400));
		const newElo = user.elo + K * (result - victoryProbability);

		user.elo = Math.round(newElo);
		console.log(user);
		console.log('newElo: ', newElo, 'user.elo: ', user.elo, 'K: ', K);
		return await this.usersService.save(user);
	}

	async getLeaderboards(maxUsers = 10): Promise<Leaderboards> {
		const leaderboards: Leaderboards = {
			elo: [],
			mostPlayed: [],
		};
		const players = new Map<number, StatsUser>();

		// Winrate leaderboard, sorted by the better ratio of wins/losses in public games
		const publicGames = await this.gamesRepository.find({
			where: { visibility: 'public' },
		});
		// Get win and loss count for each player
		publicGames.forEach((game) => {
			if (!players.has(game.winner.id))
				players.set(game.winner.id, {
					user: game.winner,
					stats: {
						wins: 0,
						losses: 0,
						games: 0,
						winrate: 0,
					},
				});
			if (!players.has(game.loser.id))
				players.set(game.loser.id, {
					user: game.loser,
					stats: {
						wins: 0,
						losses: 0,
						games: 0,
						winrate: 0,
					},
				});

			players.get(game.winner.id).stats.wins++;
			players.get(game.loser.id).stats.losses++;
		});
		// Append the users to the leaderboard
		players.forEach((player) => {
			// Compute stats besed on wins and losses
			player.stats = {
				wins: player.stats.wins,
				losses: player.stats.losses,
				games: player.stats.wins + player.stats.losses,
				winrate:
					(player.stats.wins /
						(player.stats.wins + player.stats.losses)) *
					100,
			};

			leaderboards.elo.push(player.user);
			leaderboards.mostPlayed.push(player);
		});
		// Sort the leaderboard and remove the users that are not in the top
		leaderboards.elo.sort((a, b) => b.elo - a.elo).splice(maxUsers);
		leaderboards.mostPlayed
			.sort((a, b) => b.stats.games - a.stats.games)
			.splice(maxUsers);

		return leaderboards;
	}
}
