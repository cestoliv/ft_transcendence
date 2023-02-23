import {
	AfterLoad,
	Column,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { BannedUser } from './user-banned.entity';
import { UserFriend } from './user-friend.entity';
import { MutedUser } from './user-muted.entity';

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

	// Banned users array, One-to-many relationship with BannedUser
	@OneToMany(() => BannedUser, (banned) => banned.user)
	banned: BannedUser[];

	// Muted users array, One-to-many relationship with MutedUser
	@OneToMany(() => MutedUser, (muted) => muted.user)
	muted: MutedUser[];

	// Profile picture URL
	@Column({ select: false, nullable: true })
	profile_picture: string;

	@AfterLoad()
	getProfilePicture() {
		this.profile_picture = `/api/v1/users/profile-picture/${this.id}`;
	}

	// 42 Profile picture URL
	@Column({ select: false, nullable: true })
	profile_picture_42: string;
}
