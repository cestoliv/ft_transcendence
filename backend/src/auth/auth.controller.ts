import {
	Controller,
	Get,
	Param,
	Post,
	Query,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('/api/v1/auth')
export class AuthController {
	constructor(
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
	) {}

	// Redirect to 42 Oauth
	@Get('/login')
	login(@Res() response) {
		response.redirect(
			`https://api.intra.42.fr/oauth/authorize?client_id=${this.configService.get(
				'API42_CLIENT_ID',
			)}&redirect_uri=${this.configService.get(
				'API42_REDIRECT_URI',
			)}&response_type=code`,
		);
	}

	// 42 Oauth callback
	@Get('/42oauth')
	async oauthCallback(@Res() response, @Query('code') code: string) {
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
			return response.send(data);
		}

		// Get user info
		const userRes = await fetch('https://api.intra.42.fr/v2/me', {
			headers: {
				Authorization: `Bearer ${data.access_token}`,
			},
		});

		const userData = await userRes.json();
		if (!userRes.ok || !userData) {
			return response.send(userData);
		}

		// Create user if not exists
		let user = await this.usersService.findOneBy42Id(userData.id);
		if (!user) {
			user = await this.usersService.create({
				id42: userData.id,
				username: userData.login,
				otp: null,
			});
		}

		const totp_enabled = user.otp != null && user.otp != '' ? true : false;
		const bearer = await this.authService.signToken({
			totp_enabled,
			totp_validated: false,
			user,
		});

		response.cookie('bearer', bearer, {
			domain: this.configService.get('COOKIE_DOMAIN'),
			path: '/',
			// secure: true, // only when HTTPS is enabled
			httpOnly: false,
			sameSite: 'strict',
		});
		// return response.send({
		// 	totp_enabled,
		// 	bearer,
		// });
		return response.redirect(
			this.configService.get('FRONTEND_REDIRECT_URL'),
		);
	}

	@Post('/totp/enable')
	@UseGuards(JwtAuthGuard)
	async totpEnable(@Res() response, @Req() request) {
		// Generate TOTP secret
		const secret = authenticator.generateSecret();
		const url = authenticator.keyuri('', 'Transcendence', secret);

		// Update user TOTP secret
		await this.usersService.update(request.user.id, {
			otp: secret,
		});

		return response.send({ secret, url });
	}

	@Post('/totp/:otp')
	async totp(@Res() response, @Req() request, @Param('otp') otp: string) {
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
			userPayload = this.jwtService.verify(token);
		} catch (e) {
			throw new UnauthorizedException('Invalid token');
		}

		// Get user and check TOTP
		const user = await this.usersService.findOne(userPayload['id']);

		const isTotpValid = authenticator.check(otp, user.otp);

		if (!isTotpValid) {
			throw new UnauthorizedException('Invalid TOTP');
		}

		// Sign new token
		const totp_enabled = user.otp != null && user.otp != '' ? true : false;
		return response.send({
			totp_enabled,
			bearer: await this.authService.signToken({
				totp_enabled,
				totp_validated: true,
				user,
			}),
		});
	}
}
