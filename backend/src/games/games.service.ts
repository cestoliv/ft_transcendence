import { Injectable, NotFoundException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { SocketWithUser } from 'src/types';
import { Game } from './game.class';

@Injectable()
export class GamesService {
	public games = new Map<string, Game>();

	async create(creator: SocketWithUser) {
		const id = uuidv4();
		const game = new Game(id, creator);
		this.games.set(id, game);
		return game.getInfo();
	}

	async join(id: string, joiner: SocketWithUser) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		game.addPlayer(joiner);
		return game.getInfo();
	}

	async movePlayer(id: string, player: SocketWithUser, y: number) {
		const game = this.games.get(id);
		if (!game) throw new NotFoundException('Game not found');
		game.movePlayer(player, y);
	}

	@Interval(1000 / 60)
	loop(): void {
		this.games.forEach((game) => {
			game.update();
		});
	}
}
