import { ConfigService } from '@nestjs/config';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from 'src/base.gateway';

@WebSocketGateway({
	cors: {
		origin: async (origin, callback) => {
			const configService = new ConfigService();
			callback(null, configService.get<string>('FRONTEND_URL') || '*');
		},
		credentials: true,
	},
})
export class UsersGateway extends BaseGateway {
	@SubscribeMessage('message')
	handleMessage(client: any, payload: any): string {
		return `Hello ${client.user.username}, you said: ${payload}`;
	}
}
