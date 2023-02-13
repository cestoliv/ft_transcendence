import { User } from 'src/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class UserMessage {
	@PrimaryGeneratedColumn()
	id: number;

	@PrimaryColumn()
	senderId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'senderId' })
	sender: User;

	@PrimaryColumn()
	receiverId: number;

	@ManyToOne(() => User, (user) => user.id, { eager: true })
	@JoinColumn({ name: 'receiverId' })
	receiver: User;

	@Column()
	message: string;

	@Column()
	sentAt: Date;
}
