import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';
import { Visibility } from '../enums/visibility.enum';

export class CreateChannelDto {
	@IsString()
	@MaxLength(255)
	@IsNotEmpty()
	name: string;

	@IsEnum(Visibility)
	@IsString()
	@IsOptional()
	visibility: Visibility;

	@IsString()
	@IsOptional()
	password: string;
}
