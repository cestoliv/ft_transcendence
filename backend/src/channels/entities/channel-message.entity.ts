import { User } from 'src/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Channel } from './channel.entity';

@Entity()
export class ChannelMessage {
	@PrimaryGeneratedColumn()
	id: number;

	@PrimaryColumn()
	senderId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'senderId' })
	sender: User;

	@PrimaryColumn()
	channelId: number;

	@ManyToOne(() => Channel, (channel) => channel.id, { eager: true })
	@JoinColumn({ name: 'channelId' })
	channel: Channel;

	@Column()
	message: string;

	@Column()
	sentAt: Date;
}
