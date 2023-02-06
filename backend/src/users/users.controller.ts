import { Controller, Get, Res, Req, UseGuards } from '@nestjs/common';
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
		const user = {
			id: request.user.id,
			id42: request.user.id42,
			username: request.user.username,
		};
		return response.send(user);
	}

	// @Post()
	// create(@Body() createUserDto: CreateUserDto) {
	// 	return this.usersService.create(createUserDto);
	// }

	// @Get()
	// findAll() {
	// 	return this.usersService.findAll();
	// }

	// @Get(':id')
	// findOne(@Param('id') id: string) {
	// 	return this.usersService.findOne(+id);
	// }

	// @Patch(':id')
	// update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
	// 	return this.usersService.update(+id, updateUserDto);
	// }

	// @Delete(':id')
	// remove(@Param('id') id: string) {
	// 	return this.usersService.remove(+id);
	// }
}
