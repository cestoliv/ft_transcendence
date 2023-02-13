import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class MutedUser {
	@PrimaryColumn()
	userId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'userId' })
	user: User;

	@PrimaryColumn()
	mutedId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'mutedId' })
	muted: User;

	@Column()
	until: Date;
}
