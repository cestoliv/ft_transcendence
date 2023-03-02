import {
	Controller,
	Get,
	Res,
	Req,
	UseGuards,
	Post,
	BadRequestException,
	Param,
	StreamableFile,
	NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
@Controller('/api/v1/users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	/*
	 * Return the user object of the logged in user
	 * (Jwt guard)
	 */
	@Get('/me')
	@UseGuards(JwtAuthGuard)
	async me(@Res() response, @Req() request) {
		// Create a user object without the totpSecret
		return response.send(this.usersService.findOne(request.user.id));
	}

	/*
	 * Upload a new profile-picture for the logged in user
	 * (Jwt guard)
	 */
	@Post('/profile-picture')
	@UseGuards(JwtAuthGuard)
	async uploadProfilePicture(@Res() response, @Req() request) {
		const data = await request.file();
		if (!data || !data.file)
			throw new BadRequestException('No file uploaded');

		return response.send(
			await this.usersService.updateProfilePicture(
				request.user,
				data.file,
			),
		);
	}

	/*
	 * Generate a random avatar
	 * (Jwt guard)
	 */
	@Get('/profile-picture/generate')
	@UseGuards(JwtAuthGuard)
	async generateProfilePicture(@Res() response, @Req() request) {
		return response.send(
			await this.usersService.generateAvatar(request.user),
		);
	}

	/*
	 * Fetch the 42 profile picture
	 * (Jwt guard)
	 */
	@Get('/profile-picture/fetch42')
	@UseGuards(JwtAuthGuard)
	async fetch42ProfilePicture(@Res() response, @Req() request) {
		let user = await this.usersService.findOne(request.user.id, {
			with42ProfilePicture: true,
		});
		if (!user) throw new NotFoundException('User not found');

		user = await this.usersService.set42ProfilePicture(user);
		return response.send(user);
	}

	/*
	 * Return the profile picture of the user with the given id
	 */
	@Get('/profile-picture/:id')
	async getProfilePicture(
		@Param('id') id: number,
		@Res() response,
	): Promise<StreamableFile> {
		const ppPath = path.join(
			'./',
			'uploads',
			'profile-pictures',
			`${id}.webp`,
		);
		if (!fs.existsSync(ppPath))
			throw new NotFoundException('No profile picture found');
		const file = fs.createReadStream(ppPath);

		return response.type('image/webp').send(file);
	}
}
