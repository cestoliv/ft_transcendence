import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import fastifyCookie from '@fastify/cookie';
import fmp from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap() {
	const fastifyAdapter = new FastifyAdapter();
	// Enable Multipart
	fastifyAdapter.register(fmp, {
		limits: {
			fieldNameSize: 100, // Max field name size in bytes
			fieldSize: 1000000, // Max field value size in bytes
			fields: 10, // Max number of non-file fields
			fileSize: 10000000, // For multipart forms, the max file size
			files: 1, // Max number of file fields
			headerPairs: 2000, // Max number of header key=>value pairs
		},
	});

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		fastifyAdapter,
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
