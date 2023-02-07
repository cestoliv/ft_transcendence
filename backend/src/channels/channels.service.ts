import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, Repository } from 'typeorm';
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
		private readonly usersService: UsersService,
	) {}

	async create(creator: User, createChannelDto: CreateChannelDto) {
		const channel = new Channel();
		channel.name = createChannelDto.name;
		channel.code = genId(6);
		channel.owner = creator;
		channel.visibility = createChannelDto.visibility || Visibility.Public;

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

	async update(id: number, updateChannelDto: UpdateChannelDto) {
		const channel = new Channel();
		channel.name = updateChannelDto.name;
		channel.visibility = updateChannelDto.visibility;
		channel.password_hash = await bcrypt.hash(
			updateChannelDto.password,
			10,
		);
		return this.channelsRepository.update({ id }, channel);
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

	async join(user: User, channel: Channel): Promise<Channel | Date> {
		if (!channel.members) channel.members = [];
		if (!channel.banned) channel.banned = [];

		// Check if user is already a member
		if (channel.members.find((member) => member.id === user.id))
			return channel;

		// Check if user is banned
		const bannedUser = channel.banned.find(
			(banned) => banned.user.id === user.id,
		);
		if (bannedUser) {
			// Check if ban is expired
			if (bannedUser.until < new Date()) {
				// Remove ban
				this.channelBannedUsersRepository.delete({
					userId: user.id,
					channelId: channel.id,
				});
			} else return bannedUser.until;
		}

		// Remove user from invited
		this.channelInvitedUsersRepository.delete({
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

	async leave(user: User, channel: Channel): Promise<Channel> {
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

	async addAdmin(user: User, channel: Channel): Promise<Channel> {
		if (!channel.admins) channel.admins = [];
		// Check if user is already an admin
		if (channel.admins.find((admin) => admin.id === user.id))
			return channel;
		// Add user to admins array
		channel.admins.push(user);

		// Save channel
		return await this.save(channel);
	}

	async removeAdmin(user: User, channel: Channel): Promise<Channel> {
		if (!channel.admins) channel.admins = [];
		// Remove user from admins array
		channel.admins = channel.admins.filter((admin) => admin.id !== user.id);
		// Save channel
		return await this.save(channel);
	}

	async banUser(
		user: User,
		channel: Channel,
		until: Date,
	): Promise<ChannelBannedUser> {
		// Create new banned user (or update existing one)
		const newBannedUser = new ChannelBannedUser();
		newBannedUser.user = user;
		newBannedUser.channel = channel;
		newBannedUser.until = until;

		await this.channelBannedUsersRepository.save(newBannedUser);

		await this.leave(user, channel);

		return newBannedUser;
	}

	async muteUser(
		user: User,
		channel: Channel,
		until: Date,
	): Promise<ChannelMutedUser> {
		// Create new muted user (or update existing one)
		const newMutedUser = new ChannelMutedUser();
		newMutedUser.user = user;
		newMutedUser.channel = channel;
		newMutedUser.until = until;

		await this.channelMutedUsersRepository.save(newMutedUser);

		return newMutedUser;
	}

	async inviteUser(
		inviter: User,
		user: User,
		channel: Channel,
	): Promise<ChannelInvitedUser> {
		// Create new invited user
		const newInvitedUser = new ChannelInvitedUser();
		newInvitedUser.user = user;
		newInvitedUser.inviter = inviter;
		newInvitedUser.channel = channel;
		newInvitedUser.invited_at = new Date();

		console.log(newInvitedUser);

		await this.channelInvitedUsersRepository.save(newInvitedUser);

		return newInvitedUser;
	}
}
