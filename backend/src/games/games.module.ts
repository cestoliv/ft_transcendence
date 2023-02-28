import { forwardRef, Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesGateway } from './games.gateway';
import { UsersModule } from 'src/users/users.module';
import { ChannelsModule } from 'src/channels/channels.module';
import { Game } from './entities/game.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Game]),
		forwardRef(() => UsersModule),
		forwardRef(() => ChannelsModule),
		forwardRef(() => AppModule),
	],
	providers: [GamesGateway, GamesService],
	exports: [GamesService],
})
export class GamesModule {}
