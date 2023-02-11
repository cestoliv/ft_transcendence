import {
	AfterLoad,
	Column,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { UserFriend } from './user-friend.entity';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true, nullable: true })
	id42: number;

	@Column({ unique: true })
	username: string;

	@Column({ nullable: true, select: false })
	otp: string;

	@OneToMany(() => UserFriend, (userFriend) => userFriend.inviter)
	invitedFriends: UserFriend[];

	@OneToMany(() => UserFriend, (userFriend) => userFriend.invitee)
	friendOf: UserFriend[];

	// List of friends where this user is the inviter or the invitee
	friends: User[];
	@AfterLoad()
	updateFriends() {
		if (!this.invitedFriends) this.invitedFriends = [];
		if (!this.friendOf) this.friendOf = [];

		this.friends = this.invitedFriends
			.filter((friend) => friend.accepted)
			.map((friend) => friend.invitee)
			.concat(
				this.friendOf
					.filter((friend) => friend.accepted)
					.map((friend) => friend.inviter),
			);
	}
}
