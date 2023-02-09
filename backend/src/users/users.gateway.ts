import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { BaseGateway } from 'src/base.gateway';

@WebSocketGateway(/*{
	cors: {
		origin: process.env.FRONTEND_URL || '*',
		credentials: false,
	},
}*/)
export class UsersGateway extends BaseGateway {
	@SubscribeMessage('message')
	handleMessage(client: any, payload: any): string {
		return `Hello ${client.user.username}, you said: ${payload}`;
	}
}
