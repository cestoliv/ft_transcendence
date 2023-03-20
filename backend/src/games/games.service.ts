import {
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { GameOptions, LocalGame } from './game.class';
import { Game } from './entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { ConnectedClientsService } from 'src/base.gateway';
import { Leaderboards, StatsUser } from './interfaces/leaderboards.interface';
import { User } from 'src/users/entities/user.entity';
import { Server } from 'socket.io';

@Injectable()
export class GamesService {
	constructor(
		@Inject(forwardRef(() => UsersService))
		readonly usersService: UsersService,
		@InjectRepository(Game)
		private readonly gamesRepository: Repository<Game>,
	) {}

	public games = new Map<string, LocalGame>(); // Game ID -> Game
	public queue: Array<number> = []; // User IDs

	async create(
		creatorId: number,
		payload: any,
		connectedClientsService: ConnectedClientsService,
		server: Server,
	) {
		// Check if user is already in a game
		const ingame = await this.findGame(creatorId)
			.then(() => {
				return true;
			})
			.catch(() => {
				return false;
			});
		if (ingame) throw new ConflictException('User is already in a game');

		// Check if user is already in the queue and leave queue if so
		if (this.queue.includes(creatorId)) this.leaveMatchmaking(creatorId);

		const options = new GameOptions(
			payload.maxDuration,
			payload.maxScore,
			payload.mode,
			payload.visibility,
		);

		const id = uuidv4();
		const game = new LocalGame(
			id,
			creatorId,
			options,
			this,
			connectedClientsService,
			server,
		);
		this.games.set(id, game);
		return game;
	}

	// Find game from it's id or from a user id
	async findGame(id: number | string) {
		if (typeof id === 'number') {
			for (const game of this.games.values()) {
				if (game.players.length >= 1 && game.players[0].user.id == id)
					return game;
				if (game.players.length >= 2 && game.players[1].user.id == id)
					return game;
			}
		} else return this.games.get(id);
		throw new NotFoundException('Game not found');
	}

	async findStartedGame(id: number | string) {
		const game = await this.findGame(id);
		if (game.state != 'started')
			throw new NotFoundException('Game not found');
		return game;
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
			if (!game.isDraw) {
				if (game.winner.id == user.id) player.stats.wins++;
				else if (game.loser.id == user.id) player.stats.losses++;
			}
		});
		player.stats.winrate =
			(player.stats.wins / (player.stats.wins + player.stats.losses)) *
			100;

		return player;
	}

	async join(id: string, joinerId: number) {
		// Check if user is already in a game
		const ingame = await this.findGame(joinerId)
			.then(() => {
				return true;
			})
			.catch(() => {
				return false;
			});
		if (ingame) throw new ConflictException('User is already in a game');

		// Check if user is already in the queue and leave queue if so
		if (this.queue.includes(joinerId)) this.leaveMatchmaking(joinerId);

		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		await game.addPlayer(joinerId);
		return game.getInfo();
	}

	async quit(id: string, quitterId: number) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');

		if (game.players.length == 1) game.end();
		else if (game.players.length == 2 && game.state == 'waiting')
			game.end();
		else if (game.players[0].user.id == quitterId)
			await game.giveUp(game.players[1].user.id);
		else if (game.players[1].user.id == quitterId)
			await game.giveUp(game.players[0].user.id);
		else throw new NotFoundException('Player not found');

		return game.getInfo();
	}

	async movePlayer(id: string, playerId: number, y: number) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		return game.movePlayer(playerId, y);
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
		game.isDraw = localGame.isDraw;
		return this.gamesRepository.save(game);
	}

	async invite(id: string, inviterId: number, inviteeId: number) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		return game.invite(inviterId, inviteeId);
	}

	async info(id: string) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		return game.getInfo();
	}

	async joinMatchmaking(userId: number) {
		// Check if user is already in a game
		const ingame = await this.findGame(userId)
			.then(() => {
				return true;
			})
			.catch(() => {
				return false;
			});
		if (ingame) throw new ConflictException('User is already in a game');

		// Check if user is already in the queue
		if (this.queue.includes(userId)) return true;
		this.queue.push(userId);
		return true;
	}

	async leaveMatchmaking(userId: number) {
		this.queue = this.queue.filter((id) => id != userId);
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
		this.queue.forEach(async (userId) => {
			await this.matchmake(userId);
		});
	}

	async getAvailableGames() {
		return Array.from(this.games.values()).filter(
			(game) =>
				game.options.visibility === 'public' &&
				game.state === 'waiting' &&
				game.players.length < 2,
		);
	}

	async getAvailableGamesInfo() {
		return (await this.getAvailableGames()).map((game) => game.getInfo());
	}

	async matchmake(userId: number) {
		// Find public games, in waiting state and with space
		const publicGames = await this.getAvailableGames();

		// If there are public games, join the first one
		if (publicGames.length > 0) {
			await this.join(publicGames[0].id, userId)
				.then(() => {
					// Remove the user from the queue
					this.queue = this.queue.filter((id) => id != userId);
				})
				.catch(() => {
					// Do nothing
				});
		}
	}

	async updateElo(
		userId: number,
		userElo: number,
		opponentElo: number,
		result: 0 | 0.5 | 1,
	): Promise<User> {
		const user = await this.usersService.findOne(userId);
		if (!user) throw new NotFoundException('User not found');

		// See: https://fr.wikipedia.org/wiki/Classement_Elo

		const publicGamesCount = await this.gamesRepository.count({
			where: [{ winner: { id: userId } }, { loser: { id: userId } }],
		});

		let K = 40;
		if (publicGamesCount > 30) K = 20;
		if (userElo > 2400) K = 10;

		const victoryProbability =
			1 / (1 + 10 ** ((opponentElo - userElo) / 400));
		const newElo = userElo + K * (result - victoryProbability);

		user.elo = Math.round(newElo);
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
			if (!game.isDraw) {
				players.get(game.winner.id).stats.wins++;
				players.get(game.loser.id).stats.losses++;
			}
			players.get(game.winner.id).stats.games++;
			players.get(game.loser.id).stats.games++;
		});
		// Append the users to the leaderboard
		players.forEach((player) => {
			// Compute stats besed on wins and losses
			player.stats = {
				wins: player.stats.wins,
				losses: player.stats.losses,
				games: player.stats.games,
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
