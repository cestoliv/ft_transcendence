import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersGateway } from './users.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { ChannelsModule } from 'src/channels/channels.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		forwardRef(() => AuthModule),
		forwardRef(() => ChannelsModule),
	],
	controllers: [UsersController],
	providers: [UsersService, UsersGateway],
	exports: [UsersService],
})
export class UsersModule {}
