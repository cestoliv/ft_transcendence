import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { ChannelsModule } from './channels/channels.module';
import { Channel } from './channels/entities/channel.entity';
import { ChannelBannedUser } from './channels/entities/channel-banned.entity';
import { ChannelMutedUser } from './channels/entities/channel-muted.entity';
import { ChannelInvitedUser } from './channels/entities/channel-invited.entity';
import { ChannelMessage } from './channels/entities/channel-message.entity';
import { UserFriend } from './users/entities/user-friend.entity';
import { BannedUser } from './users/entities/user-banned.entity';
import { MutedUser } from './users/entities/user-muted.entity';
import { UserMessage } from './users/entities/user.message.entity';
import { GamesModule } from './games/games.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Game } from './games/entities/game.entity';
import { ConnectedClientsService } from './base.gateway';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get('DB_HOST'),
				port: configService.get('DB_PORT'),
				username: configService.get('DB_USER'),
				password: configService.get('DB_PASS'),
				database: configService.get('DB_NAME'),
				entities: [
					User,
					UserFriend,
					BannedUser,
					MutedUser,
					UserMessage,
					Channel,
					ChannelBannedUser,
					ChannelMutedUser,
					ChannelInvitedUser,
					ChannelMessage,
					Game,
				],
				synchronize: true,
			}),
			inject: [ConfigService],
		}),
		ScheduleModule.forRoot(),
		UsersModule,
		AuthModule,
		ChannelsModule,
		GamesModule,
	],
	controllers: [AppController],
	providers: [AppService, ConnectedClientsService],
	exports: [ConnectedClientsService],
})
export class AppModule {}
