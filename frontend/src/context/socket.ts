import React from 'react';
import socketio, { Socket } from 'socket.io-client';

// Don't connect immediately, wait for the user to log in
export const socket: Socket = socketio(`${process.env.REACT_APP_SOCKET_URL}`, {
	withCredentials: true,
	autoConnect: false,
});
export const SocketContext = React.createContext(socket);
