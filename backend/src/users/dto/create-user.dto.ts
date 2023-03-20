import {
	IsBoolean,
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

	@IsOptional()
	@MaxLength(255)
	@IsNotEmpty()
	username: string;

	@IsString()
	@IsOptional()
	otp: string;

	@IsBoolean()
	@IsNotEmpty()
	firstConnection: boolean;

	@IsString()
	@IsOptional()
	profile_picture_42: string;
}
