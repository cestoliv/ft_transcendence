import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
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

	findOne(id: number) {
		return this.usersRepository.findOneBy({ id });
	}

	findOneBy42Id(id42: number) {
		return this.usersRepository.findOneBy({ id42 });
	}

	update(id: number, updateUserDto: UpdateUserDto) {
		return this.usersRepository.update({ id }, updateUserDto);
	}

	remove(id: number) {
		return `This action removes a #${id} user`;
	}
}
