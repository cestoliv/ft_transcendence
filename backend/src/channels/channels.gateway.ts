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
			callback(null, configService.get<string>('FRONTEND_URL') || '*');
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
		client: SocketWithUser,
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
			.create(client.user, payload)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
		if (!(channel instanceof Channel)) return channel;

		// Join channel
		channel = await this.channelsService.join(
			client.user,
			channel.code,
			createChannelDto.password,
		);
		client.join(`channel_${channel.id}`);

		// Add to admins
		channel = await this.channelsService.addAdmin(
			client.user,
			client.user.id,
			channel.id,
		);
		return channel;
	}

	/*
	 * List every channels for the current user.
	 * Show joined channels, public channels, and channels the user is invited in.
	 */
	@SubscribeMessage('channels_list')
	async list(client: SocketWithUser): Promise<Channel[]> {
		const channels = await this.channelsService.findAll();

		return channels.filter((channel) => {
			return this.channelsService.canSee(client.user, channel);
		});
	}

	/*
	 * Get a channel.
	 * The channel need to be public or the client need to be a member
	 * or an invited user in the channel.
	 */
	@SubscribeMessage('channels_get')
	async get(
		client: SocketWithUser,
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
		if (channel === undefined)
			return {
				statusCode: 404,
				error: 'Not found',
				messages: ['Channel not found'],
			};

		// Check if the user is allowed to see the channel
		if (this.channelsService.canSee(client.user, channel)) return channel;
		return {
			statusCode: 403,
			error: 'Forbidden',
			messages: ['You are not allowed to see this channel'],
		};
	}

	/*
	 * Remove a channel.
	 * The client must be the owner of the channel.
	 */
	// @SubscribeMessage('channels_remove')
	// remove(@MessageBody() id: number) {
	// 	return this.channelsService.remove(id);
	// }

	/*
	 * Update the channel.
	 * The client must be the owner of the channel.
	 */
	// @UseInterceptors(NotFoundInterceptor)
	@SubscribeMessage('channels_update')
	async update(
		client: SocketWithUser,
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
			.update(client.user, payload.id, payload)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Join a channel.
	 * Will be rejected if the channel is private.
	 * Will be rejected if the channel is password protected and the password is wrong.
	 */
	@SubscribeMessage('channels_join')
	async join(
		client: SocketWithUser,
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
		const channel = await this.channelsService
			.join(client.user, payload.code, payload.password)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
		if (!(channel instanceof Channel)) return channel;

		client.join(`channel_${channel.id}`);
		return channel;
	}

	/*
	 * List channels joined by the client.
	 */
	@SubscribeMessage('channels_listJoined')
	async listJoined(client: SocketWithUser): Promise<Channel[]> {
		return this.channelsService.listJoined(client.user);
	}

	/*
	 * Leave a channel.
	 */
	@SubscribeMessage('channels_leave')
	async leave(
		client: SocketWithUser,
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
		const channel = await this.channelsService
			.leave(client.user, payload.id)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
		if (!(channel instanceof Channel)) return channel;

		client.leave(`channel_${channel.id}`);
		return channel;
	}

	/*
	 * Add admin to a channel.
	 * The client need to be the owner of the channel.
	 * The user to add as admin need to be in the channel.
	 */
	@SubscribeMessage('channels_addAdmin')
	async addAdmin(
		client: SocketWithUser,
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
			.addAdmin(client.user, payload.user_id, payload.id)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Add admin to a channel.
	 * The client need to be the owner of the channel.
	 * The user to add as admin need to be in the channel.
	 */
	@SubscribeMessage('channels_removeAdmin')
	async removeAdmin(
		client: SocketWithUser,
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
			.removeAdmin(client.user, payload.user_id, payload.id)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Ban a user from a channel for a limited time.
	 * The client need to be an admin of the channel.
	 */
	@SubscribeMessage('channels_banUser')
	async ban(
		client: SocketWithUser,
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
		const channelBannedUser = await this.channelsService
			.banUser(client.user, payload.user_id, payload.id, until.toJSDate())
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
		if (!(channelBannedUser instanceof ChannelBannedUser))
			return channelBannedUser;

		// Loop through all connected clients and make user leave the channel
		this.connectedClientsService.array().forEach((cClient) => {
			// TODO: check that this new way of getting the socket is working
			const socket = cClient[1];
			if (socket.user.id == payload.user_id)
				socket.leave(`channel_${payload.id}`);
		});

		return channelBannedUser;
	}

	/*
	 * Mute a user from a channel for a limited time.
	 * The client need to be an admin of the channel.
	 */
	@SubscribeMessage('channels_muteUser')
	async mute(
		client: SocketWithUser,
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
				client.user,
				payload.user_id,
				payload.id,
				until.toJSDate(),
			)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Invite a user to a channel.
	 * The client need to be an admin of the channel.
	 * TODO: prevent inviting himself
	 */
	@SubscribeMessage('channels_inviteUser')
	async inviteUser(
		client: SocketWithUser,
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
			.inviteUser(client.user, payload.user_id, payload.id)
			.then((channel) => channel)
			.catch((error) => exceptionToObj(error));
	}

	/*
	 * Send a message to a channel.
	 * The client need to be a member of the channel.
	 * The client need to not be muted in the channel.
	 */
	@SubscribeMessage('channels_sendMessage')
	async sendMessage(
		client: SocketWithUser,
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
		const message = await this.channelsService
			.sendMessage(client.user, payload.id, payload.message)
			.then((message) => message)
			.catch((error) => exceptionToObj(error));
		if (!(message instanceof ChannelMessage)) return message;

		// Send message to all members of the channel (except the sender)
		client
			.to(`channel_${message.channelId}`)
			.emit('channels_message', message);

		return message;
	}

	/*
	 * Get messages of a channel.
	 * The client need to be a member of the channel.
	 * Return the 50 message before the given date.
	 */
	@SubscribeMessage('channels_messages')
	async getMessages(
		client: SocketWithUser,
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
			.getMessages(client.user, payload.id, before.toJSDate())
			.then((messages) => messages)
			.catch((error) => exceptionToObj(error));
	}
}
