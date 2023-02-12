import {
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
import { AuthService } from 'src/auth/auth.service';
import { FindOptionsSelect, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFriend } from './entities/user-friend.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		@InjectRepository(UserFriend)
		private readonly userFriendsRepository: Repository<UserFriend>,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
	) {}

	create(createUserDto: CreateUserDto) {
		const user = new User();
		user.id42 = createUserDto.id42;
		user.username = createUserDto.username;
		user.otp = createUserDto.otp;

		return this.usersRepository.save(user);
	}

	findAll() {
		return this.usersRepository.find({
			relations: ['invitedFriends', 'friendOf'],
		});
	}

	findOne(id: number, withTotp = false) {
		const select = ['id', 'id42', 'username'];
		if (withTotp) select.push('otp');
		return this.usersRepository.findOne({
			where: { id },
			select: select as FindOptionsSelect<User>,
			relations: ['invitedFriends', 'friendOf'],
		});
	}

	findOneBy42Id(id42: number, withTotp = false) {
		const select = ['id', 'id42', 'username'];
		if (withTotp) select.push('otp');
		return this.usersRepository.findOne({
			where: { id42 },
			select: select as FindOptionsSelect<User>,
			relations: ['invitedFriends', 'friendOf'],
		});
	}

	findOneByUsername(username: string, withTotp = false) {
		const select = ['id', 'id42', 'username'];
		if (withTotp) select.push('otp');
		return this.usersRepository.findOne({
			where: { username },
			select: select as FindOptionsSelect<User>,
			relations: ['invitedFriends', 'friendOf'],
		});
	}

	async update(updater: User, id: number, updateUserDto: UpdateUserDto) {
		const user = await this.findOne(id);
		if (!user) throw new NotFoundException('User not found');
		if (user.id !== updater.id)
			throw new ForbiddenException('You can only update your own user');

		user.username = updateUserDto.username;
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

		if (newFriend.friends.includes(inviter)) {
			throw new ConflictException(
				'User already invited or already friend',
			);
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
}
