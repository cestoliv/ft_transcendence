import { User } from 'src/users/entities/user.entity';

export interface StatsUser {
	user: User;
	stats: {
		games: number;
		wins: number;
		losses: number;
		winrate: number;
	};
}

export interface Leaderboards {
	elo: User[];
	mostPlayed: StatsUser[];
}
