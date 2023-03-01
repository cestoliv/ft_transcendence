import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { authenticator } from 'otplib';
import { pipeline, Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import Avatar from 'avatar-builder';
import { FindOptionsSelect, LessThan, Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BannedUser } from './entities/user-banned.entity';
import { UserFriend } from './entities/user-friend.entity';
import { MutedUser } from './entities/user-muted.entity';
import { User } from './entities/user.entity';
import { UserMessage } from './entities/user.message.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		@InjectRepository(UserFriend)
		private readonly userFriendsRepository: Repository<UserFriend>,
		@InjectRepository(BannedUser)
		private readonly bannedUsersRepository: Repository<BannedUser>,
		@InjectRepository(MutedUser)
		private readonly mutedUsersRepository: Repository<MutedUser>,
		@InjectRepository(UserMessage)
		private readonly userMessagesRepository: Repository<UserMessage>,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
	) {}

	create(createUserDto: CreateUserDto) {
		const user = new User();
		user.id42 = createUserDto.id42;
		user.username = createUserDto.username;
		user.displayName = createUserDto.displayName || 'Unnamed';
		user.elo = 1000;
		user.otp = createUserDto.otp;
		user.profile_picture_42 = createUserDto.profile_picture_42;

		return this.usersRepository.save(user);
	}

	findAll() {
		return this.usersRepository.find({
			relations: ['invitedFriends', 'friendOf', 'banned', 'muted'],
		});
	}

	findOne(
		id: number,
		{ withTotp = false, with42ProfilePicture = false } = {},
	) {
		const select = ['id', 'id42', 'username', 'displayName', 'elo'];
		if (withTotp) select.push('otp');
		if (with42ProfilePicture) select.push('profile_picture_42');

		return this.usersRepository.findOne({
			where: { id },
			select: select as FindOptionsSelect<User>,
			relations: ['invitedFriends', 'friendOf', 'banned', 'muted'],
		});
	}

	findOneBy42Id(
		id42: number,
		{ withTotp = false, with42ProfilePicture = false } = {},
	) {
		const select = ['id', 'id42', 'username', 'displayName', 'elo'];
		if (withTotp) select.push('otp');
		if (with42ProfilePicture) select.push('profile_picture_42');

		return this.usersRepository.findOne({
			where: { id42 },
			select: select as FindOptionsSelect<User>,
			relations: ['invitedFriends', 'friendOf', 'banned', 'muted'],
		});
	}

	findOneByUsername(
		username: string,
		{ withTotp = false, with42ProfilePicture = false } = {},
	) {
		const select = ['id', 'id42', 'username', 'displayName', 'elo'];
		if (withTotp) select.push('otp');
		if (with42ProfilePicture) select.push('profile_picture_42');

		return this.usersRepository.findOne({
			where: { username },
			select: select as FindOptionsSelect<User>,
			relations: ['invitedFriends', 'friendOf', 'banned', 'muted'],
		});
	}

	async update(updater: User, id: number, updateUserDto: UpdateUserDto) {
		const user = await this.findOne(id);
		if (!user) throw new NotFoundException('User not found');
		if (user.id !== updater.id)
			throw new ForbiddenException('You can only update your own user');

		user.username = updateUserDto.username;
		user.displayName = updateUserDto.displayName;
		user.otp = updateUserDto.otp;

		return this.save(user)
			.then((user) => user)
			.catch((error) => {
				if (error.code === '23505') {
					throw new ConflictException('Username already taken');
				} else throw error;
			});
	}

	async save(user: User) {
		delete user.invitedFriends;
		delete user.friendOf;
		delete user.friends;
		delete user.banned;
		delete user.muted;
		await this.usersRepository.save(user);
		return this.findOne(user.id);
	}

	remove(id: number) {
		return this.usersRepository.delete({ id });
	}

	async enableTotp(user: User): Promise<{ secret: string; url: string }> {
		// Generate TOTP secret
		const secret = authenticator.generateSecret();
		const url = authenticator.keyuri('', 'Transcendence', secret);

		// Update user TOTP secret
		await this.update(user, user.id, {
			otp: secret,
		});

		return { secret, url };
	}

	async getUserFromSocket(socket: any): Promise<User> {
		const cookie = socket.handshake.headers.cookie;
		if (!cookie)
			throw new WsException(
				'No cookie found in socket handshake headers',
			);

		const parsedCookie = parse(cookie);
		if (!parsedCookie.hasOwnProperty('bearer')) {
			throw new WsException(
				'No bearer token found in socket handshake headers',
			);
		}

		try {
			const user = await this.authService.getUserFromToken(
				parsedCookie.bearer,
			);
			return user;
		} catch (error) {
			throw new WsException(
				'Invalid bearer token found in socket handshake headers',
			);
		}
	}

	async inviteFriend(inviter: User, newFriendName: string) {
		const newFriend = await this.findOneByUsername(newFriendName);
		if (!newFriend) throw new NotFoundException('User not found');

		// Check if already invited or already friend
		if (newFriend.friends.includes(inviter)) {
			throw new ConflictException(
				'User already invited or already friend',
			);
		}

		// Check if newFriend banned inviter
		const banned = await this.bannedUsersRepository.findOne({
			where: { userId: newFriend.id, bannedId: inviter.id },
		});
		if (banned) {
			if (banned.until > new Date())
				throw new ForbiddenException('You have been banned');
			else
				await this.bannedUsersRepository.delete({
					userId: newFriend.id,
					bannedId: inviter.id,
				});
		}

		const newFriendship = new UserFriend();
		newFriendship.inviter = inviter;
		newFriendship.invitee = newFriend;
		newFriendship.accepted = false;

		return this.userFriendsRepository.save(newFriendship);
	}

	async acceptFriendship(invitee: User, inviterId: number) {
		const inviter = await this.findOne(inviterId);
		if (!inviter) throw new NotFoundException('User not found');

		const friendship = await this.userFriendsRepository.findOne({
			where: { inviterId, inviteeId: invitee.id },
		});
		if (!friendship)
			throw new NotFoundException('Friendship request not found');
		if (friendship.accepted)
			throw new ConflictException('Friendship already accepted');

		friendship.accepted = true;

		return this.userFriendsRepository.save(friendship);
	}

	async removeFriendship(user: User, friendId: number) {
		const friend = await this.findOne(friendId);
		if (!friend) throw new NotFoundException('User not found');

		const friendship = await this.userFriendsRepository.findOne({
			where: [
				{ inviterId: user.id, inviteeId: friend.id },
				{ inviterId: friend.id, inviteeId: user.id },
			],
		});
		if (!friendship) throw new NotFoundException('Friendship not found');

		this.userFriendsRepository.delete({
			inviterId: friendship.inviterId,
			inviteeId: friendship.inviteeId,
		});
		return friendship;
	}

	async ban(banner: User, userToBanId: number, until: Date) {
		const userToBan = await this.findOne(userToBanId);
		if (!userToBan) throw new NotFoundException('User not found');

		// Create new banned user (or update existing one)
		const banned = new BannedUser();
		banned.user = banner;
		banned.banned = userToBan;
		banned.until = until;

		// Remove friendship
		await this.removeFriendship(userToBan, banner.id).catch(() => {
			// Ignore exceptions
		});

		return this.bannedUsersRepository.save(banned);
	}

	async mute(muter: User, userToMuteId: number, until: Date) {
		const userToMute = await this.findOne(userToMuteId);
		if (!userToMute) throw new NotFoundException('User not found');

		// Create new muted user (or update existing one)
		const muted = new MutedUser();
		muted.user = muter;
		muted.muted = userToMute;
		muted.until = until;

		return this.mutedUsersRepository.save(muted);
	}

	async sendMessage(sender: User, receiverId: number, message: string) {
		const receiver = await this.findOne(receiverId);
		if (!receiver) throw new NotFoundException('User not found');

		// Check if users are friends
		if (!receiver.friends.find((friend) => friend.id === sender.id))
			throw new ForbiddenException(
				'You can only send messages to friends',
			);

		// Check if receiver muted sender
		const muted = receiver.muted.find(
			(mutedUser) => mutedUser.muted.id === sender.id,
		);
		if (muted) {
			if (muted.until > new Date())
				throw new ForbiddenException('You are muted by this user');
			else
				await this.mutedUsersRepository.delete({
					userId: receiver.id,
					mutedId: sender.id,
				});
		}

		// Create new chat message
		const newMessage = new UserMessage();
		newMessage.sender = sender;
		newMessage.receiver = receiver;
		newMessage.message = message;
		newMessage.sentAt = new Date();

		return this.userMessagesRepository.save(newMessage);
	}

	async getMessages(user: User, contactId: number, before: Date) {
		const contact = await this.findOne(contactId);
		if (!contact) throw new NotFoundException('User not found');

		// Check if users are friends
		if (!contact.friends.find((friend) => friend.id === user.id))
			throw new ForbiddenException(
				'You can only get messages from friends',
			);

		// Get messages
		return this.userMessagesRepository.find({
			where: [
				{
					senderId: user.id,
					receiverId: contact.id,
					sentAt: LessThan(before),
				},
				{
					senderId: contact.id,
					receiverId: user.id,
					sentAt: LessThan(before),
				},
			],
			order: { sentAt: 'DESC' },
			take: 50,
		});
	}

	async updateProfilePicture(user: User, file: any) {
		const ppPath = path.join(
			'./',
			'uploads',
			'profile-pictures',
			`${user.id}.webp`,
		);
		const pipelinePromise = new Promise<void>((resolve, reject) => {
			pipeline(
				file,
				sharp()
					.resize(600, 600, {
						fit: 'cover',
					})
					.webp(),
				fs.createWriteStream(ppPath),
				(err) => {
					if (err) {
						// If the file type is not an image
						if (
							err.message.includes(
								'Input buffer contains unsupported image format',
							)
						)
							reject(
								new BadRequestException(
									'File type not supported',
								),
							);
						else {
							reject(
								new BadRequestException(
									'Error while uploading the file',
								),
							);
						}
					} else resolve();
				},
			);
		});

		try {
			await pipelinePromise;
			return this.findOne(user.id);
		} catch (err) {
			throw err;
		}
	}

	async set42ProfilePicture(user: User) {
		if (!user.profile_picture_42 || !user.id42)
			throw new BadRequestException(
				'You need to be logged in with 42 to use this feature',
			);

		const downloadPromise = new Promise<void>((resolve, reject) => {
			fetch(user.profile_picture_42)
				.then((res) => res.arrayBuffer())
				.then(async (buffer) => {
					const readable = new Readable({
						read() {
							this.push(Buffer.from(buffer));
							this.push(null);
						},
					});
					await this.updateProfilePicture(user, readable);
					resolve();
				})
				.catch((err) => reject(new Error(err)));
		});

		try {
			await downloadPromise;
			return this.findOne(user.id);
		} catch (err) {
			throw err;
		}
	}

	async generateAvatar(user: User) {
		const avatar = Avatar.squareBuilder(600);
		const buffer = await avatar.create(user.username);
		const readable = new Readable({
			read() {
				this.push(buffer);
				this.push(null);
			},
		});
		await this.updateProfilePicture(user, readable);
		return this.findOne(user.id);
	}
}
