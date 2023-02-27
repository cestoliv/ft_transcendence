import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';

export class CreateUserDto {
	@IsNotEmpty()
	@IsNumber()
	id42: number;

	@IsString()
	@MaxLength(255)
	@IsNotEmpty()
	username: string;

	@IsString()
	@IsOptional()
	otp: string;

	@IsString()
	@IsOptional()
	profile_picture_42: string;
}
