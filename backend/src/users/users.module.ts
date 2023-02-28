import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersGateway } from './users.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { ChannelsModule } from 'src/channels/channels.module';
import { UserFriend } from './entities/user-friend.entity';
import { BannedUser } from './entities/user-banned.entity';
import { MutedUser } from './entities/user-muted.entity';
import { UserMessage } from './entities/user.message.entity';
import { GamesModule } from 'src/games/games.module';
import { AppModule } from 'src/app.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			UserFriend,
			BannedUser,
			MutedUser,
			UserMessage,
		]),
		forwardRef(() => AuthModule),
		forwardRef(() => ChannelsModule),
		forwardRef(() => GamesModule),
		forwardRef(() => AppModule),
	],
	controllers: [UsersController],
	providers: [UsersService, UsersGateway],
	exports: [UsersService],
})
export class UsersModule {}
