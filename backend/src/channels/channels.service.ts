import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, LessThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
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

	async create(creator: User, createChannelDto: CreateChannelDto) {
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

	canSee(user: User, channel: Channel): boolean {
		if (channel.owner.id === user.id) return true;
		if (channel.members.find((member) => member.id === user.id))
			return true;
		if (channel.invited.find((invited) => invited.user.id === user.id))
			return true;
		if (channel.visibility === Visibility.Public) return true;
	}

	async update(
		updater: User,
		id: number,
		updateChannelDto: UpdateChannelDto,
	) {
		const channel = await this.findOne(id);
		if (!channel) throw new NotFoundException('Channel not found');
		if (channel.owner.id !== updater.id)
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
		user: User,
		channelCode: string,
		password: string,
	): Promise<Channel> {
		const channel = await this.findOneByCode(channelCode, true);
		if (!channel) throw new NotFoundException('Channel not found');

		if (!channel.members) channel.members = [];
		if (!channel.banned) channel.banned = [];

		// Check if user is already a member
		if (channel.members.find((member) => member.id === user.id)) {
			delete channel.password_hash;
			return channel;
		}

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

	async listJoined(user: User): Promise<Channel[]> {
		const channels = await this.channelsRepository.find({
			where: { members: { id: user.id } },
		});
		return channels;
	}

	async leave(user: User, channelId: number): Promise<Channel> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');

		if (!channel.members) channel.members = [];
		if (!channel.admins) channel.admins = [];
		// Remove user from members array
		channel.members = channel.members.filter(
			(member) => member.id !== user.id,
		);
		// Remove user from admins array
		channel.admins = channel.admins.filter((admin) => admin.id !== user.id);
		// Save channel
		return await this.save(channel);
	}

	async addAdmin(
		user: User,
		adminToAddId: number,
		channelId: number,
	): Promise<Channel> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const adminToAdd = await this.usersService.findOne(adminToAddId);
		if (!adminToAdd) throw new NotFoundException('User not found');

		// Check if user is channel owner
		if (channel.owner.id !== user.id)
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
		user: User,
		adminToRemoveId: number,
		channelId: number,
	): Promise<Channel> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const adminToRemove = await this.usersService.findOne(adminToRemoveId);
		if (!adminToRemove) throw new NotFoundException('User not found');

		// Check if user is channel owner
		if (channel.owner.id !== user.id)
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
		user: User,
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
		if (!channel.admins.find((admin) => admin.id === user.id))
			throw new ForbiddenException('Only channel admins can ban users');

		// Create new banned user (or update existing one)
		const newBannedUser = new ChannelBannedUser();
		newBannedUser.user = userToBan;
		newBannedUser.channel = channel;
		newBannedUser.until = until;

		await this.channelBannedUsersRepository.save(newBannedUser);
		await this.leave(userToBan, channel.id);
		return newBannedUser;
	}

	async muteUser(
		user: User,
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
		if (!channel.admins.find((admin) => admin.id === user.id))
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
		user: User,
		userToInviteId: number,
		channelId: number,
	): Promise<ChannelInvitedUser> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');
		const userToInvite = await this.usersService.findOne(userToInviteId);
		if (!userToInvite) throw new NotFoundException('User not found');

		// Check that user is channel admin
		if (!channel.admins) channel.admins = [];
		if (!channel.admins.find((admin) => admin.id === user.id))
			throw new ForbiddenException(
				'Only channel admins can invite users',
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
		sender: User,
		channelId: number,
		message: string,
	): Promise<ChannelMessage> {
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
		user: User,
		channelId: number,
		before: Date,
	): Promise<ChannelMessage[]> {
		const channel = await this.findOne(channelId);
		if (!channel) throw new NotFoundException('Channel not found');

		// Check if user is a member of the channel
		if (!channel.members) channel.members = [];
		if (!channel.members.find((member) => member.id === user.id))
			throw new ForbiddenException(
				'Only channel members can read messages',
			);

		return await this.channelMessagesRepository.find({
			where: {
				channel: { id: channel.id },
				sentAt: LessThan(before),
			},
			order: { sentAt: 'DESC' },
			take: 50,
		});
	}
}
