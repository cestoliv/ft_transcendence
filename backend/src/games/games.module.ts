import { forwardRef, Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { UsersModule } from 'src/users/users.module';
import { ChannelsModule } from 'src/channels/channels.module';
import { ConnectedClientsService } from 'src/base.gateway';

@Module({
	imports: [forwardRef(() => UsersModule), forwardRef(() => ChannelsModule)],
	providers: [GamesGateway, GamesService, ConnectedClientsService],
	exports: [GamesService],
})
export class GamesModule {}
