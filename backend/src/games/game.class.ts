import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { Server } from 'socket.io';
import { ConnectedClientsService } from 'src/base.gateway';
import { User } from 'src/users/entities/user.entity';
import { Status } from 'src/users/enums/status.enum';
import { GamesService } from './games.service';

interface LocalGamePlayer {
	user: User;
	score: number;
	paddle: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

export interface LocalGameInfo {
	id: string;
	state: 'waiting' | 'started' | 'ended' | 'saved';
	startAt: number | null;
	players: Array<{
		user: User;
		score: number;
	}>;
	paddleHeight: number;
}

export class GameOptions {
	// From creator
	maxDuration: 1 | 2 | 3;
	maxScore: 5 | 10 | 30 | null;
	mode: 'classic' | 'hardcore';
	visibility: 'public' | 'private';

	// Computed from mode
	speed: 3 | 5;
	paddleHeight: 10 | 30;

	constructor(
		maxDuration: 1 | 2 | 3,
		maxScore: 5 | 10 | 30 | null,
		mode: 'classic' | 'hardcore',
		visibility: 'public' | 'private',
	) {
		if (![1, 2, 3].includes(maxDuration))
			throw new BadRequestException('Invalid maxDuration');
		this.maxDuration = maxDuration;

		if (![5, 10, 30, null].includes(maxScore))
			throw new BadRequestException('Invalid maxScore');
		this.maxScore = maxScore;

		if (!['classic', 'hardcore'].includes(mode))
			throw new BadRequestException('Invalid mode');
		this.mode = mode;

		if (!['public', 'private'].includes(visibility))
			throw new BadRequestException('Invalid visibility');
		this.visibility = visibility;

		if (this.mode === 'classic') {
			this.speed = 3;
			this.paddleHeight = 30;
		} else if (this.mode === 'hardcore') {
			this.speed = 5;
			this.paddleHeight = 10;
		}
	}
}

function p5Map(value, a, b, c, d) {
	// first map value from (a..b) to (0..1)
	value = (value - a) / (b - a);
	// then map it from (0..1) to (c..d) and return it
	return c + value * (d - c);
}

function degRad(degrees) {
	return degrees * (Math.PI / 180);
}

export class LocalGame {
	gamesService: GamesService;
	connectedClientsService: ConnectedClientsService;
	server: Server;

	id: string;
	state: 'waiting' | 'started' | 'ended' | 'saved';
	startAt: Date;
	players: Array<LocalGamePlayer>;
	invited: Array<number>; // array of user ids
	ball: {
		x: number;
		y: number;
		radius: number;
		speed: {
			x: number;
			y: number;
		};
	};
	screen: {
		width: number;
		height: number;
	};
	options: GameOptions;

	// After
	winner: {
		user: User;
		score: number;
	};
	loser: {
		user: User;
		score: number;
	};
	creatorId: number;
	isDraw: boolean;

	constructor(
		id: string,
		creatorId: number,
		options: GameOptions,
		gamesService: GamesService,
		connectedClientsService: ConnectedClientsService,
		server: Server,
	) {
		this.gamesService = gamesService;
		this.connectedClientsService = connectedClientsService;
		this.server = server;

		this.id = id;
		this.state = 'waiting';
		this.startAt = null;
		this.players = [];
		this.invited = [];
		this.options = options;
		this.screen = {
			width: 512,
			height: 256,
		};
		this.winner = null;
		this.loser = null;
		this.creatorId = creatorId;

		// Ball
		this.resetBall();
	}

	async initGame() {
		await this.addPlayer(this.creatorId);
		// Send updated games available to all users
		this.server.emit(
			'games_available',
			await this.gamesService.getAvailableGamesInfo(),
		);
	}

	getInfo(): LocalGameInfo {
		return {
			id: this.id,
			state: this.state,
			startAt: this.startAt ? this.startAt.getTime() : null,
			players: this.players.map((player) => ({
				user: player.user,
				score: player.score,
			})),
			paddleHeight: this.options.paddleHeight,
		};
	}

	resetBall() {
		// P5JS version: random(-PI/4, PI/4)
		const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
		this.ball = {
			x: this.screen.width / 2,
			y: this.screen.height / 2,
			radius: 5,
			speed: {
				x: Math.cos(angle) * this.options.speed,
				y: Math.sin(angle) * this.options.speed,
			},
		};
		if (Math.random() > 0.5) this.ball.speed.x *= -1;
	}

	resetPlayers() {
		// Creator, left side
		if (this.players.length < 1) return;
		this.players[0].paddle.x = 10 - 2;
		this.players[0].paddle.y = this.screen.height / 2;
		this.players[0].paddle.width = 2;
		this.players[0].paddle.height = this.options.paddleHeight;
		// Opponent, right side
		if (this.players.length < 2) return;
		this.players[1].paddle.x = this.screen.width - 10;
		this.players[1].paddle.y = this.screen.height / 2;
		this.players[1].paddle.width = 2;
		this.players[1].paddle.height = this.options.paddleHeight;
	}

	async invite(inviterId: number, inviteeId: number) {
		const invitee = await this.gamesService.usersService.findOne(inviteeId);
		if (!invitee) throw new NotFoundException('User not found');

		// Check that creator doesn't invite himself
		if (this.players[0].user.id === invitee.id)
			throw new ConflictException('You cannot invite yourself');
		// Check that inviter is the creator
		if (this.players[0].user.id !== inviterId)
			throw new ForbiddenException('Only the creator can invite');
		// Check if the invitee is not already in the game
		if (this.players.find((player) => player.user.id === invitee.id))
			throw new ConflictException('User is already in the game');
		// Check if user is already invited
		if (this.invited.includes(invitee.id))
			throw new ConflictException('User is already invited');
		// Check if game is waiting for players and is not full
		if (this.state !== 'waiting' || this.players.length >= 2)
			throw new ForbiddenException('Game is already full');
		// Check if user is online
		if (!this.connectedClientsService.has(invitee.id))
			throw new ForbiddenException('User is offline');
		// Check that the game is private
		if (this.options.visibility !== 'private')
			throw new ForbiddenException('Game is not private');

		this.invited.push(invitee.id);

		// Send notification to invitee
		this.connectedClientsService
			.get(inviteeId)
			.emit('game_invitation', this.getInfo());
		return invitee;
	}

	async addPlayer(joinerId: number) {
		const user = await this.gamesService.usersService.findOne(joinerId);
		if (!user) throw new NotFoundException('User not found');

		if (this.players.length >= 2) throw new ForbiddenException('Game full');
		if (
			this.options.visibility === 'private' &&
			!this.invited.find((id) => id === user.id) &&
			this.players.length !== 0 // Creator can join
		)
			throw new ForbiddenException('User not invited');
		// Check if user is already in the game
		if (this.players.find((player) => player.user.id === user.id))
			throw new ConflictException('User is already in the game');

		this.players.push({
			user,
			score: 0,
			paddle: { x: 0, y: 0, width: 0, height: 0 },
		});
		this.resetPlayers();
		// Add user to room
		this.connectedClientsService.get(joinerId).join(`game_${this.id}`);

		if (this.players.length === 2) {
			await this.start();
		}
	}

	async start() {
		// Delay start by 3 seconds
		this.startAt = new Date();
		this.startAt.setSeconds(this.startAt.getSeconds() + 3);
		this.players.forEach((player) => {
			this.connectedClientsService
				.get(player.user.id)
				.emit('games_start', this.getInfo());
		});
		setTimeout(() => {
			this.state = 'started';
			this.resetBall();

			// Update users status
			this.players.forEach(async (player) => {
				this.gamesService.usersService
					.changeStatus(player.user.id, Status.Playing)
					.catch(() => {
						// Ignore error
					});
			});
			setTimeout(() => {
				this.isDraw = this.players[0].score === this.players[1].score;
				this.end();
			}, this.options.maxDuration * 1000 * 60);
		}, 3000);

		// Send updated available games to all users
		this.server.emit(
			'games_available',
			await this.gamesService.getAvailableGamesInfo(),
		);
	}

	async end(winner: User | null = null) {
		if (this.state === 'ended') return;

		if (this.state === 'waiting') {
			this.state = 'ended';
			this.winner = null;
			this.players.forEach((player) => {
				this.connectedClientsService
					.get(player.user.id)
					.leave(`game_${this.id}`);
			});
			this.gamesService.games.delete(this.id);
			// Send updated available games to all users
			this.server.emit(
				'games_available',
				await this.gamesService.getAvailableGamesInfo(),
			);
			if (this.players.length === 2) {
				this.connectedClientsService
					.get(this.players[0].user.id)
					.emit('games_end', {
						winner: this.winner,
						score: this.players[0].score,
						opponent_score: this.players[1].score,
					});
				this.connectedClientsService
					.get(this.players[1].user.id)
					.emit('games_end', {
						winner: this.winner,
						score: this.players[1].score,
						opponent_score: this.players[0].score,
					});
			}
			return;
		}
		this.state = 'ended';

		this.winner = {
			user: winner,
			score: 0,
		};

		// If winner is not null, then the other player gave up
		if (!winner) {
			// If winner is null, then we need to check the score
			this.winner.user =
				this.players[0].score > this.players[1].score
					? this.players[0].user
					: this.players[1].user;
			// On draw, the winenr is the creator and the loser is the joiner
			if (this.players[0].score === this.players[1].score)
				this.winner = this.players[0];
		}

		// Set winner score and loser
		this.winner.score = this.players.find(
			(player) => player.user.id === this.winner.user.id,
		).score;
		const loser = this.players.find(
			(player) => player.user.id !== this.winner.user.id,
		);
		this.loser = {
			user: loser.user,
			score: loser.score,
		};

		// Send score to players
		this.connectedClientsService
			.get(this.players[0].user.id)
			.emit('games_end', {
				winner: this.winner,
				score: this.players[0].score,
				opponent_score: this.players[1].score,
			});
		this.connectedClientsService
			.get(this.players[1].user.id)
			.emit('games_end', {
				winner: this.winner,
				score: this.players[1].score,
				opponent_score: this.players[0].score,
			});
		// Send to watchers
		this.server.to(`game_watch_${this.id}`).emit('games_watch_end', {
			winner: this.winner,
			creator_score: this.players[0].score,
			opponent_score: this.players[1].score,
		});

		// Remove players from room and update their status
		this.players.forEach(async (player) => {
			this.connectedClientsService
				.get(player.user.id)
				.leave(`game_${this.id}`);
			// Update user status
			this.gamesService.usersService
				.changeStatus(player.user.id, Status.Online)
				.catch(() => {
					// Ignore error
				});
		});

		// Save game to database
		this.gamesService.save(this);

		// Compute elo
		if (this.options.visibility === 'public') {
			this.players.forEach(async (player) => {
				const opponent = this.players.find(
					(p) => p.user.id !== player.user.id,
				);
				let gameResult: 0 | 0.5 | 1 = 0; // 0 = loss, 0.5 = draw, 1 = win
				if (this.isDraw) gameResult = 0.5;
				else if (this.winner.user.id == player.user.id) gameResult = 1;

				await this.gamesService.updateElo(
					player.user.id,
					player.user.elo,
					opponent.user.elo,
					gameResult,
				);
			});
		}

		// Remove game from games array
		this.gamesService.games.delete(this.id);
		// Send updated available games to all users
		this.server.emit(
			'games_available',
			await this.gamesService.getAvailableGamesInfo(),
		);
	}

	async giveUp(quitterId: number) {
		if (this.state != 'started') {
			this.state = 'ended';
			// Delete from games array
			this.gamesService.games.delete(this.id);
			// Send updated available games to all users
			this.server.emit(
				'games_available',
				await this.gamesService.getAvailableGamesInfo(),
			);
			return;
		}
		const player = this.players.find((p) => p.user.id === quitterId);
		if (!player) throw new NotFoundException('Player not found');
		const opponent = this.players.find((p) => p.user.id !== quitterId);

		// End the game with the opponent as winner
		this.isDraw = false;
		this.end(opponent.user);
	}

	movePlayer(playerId: number, y: number) {
		if (this.state != 'started') return;
		const player = this.players.find((p) => p.user.id === playerId);

		if (!player) throw new NotFoundException('Player not found');
		player.paddle.y = y;
		// Send new position to opponent but not to me
		const opponent = this.players.find((p) => p.user.id !== playerId);
		this.connectedClientsService
			.get(opponent.user.id)
			.emit('games_opponentMove', { y });

		// Send new position to watchers
		let event = 'games_watch_opponentMove';
		if (playerId === this.players[0].user.id)
			event = 'games_watch_creatorMove';
		this.server.to(`game_watch_${this.id}`).emit(event, { y });
	}

	addScore(player: LocalGamePlayer) {
		player.score++;
		this.connectedClientsService
			.get(this.players[0].user.id)
			.emit('games_score', {
				you: this.players[0].score,
				opponent: this.players[1].score,
			});
		this.connectedClientsService
			.get(this.players[1].user.id)
			.emit('games_score', {
				you: this.players[1].score,
				opponent: this.players[0].score,
			});
		// Send new score to watchers
		this.server.to(`game_watch_${this.id}`).emit('games_watch_score', {
			creator: this.players[0].score,
			opponent: this.players[1].score,
		});

		// Check score
		if (this.options.maxScore && player.score >= this.options.maxScore) {
			this.isDraw = false;
			this.end();
		}

		this.resetBall();
		this.resetPlayers();
	}

	// Return the new ball speed (after bounce on paddle)
	_paddleBounce(
		paddle: LocalGame['players'][0]['paddle'],
		angle1: number,
		angle2: number,
	): {
		x: number;
		y: number;
	} {
		const diff = paddle.y - this.ball.y;
		const angle = p5Map(diff, 0, paddle.height, angle1, angle2);
		return {
			x: Math.cos(angle) * this.options.speed,
			y: Math.sin(angle) * this.options.speed,
		};
	}

	update() {
		if (this.state != 'started') return;
		// y: keep ball inside of vertical bounds
		if (this.ball.y < 10 || this.ball.y > this.screen.height - 10) {
			this.ball.speed.y *= -1;
		}
		this.ball.y += this.ball.speed.y;

		// check collision between ball and creator paddle
		let pX = this.players[0].paddle.x - this.players[0].paddle.width / 2;
		let pY = this.players[0].paddle.y - this.players[0].paddle.height / 2;
		if (
			!(
				this.ball.x + this.ball.radius < pX ||
				this.ball.x - this.ball.radius >
					pX + this.players[0].paddle.width ||
				this.ball.y + this.ball.radius < pY ||
				this.ball.y - this.ball.radius >
					pY + this.players[0].paddle.height
			)
		)
			this.ball.speed = this._paddleBounce(
				this.players[0].paddle,
				-degRad(45),
				degRad(45),
			);

		// check collision between ball and opponent paddle
		pX = this.players[1].paddle.x - this.players[1].paddle.width / 2;
		pY = this.players[1].paddle.y - this.players[1].paddle.height / 2;
		if (
			!(
				this.ball.x + this.ball.radius < pX ||
				this.ball.x - this.ball.radius >
					pX + this.players[1].paddle.width ||
				this.ball.y + this.ball.radius < pY ||
				this.ball.y - this.ball.radius >
					pY + this.players[1].paddle.height
			)
		)
			this.ball.speed = this._paddleBounce(
				this.players[1].paddle,
				degRad(225),
				degRad(135),
			);

		// creator scores
		if (this.ball.x - this.ball.radius <= 0) this.addScore(this.players[1]);
		// opponent scores
		if (this.ball.x + this.ball.radius >= this.screen.width)
			this.addScore(this.players[0]);

		this.ball.x += this.ball.speed.x;

		this.connectedClientsService
			.get(this.players[0].user.id)
			.emit('games_ballMove', {
				x: this.screen.width - this.ball.x,
				y: this.ball.y,
			});
		this.connectedClientsService
			.get(this.players[1].user.id)
			.emit('games_ballMove', {
				x: this.ball.x,
				y: this.ball.y,
			});

		// Send state to watchers
		this.server.to(`game_watch_${this.id}`).emit('games_watch_ballMove', {
			x: this.screen.width - this.ball.x,
			y: this.ball.y,
		});
	}
}
