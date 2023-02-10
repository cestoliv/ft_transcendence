import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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
	// And where the friendship has been accepted
	get friends(): User[] {
		return this.invitedFriends
			.filter((friend) => friend.accepted)
			.map((friend) => friend.invitee)
			.concat(
				this.friendOf
					.filter((friend) => friend.accepted)
					.map((friend) => friend.inviter),
			);
	}
}
