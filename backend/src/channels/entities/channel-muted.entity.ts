import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Channel } from './channel.entity';

@Entity()
export class ChannelMutedUser {
	@PrimaryColumn()
	userId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'userId' })
	user: User;

	@PrimaryColumn()
	channelId: number;

	@ManyToOne(() => Channel, (channel) => channel.id, { eager: true })
	@JoinColumn({ name: 'channelId' })
	channel: Channel;

	@Column()
	until: Date;
}
