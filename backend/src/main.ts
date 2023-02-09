import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	);
	const config = app.get<ConfigService>(ConfigService);

	app.useGlobalPipes(
		new ValidationPipe({ whitelist: true, transform: true }),
	);
	app.enableCors({
		origin: config.get('FRONTEND_URL'),
	});
	await app.register(fastifyCookie, {
		secret: config.get('COOKIE_SECRET'),
	});
	await app.listen(config.get<number>('PORT') || 3000, '::');
}
bootstrap();
