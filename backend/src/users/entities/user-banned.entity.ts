import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class BannedUser {
	@PrimaryColumn()
	userId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'userId' })
	user: User;

	@PrimaryColumn()
	bannedId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'bannedId' })
	banned: User;

	@Column()
	until: Date;
}
