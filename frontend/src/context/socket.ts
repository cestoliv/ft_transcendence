import React from 'react';
import socketio from 'socket.io-client';

// Don't connect immediately, wait for the user to log in
export const socket = socketio('http://api.transcendence.local', {
	withCredentials: true,
	autoConnect: false,
});
export const SocketContext = React.createContext(socket);
