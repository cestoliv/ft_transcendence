import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
	) {}

	async validateToken(token: string): Promise<any> {
		const payload = this.jwtService.verify(token);
		if (!payload) return false;

		const user = await this.usersService.findOne(payload.id);
		if (!user) return false;

		return user;
	}

	async signToken(data: any): Promise<string> {
		return this.jwtService.sign(data);
	}

	async getUserFromToken(token: string): Promise<User> {
		let payload: User;
		try {
			payload = this.jwtService.verify(token);
		} catch (error) {
			throw new Error('Invalid token');
		}
		return this.usersService.findOne(payload.id);
	}
}
