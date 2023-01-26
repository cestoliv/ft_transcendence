import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(private configService: ConfigService) {
		// const JWT_SECRET = configService.get<string>('JWT_SECRET');

		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				// JwtStrategy.extractJWT,
				ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			ignoreExpiration: false,
			secretOrKey: configService.get('JWT_SECRET'),
		});
	}

	// private static extractJWT(req: Request): string | null {
	// 	if (
	// 		req.cookies &&
	// 		'auth-token' in req.cookies &&
	// 		req.cookies['auth-token'].length > 0
	// 	) {
	// 		return req.cookies['auth-token'];
	// 	}
	// 	return null;
	// }

	async validate(payload: any) {
		if (payload.totp_enabled && !payload.totp_validated)
			throw new UnauthorizedException(
				'TOTP not validated, go to /api/v1/auth/totp',
			);
		return {
			...payload.user,
		};
	}
}
