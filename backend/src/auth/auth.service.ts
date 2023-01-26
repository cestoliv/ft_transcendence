import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
	) {}

	// async validateToken(token: string): Promise<any> {
	// 	// const user = await this.usersService.findOneByToken(token);
	// 	const user = { id: 1, test: token };
	// 	if (user) {
	// 		return user;
	// 	}
	// 	return null;
	// }

	async signToken(data: any): Promise<string> {
		return this.jwtService.sign(data);
	}
}
