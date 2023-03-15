import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	ForbiddenException,
	ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, In, LessThan, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { genId } from 'src/utils';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './entities/channel.entity';
import { Visibility } from './enums/visibility.enum';
import { ChannelMutedUser } from './entities/channel-muted.entity';
import { ChannelBannedUser } from './entities/channel-banned.entity';
import { ChannelInvitedUser } from './entities/channel-invited.entity';
import { ChannelMessage } from './entities/channel-message.entity';

@Injectable()
export class ChannelsService {
	constructor(
		@InjectRepository(Channel)
		private readonly channelsRepository: Repository<Channel>,
		@InjectRepository(ChannelBannedUser)
		private readonly channelBannedUsersRepository: Repository<ChannelBannedUser>,
		@InjectRepository(ChannelMutedUser)
		private readonly channelMutedUsersRepository: Repository<ChannelMutedUser>,
		@InjectRepository(ChannelInvitedUser)
		private readonly channelInvitedUsersRepository: Repository<ChannelInvitedUser>,
		@InjectRepository(ChannelMessage)
		private readonly channelMessagesRepository: Repository<ChannelMessage>,
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
	) {}

	async create(creatorId: number, createChannelDto: CreateChannelDto) {
		const creator = await this.usersService.findOne(creatorId);
		if (!creator) throw new NotFoundException('User not found');

		const channel = new Channel();
		channel.name = createChannelDto.name;
		channel.code = genId(6);
		channel.owner = creator;
		channel.visibility = createChannelDto.visibility || Visibility.Public;

		channel.password_hash = null;
		if (channel.visibility === Visibility.PasswordProtected) {
			if (!createChannelDto.password) {
				throw new BadRequestException(
					'Password is required for password protected channels',
				);
			}
			channel.password_hash = await bcrypt.hash(
				createChannelDto.password,
				10,
			);
		}

		return this.channelsRepository.save(channel);
	}

	findAll() {
		return this.channelsRepository.find({
			relations: ['banned', 'muted', 'invited'],
		});
	}

	async findOne(id: number, selectPassword = false) {
		const select = ['id', 'code', 'owner', 'name', 'visibility'];
		if (selectPassword) select.push('password_hash');
		return this.channelsRepository.findOne({
			where: { id },
			select: select as FindOptionsSelect<Channel>,
			relations: ['banned', 'muted', 'invited'],
		});
	}

	findOneByCode(code: string, selectPassword = false) {
		const select = ['id', 'code', 'owner', 'name', 'visibility'];
		if (selectPassword) select.push('password_hash');
		return this.channelsRepository.findOne({
			where: { code },
			select: select as FindOptionsSelect<Channel>,
			relations: ['banned', 'muted', 'invited'],
		});
	}

	canSee(userId: number, channel: Channel): boolean {
		if (channel.owner.id === userId) return true;
		if (channel.members.find((member) => member.id === userId)) return true;
		if (channel.invited.find((invited) => invited.user.id === userId))
			return true;
		if (channel.visibility !== Visibility.Private) return true;
	}

	async update(
		updaterId: number,
		id: number,
		updateChannelDto: UpdateChannelDto,
	) {
		const channel = await this.findOne(id);
		if (!channel) throw new NotFoundException('Channel not found');
		if (channel.owner.id !== updaterId)
			throw new ForbiddenException(
				'Only channel owner can update channel',
			);

		channel.name = updateChannelDto.name;
		channel.visibility = updateChannelDto.visibility;
		channel.password_hash = null;
		if (channel.visibility === Visibility.PasswordProtected) {
			if (!updateChannelDto.password) {
				throw new BadRequestException(
					'Password is required for password protected channels',
				);
			}
			channel.password_hash = await bcrypt.hash(
				updateChannelDto.password,
				10,
			);
		}
		return this.save(channel);
	}

	async save(channel: Channel) {
		delete channel.banned;
		delete channel.muted;
		delete channel.invited;
		await this.channelsRepository.save(channel);
		return this.findOne(channel.id);
	}

	remove(id: number) {
		return this.channelsRepository.delete({ id });
	}

	async join(
		userId: number,
		channelCode: string,
		password: string,
	): Promise<Channel> {
		const user = await this.usersService.findOne(userId);
		if (!user) throw new NotFoundException('User not found');
		const channel = await this.findOneByCode(channelCode, true);
		if (!channel) throw new NotFoundException('Channel not found');

		if (!channel.members) channel.members = [];
		if (!channel.banned) channel.banned = [];

		// Check if user is already a member
		if (channel.members.find((member) => member.id === user.id))
			throw new ConflictException('You are already a member');

		// Check if user is banned
		const bannedUser = channel.banned.find(
			(banned) => banned.user.id === user.id,
		);
		if (bannedUser) {
			// Check if ban is expired
			if (bannedUser.until < new Date()) {
				// Remove ban
				await this.channelBannedUsersRepository.delete({
					userId: user.id,
					channelId: channel.id,
				});
			} else {
				throw new ForbiddenException(
					'You are banned from this channel',
				);
			}
		}

		// If channel is private, check if user is invited or owner
		if (channel.visibility === Visibility.Private) {
			if (!channel.invited) channel.invited = [];
			if (
				!channel.invited.find(
					(invited) => invited.user.id === user.id,
				) &&
				channel.owner.id !== user.id
			) {
				throw new ForbiddenException(
					'You are not invited to this channel',
				);
			}
		}

		// If channel is password protected, check if password is correct
		if (channel.visibility === Visibility.PasswordProtected) {
			if (!password || password.length === 0) {
				throw new ForbiddenException('Password is required');
			}
			if (!(await bcrypt.compare(password, channel.password_hash))) {
				throw new ForbiddenException('Wrong password');
			}
		}

		// Remove user from invited
		await this.channelInvitedUsersRepository.delete({
			userId: user.id,
			channelId: channel.id,
		});

		// Add user to members array
		channel.members.push(user);

		// Save channel
		return await this.save(channel);
	}

	async listJoined(userId: number): Promise<Channel[]> {
		// Return channels where user is a member (and ensure that members array does not contain only the current user)
		const channels = await this.channelsRepository.find({
			where: { members: { id: userId } },
		});
		// Reload members array (workaround because members array contains only the current user)
		for (const channel of channels) {
			channel.members = await this.channelsRepository
				.createQueryBuilder('channel')
				.relation(Channel, 'members')
				.of(channel)
				.loadMany();
		}
		return channels;
	}

	async leave(userId: number, channelId: number): Promise<Channel> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');

		if (!channel.members) channel.members = [];
		if (!channel.admins) channel.admins = [];
		// Remove user from members array
		channel.members = channel.members.filter(
			(member) => member.id !== userId,
		);
		// Remove user from admins array
		channel.admins = channel.admins.filter((admin) => admin.id !== userId);
		// Save channel
		return await this.save(channel);
	}

	async addAdmin(
		userId: number,
		adminToAddId: number,
		channelId: number,
	): Promise<Channel> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const adminToAdd = await this.usersService.findOne(adminToAddId);
		if (!adminToAdd) throw new NotFoundException('User not found');

		// Check if user is channel owner
		if (channel.owner.id !== userId)
			throw new ForbiddenException('Only channel owner can add admins');

		// Check if adminToAdd is a member
		if (!channel.members) channel.members = [];
		if (!channel.members.find((member) => member.id === adminToAdd.id))
			throw new BadRequestException(
				'User is not a member of this channel',
			);

		// Check if adminToAdd is already an admin
		if (!channel.admins) channel.admins = [];
		if (channel.admins.find((admin) => admin.id === adminToAdd.id))
			return channel;
		// Add adminToAdd to admins array
		channel.admins.push(adminToAdd);

		// Save channel
		return await this.save(channel);
	}

	async removeAdmin(
		userId: number,
		adminToRemoveId: number,
		channelId: number,
	): Promise<Channel> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const adminToRemove = await this.usersService.findOne(adminToRemoveId);
		if (!adminToRemove) throw new NotFoundException('User not found');

		// Check if user is channel owner
		if (channel.owner.id !== userId)
			throw new ForbiddenException(
				'Only channel owner can remove admins',
			);

		// Check if adminToRemove is not an admin
		if (!channel.admins) channel.admins = [];
		if (!channel.admins.find((admin) => admin.id === adminToRemove.id))
			return channel;

		// Remove user from admins array
		channel.admins = channel.admins.filter(
			(admin) => admin.id !== adminToRemove.id,
		);
		// Save channel
		return await this.save(channel);
	}

	async banUser(
		userId: number,
		userToBanId: number,
		channelId: number,
		until: Date,
	): Promise<ChannelBannedUser> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const userToBan = await this.usersService.findOne(userToBanId);
		if (!userToBan) throw new NotFoundException('User not found');

		// Check that user is channel admin
		if (!channel.admins) channel.admins = [];
		if (!channel.admins.find((admin) => admin.id === userId))
			throw new ForbiddenException('Only channel admins can ban users');

		// Create new banned user (or update existing one)
		const newBannedUser = new ChannelBannedUser();
		newBannedUser.user = userToBan;
		newBannedUser.channel = channel;
		newBannedUser.until = until;

		await this.channelBannedUsersRepository.save(newBannedUser);
		await this.leave(userToBan.id, channel.id);
		return newBannedUser;
	}

	async muteUser(
		userId: number,
		userToMuteId: number,
		channelId: number,
		until: Date,
	): Promise<ChannelMutedUser> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const userToMute = await this.usersService.findOne(userToMuteId);
		if (!userToMute) throw new NotFoundException('User not found');

		// Check that user is channel admin
		if (!channel.admins) channel.admins = [];
		if (!channel.admins.find((admin) => admin.id === userId))
			throw new ForbiddenException('Only channel admins can mute users');

		// Create new muted user (or update existing one)
		const newMutedUser = new ChannelMutedUser();
		newMutedUser.user = userToMute;
		newMutedUser.channel = channel;
		newMutedUser.until = until;

		await this.channelMutedUsersRepository.save(newMutedUser);
		return newMutedUser;
	}

	async inviteUser(
		userId: number,
		userToInviteId: number,
		channelId: number,
	): Promise<ChannelInvitedUser> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const userToInvite = await this.usersService.findOne(userToInviteId);
		if (!userToInvite) throw new NotFoundException('User not found');

		// Check that user is not invitting himself
		if (userToInvite.id === userId)
			throw new ConflictException("You can't invite yourself");

		// Check that user is channel admin
		if (!channel.admins) channel.admins = [];
		if (!channel.admins.find((admin) => admin.id === userId))
			throw new ForbiddenException(
				'Only channel admins can invite users',
			);

		// Check if there is already an invitation pending
		if (
			channel.invited.find(
				(invited) => invited.user.id === userToInvite.id,
			)
		)
			throw new ConflictException(
				'There is already a pending invitation',
			);

		// Create new invited user
		const newInvitedUser = new ChannelInvitedUser();
		newInvitedUser.user = userToInvite;
		newInvitedUser.inviter = userToInvite;
		newInvitedUser.channel = channel;
		newInvitedUser.invited_at = new Date();

		await this.channelInvitedUsersRepository.save(newInvitedUser);

		return newInvitedUser;
	}

	async sendMessage(
		senderId: number,
		channelId: number,
		message: string,
	): Promise<ChannelMessage> {
		const sender = await this.usersService.findOne(senderId);
		if (!sender) throw new NotFoundException('User not found');
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');

		// Check if user is a member of the channel
		if (!channel.members) channel.members = [];
		if (!channel.members.find((member) => member.id === sender.id))
			throw new ForbiddenException(
				'Only channel members can send messages',
			);

		// Check if user is muted
		if (!channel.muted) channel.muted = [];
		const mutedUser = channel.muted.find(
			(mutedUser) => mutedUser.user.id === sender.id,
		);
		if (mutedUser) {
			if (mutedUser.until > new Date()) {
				throw new ForbiddenException('You are muted in this channel');
			} else {
				// Remove user from muted array
				await this.channelMutedUsersRepository.delete({
					userId: sender.id,
					channelId: channel.id,
				});
			}
		}

		// Create new message
		const newMessage = new ChannelMessage();
		newMessage.sender = sender;
		newMessage.channel = channel;
		newMessage.message = message;
		newMessage.sentAt = new Date();

		await this.channelMessagesRepository.save(newMessage);

		return newMessage;
	}

	async getMessages(
		userId: number,
		channelId: number,
		before: Date,
	): Promise<ChannelMessage[]> {
		const user = await this.usersService.findOne(userId);
		if (!user) throw new NotFoundException('User not found');
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');

		// Check if user is a member of the channel
		if (!channel.members) channel.members = [];
		if (!channel.members.find((member) => member.id === userId))
			throw new ForbiddenException(
				'Only channel members can read messages',
			);

		// Filter muted
		const now = new Date();
		user.muted = user.muted.filter((m) => m.until > now);

		// Get messages of the channel, exept the ones sent by muted users
		return await this.channelMessagesRepository.find({
			where: {
				channel: { id: channel.id },
				sentAt: LessThan(before),
				sender: Not(In(user.muted.map((m) => m.mutedId))),
			},
			order: { sentAt: 'DESC' },
			take: 200,
		});
	}
}
