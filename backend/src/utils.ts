import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	HttpException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { WSResponse } from './types';

export function genId(length: number) {
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let result = '';
	for (let i = length; i > 0; --i)
		result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

export const isWsResponse = (obj: any): obj is WSResponse => {
	return (
		typeof obj === 'object' &&
		typeof obj.statusCode === 'number' &&
		typeof obj.error === 'string' &&
		Array.isArray(obj.messages)
	);
};

export function exceptionToObj(exception: HttpException): WSResponse {
	if (exception instanceof BadRequestException) {
		return {
			statusCode: 400,
			error: 'Bad request',
			messages: [exception.message],
		};
	} else if (exception instanceof UnauthorizedException) {
		return {
			statusCode: 401,
			error: 'Unauthorized',
			messages: [exception.message],
		};
	} else if (exception instanceof ForbiddenException) {
		return {
			statusCode: 403,
			error: 'Forbidden',
			messages: [exception.message],
		};
	} else if (exception instanceof NotFoundException) {
		return {
			statusCode: 404,
			error: 'Not found',
			messages: [exception.message],
		};
	} else if (exception instanceof ConflictException) {
		return {
			statusCode: 409,
			error: 'Conflict',
			messages: [exception.message],
		};
	}

	return {
		statusCode: 500,
		error: 'Internal Server Error',
		messages: [exception.message],
	};
}
