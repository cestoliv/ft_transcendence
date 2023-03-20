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
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import { pipeline, Readable } from 'stream';
import * as crypto from 'crypto';
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
import { BaseGateway } from 'src/base.gateway';
import { Status } from './enums/status.enum';
import { ConfigService } from '@nestjs/config';

import { Interval } from '@nestjs/schedule';
import { GamesService } from 'src/games/games.service';

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
		@Inject(forwardRef(() => GamesService))
		private readonly gamesService: GamesService,

		private readonly configService: ConfigService,
	) {}

	public gateway: BaseGateway = null;

	create(createUserDto: CreateUserDto) {
		const user = new User();
		user.id42 = createUserDto.id42;
		user.username = createUserDto.username;
		user.elo = 1000;
		user.firstConnection = createUserDto.firstConnection;
		user.status = Status.Offline;
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
		const select = [
			'id',
			'id42',
			'username',
			'elo',
			'firstConnection',
			'status',
			'profile_picture',
		];
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
		const select = [
			'id',
			'id42',
			'username',
			'elo',
			'firstConnection',
			'status',
			'profile_picture',
		];
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
		const select = [
			'id',
			'id42',
			'username',
			'elo',
			'firstConnection',
			'status',
			'profile_picture',
		];
		if (withTotp) select.push('otp');
		if (with42ProfilePicture) select.push('profile_picture_42');

		return this.usersRepository.findOne({
			where: { username },
			select: select as FindOptionsSelect<User>,
			relations: ['invitedFriends', 'friendOf', 'banned', 'muted'],
		});
	}

	async update(updaterId: number, id: number, updateUserDto: UpdateUserDto) {
		const user = await this.findOne(id);
		if (!user) throw new NotFoundException('User not found');
		if (user.id !== updaterId)
			throw new ForbiddenException('You can only update your own user');

		// Check username format
		if (updateUserDto.username) {
			updateUserDto.username = updateUserDto.username.toLowerCase();
			if (!/^[a-z0-9_]{3,20}$/.test(updateUserDto.username))
				throw new BadRequestException(
					'Username must be between 3 and 20 characters and can only contain letters, numbers and underscores',
				);
		}

		user.username = updateUserDto.username;
		user.otp = updateUserDto.otp;

		// Set first connection to false
		user.firstConnection = false;

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

	async enableTotp(userId: number): Promise<{ secret: string; url: string }> {
		const user = await this.findOne(userId);
		if (!user) throw new NotFoundException('User not found');
		// Generate TOTP secret
		const secret = authenticator.generateSecret();
		const url = authenticator.keyuri('', 'Transcendence', secret);

		// Encrypt TOTP secret
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv(
			'aes-256-cbc',
			Buffer.from(this.configService.get('TOTP_SECRET')),
			iv,
		);
		const encrypted = Buffer.concat([
			cipher.update(secret),
			cipher.final(),
		]);
		const encryptedSecret =
			iv.toString('hex') + ':' + encrypted.toString('hex');

		// Update user TOTP secret
		user.otp = encryptedSecret;
		await this.save(user);

		return { secret, url };
	}

	async disableTotp(userId: number): Promise<{ otp: null }> {
		const user = await this.findOne(userId);
		if (!user) throw new NotFoundException('User not found');
		// Update user TOTP secret
		if (!user.id42)
			throw new ForbiddenException(
				"You can't disable TOTP if you don't have a 42 account",
			);
		user.otp = null;
		await this.save(user);

		return { otp: null };
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

	/*
	 * Get a list of users how have muted the given user
	 */
	async getMuters(userId: number) {
		const mute = await this.mutedUsersRepository.find({
			where: { mutedId: userId },
		});
		// Filter expired mutes
		const now = new Date();
		const filteredMute = mute.filter((m) => m.until > now);
		return filteredMute.map((m) => m.user);
	}

	async inviteFriend(inviterId: number, newFriendName: string) {
		const inviter = await this.findOne(inviterId);
		if (!inviter) throw new NotFoundException('User not found');
		const newFriend = await this.findOneByUsername(newFriendName);
		if (!newFriend) throw new NotFoundException('User not found');

		// Check if inviter is not inviting himself
		if (inviter.id === newFriend.id)
			throw new ConflictException("You can't invite yourself");

		// Check if friendship already exists
		const friendship = await this.userFriendsRepository.findOne({
			where: [
				{ inviterId: inviter.id, inviteeId: newFriend.id },
				{ inviterId: newFriend.id, inviteeId: inviter.id },
			],
		});
		if (friendship && friendship.accepted)
			throw new ConflictException('You are already friends');
		else if (friendship)
			throw new ConflictException(
				'There is already a pending invitation',
			);

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

	async acceptFriendship(inviteeId: number, inviterId: number) {
		const inviter = await this.findOne(inviterId);
		if (!inviter) throw new NotFoundException('User not found');

		const friendship = await this.userFriendsRepository.findOne({
			where: [
				{ inviterId: inviter.id, inviteeId: inviteeId },
				{ inviterId: inviteeId, inviteeId: inviter.id },
			],
		});
		if (!friendship)
			throw new NotFoundException('Friendship request not found');
		if (friendship.accepted)
			throw new ConflictException('You are already friends');

		friendship.accepted = true;

		return this.userFriendsRepository.save(friendship);
	}

	async removeFriendship(userId: number, friendId: number) {
		const friend = await this.findOne(friendId);
		if (!friend) throw new NotFoundException('User not found');

		const friendship = await this.userFriendsRepository.findOne({
			where: [
				{ inviterId: userId, inviteeId: friend.id },
				{ inviterId: friend.id, inviteeId: userId },
			],
		});
		if (!friendship) throw new NotFoundException('Friendship not found');

		this.userFriendsRepository.delete({
			inviterId: friendship.inviterId,
			inviteeId: friendship.inviteeId,
		});
		return friendship;
	}

	async ban(bannerId: number, userToBanId: number, until: Date) {
		const banner = await this.findOne(bannerId);
		if (!banner) throw new NotFoundException('User not found');
		const userToBan = await this.findOne(userToBanId);
		if (!userToBan) throw new NotFoundException('User not found');

		// Create new banned user (or update existing one)
		const banned = new BannedUser();
		banned.user = banner;
		banned.banned = userToBan;
		banned.until = until;

		// Remove friendship
		await this.removeFriendship(userToBan.id, banner.id).catch(() => {
			// Ignore exceptions
		});

		return this.bannedUsersRepository.save(banned);
	}

	async mute(muterId: number, userToMuteId: number, until: Date) {
		const muter = await this.findOne(muterId);
		if (!muter) throw new NotFoundException('User not found');
		const userToMute = await this.findOne(userToMuteId);
		if (!userToMute) throw new NotFoundException('User not found');

		// Create new muted user (or update existing one)
		const muted = new MutedUser();
		muted.user = muter;
		muted.muted = userToMute;
		muted.until = until;

		return this.mutedUsersRepository.save(muted);
	}

	async sendMessage(senderId: number, receiverId: number, message: string) {
		const sender = await this.findOne(senderId);
		if (!sender) throw new NotFoundException('User not found');
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

	async getMessages(userId: number, contactId: number, before: Date) {
		const contact = await this.findOne(contactId);
		if (!contact) throw new NotFoundException('User not found');

		// Check if users are friends
		if (!contact.friends.find((friend) => friend.id === userId))
			throw new ForbiddenException(
				'You can only get messages from friends',
			);

		// Get messages
		return this.userMessagesRepository.find({
			where: [
				{
					senderId: userId,
					receiverId: contact.id,
					sentAt: LessThan(before),
				},
				{
					senderId: contact.id,
					receiverId: userId,
					sentAt: LessThan(before),
				},
			],
			order: { sentAt: 'DESC' },
			take: 200,
		});
	}

	async updateProfilePicture(userId: number, file: any) {
		let user = await this.findOne(userId);
		if (!user) throw new NotFoundException('User not found');

		const filename = `${uuidv4()}.webp`;
		const ppPath = path.join('./', 'uploads', 'profile-pictures', filename);

		// Resize and convert image to webp
		await new Promise<void>((resolve, reject) => {
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
						) {
							reject(
								new BadRequestException(
									'File type not supported',
								),
							);
						} else {
							reject(
								new BadRequestException(
									'Error while uploading the file',
								),
							);
						}
					} else resolve();
				},
			);
		}).catch((err) => {
			throw err;
		});

		// Delete the old profile picture
		await new Promise<void>((resolve, reject) => {
			if (!user.profile_picture) return resolve();
			const filename = user.profile_picture.split('/').slice(-1)[0];
			fs.unlink(
				path.join('./', 'uploads', 'profile-pictures', filename),
				(err) => {
					if (err) {
						if (err.code === 'ENOENT') {
							return resolve();
						} else
							return reject(new BadRequestException(err.message));
					} else return resolve();
				},
			);
		}).catch((err) => {
			throw err;
		});

		// Update the user profile picture filename
		user.profile_picture = filename;
		user = await this.save(user);
		// Propage the new profile picture
		this.gateway.propagateUserUpdate(user, 'users_update');
		return user;
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
					await this.updateProfilePicture(user.id, readable);
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
		await this.updateProfilePicture(user.id, readable);
		return this.findOne(user.id);
	}

	async changeStatus(userId: number, status: Status) {
		let user = await this.findOne(userId);
		if (!user) throw new NotFoundException('User not found');

		if (user.status != status) {
			user.status = status;
			user = await this.save(user);

			// Propage the new status
			this.gateway.propagateUserUpdate(user, 'users_update');
		}
		return user;
	}

	// Cron to check status, every 1 minutes
	@Interval(60000)
	async loop(): Promise<void> {
		const users = await this.findAll();
		users.forEach(async (user) => {
			const online = await this.gateway.connectedClientsService.has(
				user.id,
			);
			const inGame = await this.gamesService
				.findStartedGame(user.id)
				.then(() => true)
				.catch(() => false);

			const status: Status = online ? Status.Online : Status.Offline;
			if (inGame) user.status = Status.Playing;

			// If the status has changed
			if (user.status != status) {
				user.status = status;
				await this.save(user);

				// Propage the new status
				this.gateway.propagateUserUpdate(user, 'users_update');
			}
		});
	}
}
