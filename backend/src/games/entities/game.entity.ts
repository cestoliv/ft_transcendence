import { User } from 'src/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinTable,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Game {
	@PrimaryGeneratedColumn()
	id: number;

	// Game settings
	@Column()
	visibility: 'public' | 'private';

	@Column()
	mode: 'classic' | 'hardcore';

	@Column()
	maxDuration: 1 | 2 | 3;

	@Column({ nullable: true })
	maxScore: 5 | 10 | 30 | null;

	// Scores
	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinTable()
	winner: User;

	@Column()
	winnerScore: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinTable()
	loser: User;

	@Column()
	loserScore: number;

	@Column()
	isDraw: boolean;
}
