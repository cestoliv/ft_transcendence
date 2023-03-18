import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { validateSync } from 'class-validator';
import { DateTime } from 'luxon';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './entities/channel.entity';
import { BaseGateway } from 'src/base.gateway';
import { SocketWithUser, WSResponse } from 'src/types';
import { exceptionToObj } from 'src/utils';
import { ChannelMessage } from './entities/channel-message.entity';
import { ChannelBannedUser } from './entities/channel-banned.entity';
import { ChannelMutedUser } from './entities/channel-muted.entity';
import { ChannelInvitedUser } from './entities/channel-invited.entity';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
	cors: {
		origin: async (origin, callback) => {
			const configService = new ConfigService();
			callback(null, configService.get<string>('CORS_ORIGIN') || '*');
		},
		credentials: true,
	},
})
export class ChannelsGateway extends BaseGateway {
	/*
	 * Create a new channel.
	 * The client sends a message with the channel data.
	 * The client is added to the channel as owner and admin.
	 */
	@SubscribeMessage('channels_create')
	async create(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | Channel> {
		// Validate payload
		const createChannelDto = new CreateChannelDto();
		createChannelDto.name = payload.name;
		createChannelDto.visibility = payload.visibility;
		createChannelDto.password = payload.password;

		const val = validateSync(createChannelDto);
		if (val.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: val.map((e) => Object.values(e.constraints)).flat(1),
			};

		// Create channel
		let channel = await this.channelsService
			.create(socket.userId, payload)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
		if (!(channel instanceof Channel)) return channel;

		// Join channel
		channel = await this.channelsService.join(
			socket.userId,
			channel.code,
			createChannelDto.password,
		);
		socket.join(`channel_${channel.id}`);

		// Add to admins
		channel = await this.channelsService.addAdmin(
			socket.userId,
			socket.userId,
			channel.id,
		);
		// TODO: Maybe send a message to everyone if the channel is joinable
		return channel;
	}

	/*
	 * List every channels for the current user.
	 * Show joined channels, public channels, and channels the user is invited in.
	 */
	@SubscribeMessage('channels_list')
	async list(socket: SocketWithUser): Promise<Channel[]> {
		const channels = await this.channelsService.findAll();

		return channels.filter((channel) => {
			return this.channelsService.canSee(socket.userId, channel);
		});
	}

	/*
	 * Get a channel.
	 * The channel need to be public or the client need to be a member
	 * or an invited user in the channel.
	 */
	@SubscribeMessage('channels_get')
	async get(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | Channel> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Find channel
		const channel = await this.channelsService.findOne(payload.id);
		if (channel === undefined || channel === null)
			return {
				statusCode: 404,
				error: 'Not found',
				messages: ['Channel not found'],
			};

		// Check if the user is allowed to see the channel
		if (this.channelsService.canSee(socket.userId, channel)) return channel;
		return {
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You are not allowed to see this channel'],
		};
	}

	/*
	 * Update the channel.
	 * The client must be the owner of the channel.
	 */
	@SubscribeMessage('channels_update')
	async update(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | Channel> {
		// Validate payload
		let errors: Array<string> = [];
		if (payload === undefined || typeof payload != 'object')
			errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');

		// Create updateChannelDto (to ensure that only the visibility and password are updated)
		const updateChannelDto = new UpdateChannelDto();
		if (payload !== undefined && typeof payload == 'object') {
			updateChannelDto.name = payload.name;
			updateChannelDto.visibility = payload.visibility;
			updateChannelDto.password = payload.password;
		}

		const val = validateSync(updateChannelDto);
		if (val.length != 0)
			errors = errors.concat(
				val.map((e) => Object.values(e.constraints)).flat(1),
			);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to update channel
		return this.channelsService
			.update(socket.userId, payload.id, payload)
			.then((channel) => {
				// Propagate channel update
				socket
					.to(`channel_${channel.id}`)
					.emit('channels_update', channel);
				return channel;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Join a channel.
	 * Will be rejected if the channel is private.
	 * Will be rejected if the channel is password protected and the password is wrong.
	 */
	@SubscribeMessage('channels_join')
	async join(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | Channel> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.code === undefined)
			errors.push('Channel code is not specified');
		if (payload.password === undefined) payload.password = null;

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to join channel
		return await this.channelsService
			.join(socket.userId, payload.code, payload.password)
			.then((channel) => {
				// Propagate channel join
				socket.join(`channel_${channel.id}`);
				socket
					.to(`channel_${channel.id}`)
					.emit('channels_join', channel);

				return channel;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * List channels joined by the client.
	 */
	@SubscribeMessage('channels_listJoined')
	async listJoined(socket: SocketWithUser): Promise<Channel[]> {
		return this.channelsService.listJoined(socket.userId);
	}

	/*
	 * Leave a channel.
	 */
	@SubscribeMessage('channels_leave')
	async leave(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | Channel> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to leave channel
		return await this.channelsService
			.leave(socket.userId, payload.id)
			.then((channel) => {
				// Propagate channel leave
				socket
					.to(`channel_${channel.id}`)
					.emit('channels_leave', channel);
				socket.leave(`channel_${channel.id}`);

				return channel;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Add admin to a channel.
	 * The client need to be the owner of the channel.
	 * The user to add as admin need to be in the channel.
	 */
	@SubscribeMessage('channels_addAdmin')
	async addAdmin(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | Channel> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to add admin
		return this.channelsService
			.addAdmin(socket.userId, payload.user_id, payload.id)
			.then((channel) => {
				// Propagate admin add
				socket
					.to(`channel_${channel.id}`)
					.emit('channels_addAdmin', channel);
				return channel;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Add admin to a channel.
	 * The client need to be the owner of the channel.
	 * The user to add as admin need to be in the channel.
	 */
	@SubscribeMessage('channels_removeAdmin')
	async removeAdmin(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | Channel> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to remove admin
		return this.channelsService
			.removeAdmin(socket.userId, payload.user_id, payload.id)
			.then((channel) => {
				// Propagate admin remove
				socket
					.to(`channel_${channel.id}`)
					.emit('channels_removeAdmin', channel);
				return channel;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Ban a user from a channel for a limited time.
	 * The client need to be an admin of the channel.
	 */
	@SubscribeMessage('channels_banUser')
	async ban(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | ChannelBannedUser> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');
		if (payload.until === undefined) errors.push('Until is not specified');

		const until = DateTime.fromISO(payload.until);
		if (!until.isValid) errors.push('Until date: ', until.invalidReason);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to ban user
		return await this.channelsService
			.banUser(
				socket.userId,
				payload.user_id,
				payload.id,
				until.toJSDate(),
			)
			.then((ban) => {
				// Propagate user ban
				socket
					.to(`channel_${ban.channelId}`)
					.emit('channels_banUser', ban);
				return ban;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Mute a user from a channel for a limited time.
	 * The client need to be an admin of the channel.
	 */
	@SubscribeMessage('channels_muteUser')
	async mute(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | ChannelMutedUser> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');
		if (payload.until === undefined) errors.push('Until is not specified');

		const until = DateTime.fromISO(payload.until);
		if (!until.isValid) errors.push('Until date: ', until.invalidReason);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to mute user
		return this.channelsService
			.muteUser(
				socket.userId,
				payload.user_id,
				payload.id,
				until.toJSDate(),
			)
			.then((mute) => {
				// Propagate user mute
				socket
					.to(`channel_${mute.channelId}`)
					.emit('channels_muteUser', mute);
				return mute;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Invite a user to a channel.
	 * The client need to be an admin of the channel.
	 * TODO: prevent inviting himself
	 */
	@SubscribeMessage('channels_inviteUser')
	async inviteUser(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | ChannelInvitedUser> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to invite user
		return this.channelsService
			.inviteUser(socket.userId, payload.user_id, payload.id)
			.then((invite) => {
				// Propagate invitation to user
				this.connectedClientsService
					.get(invite.userId)
					.emit('channels_inviteUser', invite);
				return invite;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Send a message to a channel.
	 * The client need to be a member of the channel.
	 * The client need to not be muted in the channel.
	 */
	@SubscribeMessage('channels_sendMessage')
	async sendMessage(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | ChannelMessage> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.message === undefined)
			errors.push('Message is not specified');

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to send message
		return await this.channelsService
			.sendMessage(socket.userId, payload.id, payload.message)
			.then(async (message) => {
				// Get a list of all members how have muted the sender
				const muters = await this.usersService.getMuters(
					message.senderId,
				);

				// Send message to all members of the channel (except the sender)
				socket
					.to(`channel_${message.channelId}`)
					// Except every user how muted the sender
					.except(muters.map((m) => `me_${m.id}`))
					.emit('channels_message', message);
				return message;
			})
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Get messages of a channel.
	 * The client need to be a member of the channel.
	 * Return the 50 message before the given date.
	 */
	@SubscribeMessage('channels_messages')
	async getMessages(
		socket: SocketWithUser,
		payload: any,
	): Promise<WSResponse | ChannelMessage[]> {
		// Validate payload
		const errors: Array<string> = [];
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.before === undefined)
			errors.push('Before date is not specified');

		const before = DateTime.fromISO(payload.before);
		if (!before.isValid) errors.push('Before date: ', before.invalidReason);

		if (errors.length != 0)
			return {
				statusCode: 400,
				error: 'Bad request',
				messages: errors,
			};

		// Try to get messages
		return this.channelsService
			.getMessages(socket.userId, payload.id, before.toJSDate())
			.then((messages) => messages)
			.catch((error) => exceptionToObj(error));
	}
}
