import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';

@Controller('/api/v1/auth')
export class AuthController {
	constructor(
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
	) {}

	/*
	 * Redirect to 42 Oauth or login with username
	 * (No guards)
	 */
	@Get('/login')
	async login(@Res() response, @Query('username') username: string) {
		if (username) {
			const bearer = await this.authService.noOauthCallback(username);

			response.setCookie('bearer', bearer, {
				domain: this.configService.get('COOKIE_DOMAIN'),
				path: '/',
				// secure: true, // only when HTTPS is enabled
				httpOnly: false,
				sameSite: 'strict',
			});
			return response.code(200).send({
				bearer: bearer,
			});
			return response
				.code(303)
				.redirect(this.configService.get('FRONTEND_URL'));
		} else {
			response
				.code(303)
				.redirect(
					`https://api.intra.42.fr/oauth/authorize?client_id=${this.configService.get(
						'API42_CLIENT_ID',
					)}&redirect_uri=${this.configService.get(
						'API42_REDIRECT_URI',
					)}&response_type=code`,
				);
		}
	}
	/*
	 * Register a new user without 42 Oauth
	 * No 42 users are forced to use TOTP
	 * (No guards)
	 */
	@Post('/register')
	async register(@Res() response, @Body('username') username: string) {
		if (!username) {
			return response.code(400).send({
				error: 'Username is required',
			});
		}

		let user: User;
		try {
			user = await this.usersService.create({
				id42: null,
				username: username,
				otp: null,
			});
		} catch (error) {
			// Catch duplicate username error
			if (error.code === '23505') {
				return response.code(409).send({
					error: 'Username already taken',
				});
			}
		}
		const totp_settings = await this.usersService.enableTotp(user);

		return response.code(201).send({
			user: user,
			secret: totp_settings.secret,
			url: totp_settings.url,
		});
	}

	/*
	 * Callback from 42 Oauth
	 * 42 Oauth will redirect to this route with a code
	 * We exchange the code for a bearer token
	 *  that will only be valid for user who has NOT enabled TOTP.
	 *  For users who have enabled TOTP, this token will be only valid
	 *  for the route /api/v1/auth/totp/:otp
	 * (No guards)
	 */
	@Get('/42oauth')
	async oauthCallback(@Res() response, @Query('code') code: string) {
		const bearer = await this.authService.oauthCallback(code);

		response.setCookie('bearer', bearer, {
			domain: this.configService.get('COOKIE_DOMAIN'),
			path: '/',
			// secure: true, // only when HTTPS is enabled
			httpOnly: false,
			sameSite: 'strict',
		});
		return response
			.code(303)
			.redirect(this.configService.get('FRONTEND_URL'));
	}

	/*
	 * Enable TOTP auth for the user who is logged in
	 * (JWT guard)
	 */
	@Post('/totp/enable')
	@UseGuards(JwtAuthGuard)
	async totpEnable(@Res() response, @Req() request) {
		return response.send(this.usersService.enableTotp(request.user));
	}

	/*
	 * Validate TOTP code, and return a new bearer token
	 *  (valid for the entire API)
	 * (No guards, but the bearer token must be valid)
	 */
	@Post('/totp/:otp')
	async validateTOTP(@Req() request, @Param('otp') otp: string) {
		console.log(request)
		return { bearer: await this.authService.validateTOTP(request, otp) };
	}
}
