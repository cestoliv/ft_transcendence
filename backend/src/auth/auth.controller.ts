import {
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

	/*
	 * Rdirect to 42 Oauth
	 * (No guards)
	 */
	@Get('/login')
	login(@Res() response) {
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
		// Generate TOTP secret
		const secret = authenticator.generateSecret();
		const url = authenticator.keyuri('', 'Transcendence', secret);

		// Update user TOTP secret
		await this.usersService.update(request.user.id, {
			otp: secret,
		});
		return response.send({ secret, url });
	}

	/*
	 * Validate TOTP code, and return a new bearer token
	 *  (valid for the entire API)
	 * (No guards, but the bearer token must be valid)
	 */
	@Post('/totp/:otp')
	async validateTOTP(@Req() request, @Param('otp') otp: string) {
		return { bearer: await this.authService.validateTOTP(request, otp) };
	}
}
