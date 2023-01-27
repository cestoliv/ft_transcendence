import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: 'http://transcendence.local',
	});
	await app.listen(3000);
}
bootstrap();
