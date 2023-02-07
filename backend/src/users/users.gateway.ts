import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from 'src/base.gateway';

@WebSocketGateway({
	cors: {
		// TODO: Should use ConfigService instead of process.env
		origin: process.env.FRONTEND_URL || '*',
		credentials: true,
	},
})
export class UsersGateway {
	@SubscribeMessage('message')
	handleMessage(client: any, payload: any): string {
		return `Hello ${client.user.username}, you said: ${payload}`;
	}
}
