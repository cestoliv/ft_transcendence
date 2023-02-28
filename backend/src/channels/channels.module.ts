import { forwardRef, Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsGateway } from './channels.gateway';
import { Channel } from './entities/channel.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { ChannelMutedUser } from './entities/channel-muted.entity';
import { ChannelBannedUser } from './entities/channel-banned.entity';
import { ChannelInvitedUser } from './entities/channel-invited.entity';
import { ChannelMessage } from './entities/channel-message.entity';
import { GamesModule } from 'src/games/games.module';
import { AppModule } from 'src/app.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Channel,
			ChannelBannedUser,
			ChannelMutedUser,
			ChannelInvitedUser,
			ChannelMessage,
		]),
		forwardRef(() => UsersModule),
		forwardRef(() => GamesModule),
		forwardRef(() => AppModule),
	],
	providers: [ChannelsGateway, ChannelsService],
	exports: [ChannelsService],
})
export class ChannelsModule {}
