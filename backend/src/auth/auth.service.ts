import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	Req,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
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

	async signToken(data: {
		totp_enabled: boolean;
		totp_validated: boolean;
		user: User;
	}): Promise<string> {
		return this.jwtService.sign({
			totp_enabled: data.totp_enabled,
			totp_validated: data.totp_validated,
			user: {
				id: data.user.id,
				id42: data.user.id42,
				username: data.user.username,
			},
		});
	}

	async getUserFromToken(token: string): Promise<User> {
		let payload: User;
		try {
			payload = this.jwtService.verify(token)['user'];
		} catch (error) {
			throw new Error('Invalid token');
		}
		return this.usersService.findOne(payload.id, { withTotp: true });
	}

	async oauthCallback(code: string): Promise<string> {
		// Exchange code for token
		const res = await fetch(
			`https://api.intra.42.fr/oauth/token?grant_type=authorization_code&client_id=${this.configService.get(
				'API42_CLIENT_ID',
			)}&client_secret=${this.configService.get(
				'API42_CLIENT_SECRET',
			)}&code=${code}&redirect_uri=${this.configService.get(
				'API42_REDIRECT_URI',
			)}`,
			{
				method: 'POST',
			},
		);

		const data = await res.json();
		if (!res.ok || !data.access_token || !data.refresh_token) {
			throw new BadRequestException(data);
		}

		// Get user info
		const userRes = await fetch('https://api.intra.42.fr/v2/me', {
			headers: {
				Authorization: `Bearer ${data.access_token}`,
			},
		});

		const userData = await userRes.json();
		if (!userRes.ok || !userData) {
			throw new BadRequestException(userData);
		}

		// Create user if not exists
		let user = await this.usersService.findOneBy42Id(userData.id, {
			withTotp: true,
			with42ProfilePicture: true,
		});
		if (!user) {
			// Find a unique username
			let newUsername = userData.login;
			let suffix = 1;
			while (await this.usersService.findOneByUsername(newUsername)) {
				newUsername = `${userData.login}${suffix}`;
				suffix++;
			}
			user = await this.usersService.create({
				id42: userData.id,
				username: newUsername,
				otp: null,
				profile_picture_42: userData.image.link,
			});
			await this.usersService.set42ProfilePicture(user);
		}

		// Update 42 user profile picture if changed
		if (user.profile_picture_42 !== userData.image.link) {
			console.log('Updating profile picture');
			user.profile_picture_42 = userData.image.link;
			await this.usersService.save(user);
		}

		const totp_enabled = user.otp != null && user.otp != '' ? true : false;
		const bearer = await this.signToken({
			totp_enabled,
			totp_validated: false,
			user,
		});

		return bearer;
	}

	async noOauthCallback(username: string): Promise<string> {
		// Get user info
		const user = await this.usersService.findOneByUsername(username, {
			withTotp: true,
		});
		if (!user) {
			throw new NotFoundException('User not found');
		}
		if (user.otp == null || user.otp == '') {
			throw new BadRequestException('User has no TOTP enabled');
		}

		const bearer = await this.signToken({
			totp_enabled: true,
			totp_validated: false,
			user,
		});

		return bearer;
	}

	async validateTOTP(@Req() request, otp: string): Promise<string> {
		// Extract user token from bearer
		let token = '';
		if (
			request.headers.authorization &&
			request.headers.authorization.split(' ')[0] === 'Bearer'
		)
			token = request.headers.authorization.split(' ')[1];

		// Decode user token
		let userPayload = {};
		try {
			userPayload = this.jwtService.verify(token)['user'];
		} catch (e) {
			throw new UnauthorizedException('Invalid token');
		}

		// Get user and check TOTP
		const user = await this.usersService.findOne(userPayload['id'], {
			withTotp: true,
		});

		const isTotpValid = authenticator.check(otp, user.otp);

		if (!isTotpValid) {
			throw new UnauthorizedException('Invalid TOTP');
		}

		// Sign new token
		const totp_enabled = user.otp != null && user.otp != '' ? true : false;
		return await this.signToken({
			totp_enabled,
			totp_validated: true,
			user,
		});
	}
}
