import { User } from 'src/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Visibility } from '../enums/visibility.enum';
import { ChannelBannedUser } from './channel-banned.entity';
import { ChannelInvitedUser } from './channel-invited.entity';
import { ChannelMutedUser } from './channel-muted.entity';

@Entity()
export class Channel {
	@PrimaryGeneratedColumn()
	id: number;

	// Channel identifier
	@Column({ unique: true })
	code: string;

	// Channel owner, Many-to-one relationship with User
	@ManyToOne(() => User, (user) => user.id, { eager: true })
	owner: User;

	@Column()
	name: string;

	@Column()
	visibility: Visibility;

	// Password, if channel is password protected
	@Column({ nullable: true, select: false })
	password_hash: string;

	// Admins array, Many-to-many relationship with User
	@ManyToMany(() => User, (user) => user.id, { eager: true })
	@JoinTable()
	admins: User[];

	// Members array, Many-to-many relationship with User
	@ManyToMany(() => User, (user) => user.id, { eager: true })
	@JoinTable()
	members: User[];

	// Banned members array, One-to-many relationship with ChannelBannedUser
	@OneToMany(() => ChannelBannedUser, (banned) => banned.channel)
	banned: ChannelBannedUser[];

	// Muted members array, One-to-many relationship with ChannelMutedUser
	@OneToMany(() => ChannelMutedUser, (banned) => banned.channel)
	muted: ChannelMutedUser[];

	// Invited members array, One-to-many relationship with ChannelInvitedUser
	@OneToMany(() => ChannelInvitedUser, (invited) => invited.channel)
	invited: ChannelInvitedUser[];
}
