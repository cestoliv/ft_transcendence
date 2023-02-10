import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class UserFriend {
	@PrimaryColumn()
	inviterId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'inviterId' })
	inviter: User;

	@PrimaryColumn()
	inviteeId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'inviteeId' })
	invitee: User;

	@Column()
	accepted: boolean;
}
