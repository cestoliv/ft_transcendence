import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { PayloadTooLargeException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import fastifyCookie from '@fastify/cookie';
import fmp from '@fastify/multipart';
import { FastifyError } from 'fastify';
import { AppModule } from './app.module';

async function bootstrap() {
	const fastifyAdapter = new FastifyAdapter();
	// Enable Multipart
	fastifyAdapter.register(fmp, {
		throwFileSizeLimit: false,
		limits: {
			fileSize: 10000000, // 10 mb
			files: 1,
		},
	});

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		fastifyAdapter,
	);
	const config = app.get<ConfigService>(ConfigService);

	// Handle Entity too large error
	// app.getHttpAdapter()
	// 	.getInstance()
	// 	.addHook('onError', (req, res, error, done) => {
	// 		console.log(error);
	// 		if (error.statusCode === 413) {
	// 			console.log('413');
	// 			throw new PayloadTooLargeException('ergerg');
	// 		} else {
	// 			done(error);
	// 		}
	// 	});

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
