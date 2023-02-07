import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';
import { AuthService } from 'src/auth/auth.service';
import { FindOptionsSelect, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		private readonly jwtService: JwtService,
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
		return this.usersRepository.find();
	}

	findOne(id: number, withTotp = false) {
		const select = ['id', 'id42', 'username'];
		if (withTotp) select.push('otp');
		return this.usersRepository.findOne({
			where: { id },
			select: select as FindOptionsSelect<User>,
		});
	}

	findOneBy42Id(id42: number, withTotp = false) {
		const select = ['id', 'id42', 'username'];
		if (withTotp) select.push('otp');
		return this.usersRepository.findOne({
			where: { id42 },
			select: select as FindOptionsSelect<User>,
		});
	}

	update(id: number, updateUserDto: UpdateUserDto) {
		return this.usersRepository.update({ id }, updateUserDto);
	}

	remove(id: number) {
		return this.usersRepository.delete({ id });
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
}
