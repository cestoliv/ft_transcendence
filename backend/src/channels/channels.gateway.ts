import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { validateSync } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { DateTime } from 'luxon';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Visibility } from './enums/visibility.enum';
import { Channel } from './entities/channel.entity';
import { BaseGateway } from 'src/base.gateway';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class ChannelsGateway extends BaseGateway {
	/*
	 * Create a new channel.
	 * The client sends a message with the channel data.
	 * The client is added to the channel as owner and admin.
	 */
	@SubscribeMessage('channels_create')
	async create(client: any, payload: CreateChannelDto) {
		// Validate payload
		if (payload === undefined || typeof payload != 'object')
			payload = new CreateChannelDto();
		const val = validateSync(payload);
		if (val.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: val.map((e) => Object.values(e.constraints)).flat(1),
			};
		// Create channel
		let channel = await this.channelsService.create(client.user, payload);
		// Join channel
		channel = (await this.channelsService.join(
			client.user,
			channel,
		)) as Channel; // Join will never return a Date (owner is not banned)
		// Add to admins
		channel = await this.channelsService.addAdmin(client.user, channel);
		return channel;
	}

	/*
	 * Find all channels.
	 * TODO: Needs for permissions, only public channels ?
	 */
	@SubscribeMessage('channels_findAll')
	findAll() {
		// Find channels
		return this.channelsService.findAll();
	}

	/*
	 * Find one channel.
	 * TODO: Needs for permissions ? (like to be in the channel, if it's not public)
	 */
	@SubscribeMessage('channels_findOne')
	findOne(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};
		// Find channel
		const channel = this.channelsService.findOne(payload.id);
		if (channel === undefined)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		return channel;
	}

	/*
	 * Remove a channel.
	 * TODO: The client need to be the owner of the channel.
	 */
	// @SubscribeMessage('channels_remove')
	// remove(@MessageBody() id: number) {
	// 	return this.channelsService.remove(id);
	// }

	/*
	 * Set the channel visibility.
	 * The client need to be the owner of the channel.
	 */
	@SubscribeMessage('channels_setVisibility')
	async setVisibility(client: any, payload: any) {
		let errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (
			payload.visibility === Visibility.PasswordProtected &&
			payload.password === undefined
		) {
			errors.push('Password is not specified');
		}

		// Create updateChannelDto (to ensure that only the visibility and password are updated)
		const updateChannelDto = new UpdateChannelDto();
		if (payload !== undefined) {
			updateChannelDto.visibility = payload.visibility;
			updateChannelDto.password = payload.password;
		}

		// Validate payload
		const val = validateSync(updateChannelDto);
		if (val.length != 0)
			errors = errors.concat(
				val.map((e) => Object.values(e.constraints)).flat(1),
			);

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is the owner of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (channel.owner.id != client.user.id)
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not the owner of the channel'],
			};

		// Update channel
		return this.channelsService.update(payload.id, payload);
	}

	/*
	 * Join a channel.
	 * Will be rejected if the channel is private.
	 * Will be rejected if the channel is password protected and the password is wrong.
	 */
	@SubscribeMessage('channels_join')
	async join(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.code === undefined)
			errors.push('Channel code is not specified');

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		const channel = await this.channelsService.findOneByCode(
			payload.code,
			true,
		);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		// Check that the channel is not private
		if (channel.visibility == Visibility.Private) {
			// Check that the client have been invited
			if (
				!channel.invited.find(
					(invitation) => invitation.user.id == client.user.id,
				)
			)
				return {
					code: 403,
					message: 'Forbidden',
					errors: ['Channel is private'],
				};
		}
		// Check that the channel is not password protected or that the password is correct
		else if (channel.visibility == Visibility.PasswordProtected) {
			if (payload.password === undefined)
				return {
					code: 400,
					message: 'Bad request',
					errors: ['Password is not specified'],
				};
			else if (
				!(await bcrypt.compare(payload.password, channel.password_hash))
			)
				return {
					code: 403,
					message: 'Forbidden',
					errors: ['Wrong password'],
				};
		}

		// Join channel
		const joinReturn = await this.channelsService.join(
			client.user,
			channel,
		);
		if (joinReturn instanceof Date) {
			return {
				code: 403,
				message: 'Forbidden',
				errors: [
					'You are banned from this channel until ' +
						joinReturn.toISOString(),
				],
			};
		} else return joinReturn;
	}

	/*
	 * List channels joined by the client.
	 */
	@SubscribeMessage('channels_list')
	async list(client: any) {
		return this.channelsService.listJoined(client.user);
	}

	/*
	 * Leave a channel.
	 */
	@SubscribeMessage('channels_leave')
	async leave(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};

		// Check that the client is in the channel
		if (!channel.members.find((u) => u.id == client.user.id))
			return {
				code: 400,
				message: 'Bad request',
				errors: ['You are not in the channel'],
			};

		// TODO: remove from muted, banned and invited
		this.channelsService.removeAdmin(client.user, channel);

		// Leave channel
		return this.channelsService.leave(client.user, channel);
	}

	/*
	 * Add admin to a channel.
	 * The client need to be the owner of the channel.
	 * The user to add as admin need to be in the channel.
	 */
	@SubscribeMessage('channels_addAdmin')
	async addAdmin(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is the owner of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (channel.owner.id != client.user.id)
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not the owner of the channel'],
			};
		// Check that the user to add as admin exists
		const user = await this.usersService.findOne(payload.user_id);
		if (!user)
			return {
				code: 404,
				message: 'Not found',
				errors: ['User not found'],
			};
		// Check that the user to add as admin is in the channel
		if (!channel.members.find((u) => u.id == user.id))
			return {
				code: 400,
				message: 'Bad request',
				errors: ['User is not in the channel'],
			};

		// Update channel
		return this.channelsService.addAdmin(user, channel);
	}

	/*
	 * Add admin to a channel.
	 * The client need to be the owner of the channel.
	 * The user to add as admin need to be in the channel.
	 */
	@SubscribeMessage('channels_removeAdmin')
	async removeAdmin(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is the owner of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (channel.owner.id != client.user.id)
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not the owner of the channel'],
			};
		// Check that the user to add as admin exists
		const user = await this.usersService.findOne(payload.user_id);
		if (!user)
			return {
				code: 404,
				message: 'Not found',
				errors: ['User not found'],
			};
		// Check that the user is an admin of the channel
		if (!channel.admins.find((u) => u.id == user.id))
			return {
				code: 400,
				message: 'Bad request',
				errors: ['User is not an admin of the channel'],
			};

		// Update channel
		return this.channelsService.removeAdmin(user, channel);
	}

	/*
	 * Ban a user from a channel for a limited time.
	 * The client need to be an admin of the channel.
	 */
	@SubscribeMessage('channels_banUser')
	async ban(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
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
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is an admin of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (!channel.admins.find((u) => u.id == client.user.id))
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not an admin of the channel'],
			};
		// Check that the user to ban exists
		const user = await this.usersService.findOne(payload.user_id);
		if (!user)
			return {
				code: 404,
				message: 'Not found',
				errors: ['User not found'],
			};

		// Update channel
		return this.channelsService.banUser(user, channel, until.toJSDate());
	}

	/*
	 * Mute a user from a channel for a limited time.
	 * The client need to be an admin of the channel.
	 */
	@SubscribeMessage('channels_muteUser')
	async mute(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
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
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is an admin of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (!channel.admins.find((u) => u.id == client.user.id))
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not an admin of the channel'],
			};
		// Check that the user to mute exists
		const user = await this.usersService.findOne(payload.user_id);
		if (!user)
			return {
				code: 404,
				message: 'Not found',
				errors: ['User not found'],
			};

		// Update channel
		return this.channelsService.muteUser(user, channel, until.toJSDate());
	}

	/*
	 * Invite a user to a channel.
	 * The client need to be an admin of the channel.
	 */
	@SubscribeMessage('channels_inviteUser')
	async inviteUser(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.user_id === undefined)
			errors.push('User id is not specified');

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is an admin of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (!channel.admins.find((u) => u.id == client.user.id))
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not an admin of the channel'],
			};
		// Check that the user to invite exists TODO: might always be true if the user is in the admin list
		const user = await this.usersService.findOne(payload.user_id);
		if (!user)
			return {
				code: 404,
				message: 'Not found',
				errors: ['User not found'],
			};

		// Update channel
		return this.channelsService.inviteUser(client.user, user, channel);
	}

	/*
	 * Send a message to a channel.
	 * The client need to be a member of the channel.
	 * The client need to not be muted in the channel.
	 */
	@SubscribeMessage('channels_sendMessage')
	async sendMessage(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.message === undefined)
			errors.push('Message is not specified');

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is a member of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (!channel.members.find((u) => u.id == client.user.id))
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not a member of the channel'],
			};

		// Update channel
		return this.channelsService.sendMessage(
			client.user,
			channel,
			payload.message,
		);
	}

	/*
	 * Get messages of a channel.
	 * The client need to be a member of the channel.
	 * Return the 50 message before the given date.
	 */
	@SubscribeMessage('channels_messages')
	async getMessages(client: any, payload: any) {
		const errors: Array<string> = [];

		// Check that payload is not undefined
		if (payload === undefined) errors.push('Empty payload');
		if (payload.id === undefined)
			errors.push('Channel id is not specified');
		if (payload.before === undefined)
			errors.push('Before date is not specified');

		const before = DateTime.fromISO(payload.before);
		if (!before.isValid) errors.push('Before date: ', before.invalidReason);

		if (errors.length != 0)
			return {
				code: 400,
				message: 'Bad request',
				errors: errors,
			};

		// Check that the client is a member of the channel
		const channel = await this.channelsService.findOne(payload.id);
		if (!channel)
			return {
				code: 404,
				message: 'Not found',
				errors: ['Channel not found'],
			};
		else if (!channel.members.find((u) => u.id == client.user.id))
			return {
				code: 403,
				message: 'Forbidden',
				errors: ['You are not an admin of the channel'],
			};

		// Update channel
		const message = this.channelsService.getMessages(
			client.user,
			channel,
			before.toJSDate(),
		);

		// List client rooms
		console.log(client.rooms);
		console.log(`sending in channel_${channel.id}`);
		client.to(client.rooms[0]).emit('channels_message', message);
		client.to(`channel_${channel.id}`).emit('channels_message', message);
		client.socket.emit('channels_message', message);
		return message;
	}
}
