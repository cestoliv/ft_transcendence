import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SocketWithUser } from 'src/types';

function p5Map(value, a, b, c, d) {
	// first map value from (a..b) to (0..1)
	value = (value - a) / (b - a);
	// then map it from (0..1) to (c..d) and return it
	return c + value * (d - c);
}

interface Player {
	socket: SocketWithUser;
	score: number;
	paddle: {
		x: number;
		y: number;
		radius: number;
	};
}

export class Game {
	id: string;
	started: boolean;
	players: Array<Player>;
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

	constructor(id: string, creator: SocketWithUser) {
		this.id = id;
		this.started = false;
		this.players = [];
		this.screen = {
			width: 512,
			height: 256,
		};
		this.resetBall();
		this.addPlayer(creator);
	}

	getInfo() {
		return {
			id: this.id,
			started: this.started,
			players: this.players.map((player) => ({
				id: player.socket.user.id,
				username: player.socket.user.username,
				score: player.score,
			})),
		};
	}

	resetBall() {
		this.ball = {
			x: this.screen.width / 2,
			y: this.screen.height / 2,
			radius: 5,
			speed: {
				x: Math.cos(Math.random() * Math.PI * 2) * 4,
				y: Math.sin(Math.random() * Math.PI * 2) * 4,
			},
		};
	}

	resetPlayers() {
		// Creator, left side
		if (this.players.length < 1) return;
		this.players[0].paddle.x = 10;
		this.players[0].paddle.y = this.screen.height / 2;
		this.players[0].paddle.radius = 30;
		// Opponent, right side
		if (this.players.length < 2) return;
		this.players[1].paddle.x = this.screen.width - 10;
		this.players[1].paddle.y = this.screen.height / 2;
		this.players[1].paddle.radius = 30;
	}

	addPlayer(socket: SocketWithUser) {
		if (this.players.length >= 2) throw new ForbiddenException('Game full');

		this.players.push({
			socket,
			score: 0,
			paddle: {
				x: 0,
				y: 0,
				radius: 30,
			},
		});
		this.resetPlayers();
		// Add user to room
		socket.join(`game_${this.id}`);

		if (this.players.length === 2) {
			this.started = true;
			this.resetBall();
		}
	}

	movePlayer(socket: SocketWithUser, y: number) {
		const player = this.players.find(
			(p) => p.socket.user.id === socket.user.id,
		);

		if (!player) throw new NotFoundException('Player not found');
		player.paddle.y = y;
		// Send new position to opponent but not to me
		const opponent = this.players.find(
			(p) => p.socket.user.id !== socket.user.id,
		);
		opponent.socket.emit('games_opponentMove', { y });

		console.log('movePlayer', socket.user.id, y);
	}

	update() {
		if (!this.started) return;
		// y: keep ball inside of vertical bounds
		if (this.ball.y < 10 || this.ball.y > this.screen.height - 10) {
			this.ball.speed.y *= -1;
		}
		this.ball.y += this.ball.speed.y;

		// x: opponent
		if (this.ball.x - this.ball.radius <= this.players[0].paddle.x) {
			if (
				this.ball.y > this.ball.y - this.players[0].paddle.radius &&
				this.ball.y <
					this.players[0].paddle.y + this.players[0].paddle.radius
			) {
				// opponent hits the ball
				const angle = this.ball.y - this.players[0].paddle.y;
				this.ball.speed.y = angle / 9;
				this.ball.speed.x = p5Map(
					Math.abs(angle),
					0,
					this.players[0].paddle.radius,
					3,
					9,
				);
			} else {
				// opponent misses the ball
				this.resetBall();
			}
		}

		// // x: me
		if (this.ball.x + this.ball.radius >= this.players[1].paddle.x) {
			if (
				this.ball.y >
					this.players[1].paddle.y - this.players[1].paddle.radius &&
				this.ball.y <
					this.players[1].paddle.y + this.players[1].paddle.radius
			) {
				// I hits the ball
				const angle = this.ball.y - this.players[1].paddle.y;
				this.ball.speed.y = angle / 9;
				this.ball.speed.x = -p5Map(
					Math.abs(angle),
					0,
					this.players[1].paddle.radius,
					3,
					9,
				);
			} else {
				// I misse the ball
				this.resetBall();
			}
		}
		this.ball.x += this.ball.speed.x;

		this.players[0].socket.emit('games_ballMove', {
			x: this.screen.width - this.ball.x,
			y: this.ball.y,
		});
		this.players[1].socket.emit('games_ballMove', {
			x: this.ball.x,
			y: this.ball.y,
		});
	}
}
