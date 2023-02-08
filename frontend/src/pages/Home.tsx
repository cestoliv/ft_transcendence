import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/socket';
import { IAuth, IUser } from '../interfaces';

const Home = (props: { user: IUser; auth: IAuth }) => {
	const socket = useContext(SocketContext);

	window.socket = socket;

	const [message, setMessage] = useState('');

	// useEffect(() => {
	// 	console.log('Home useEffect');
	// 	// socket.emit('message', 'Hello from the client', (data: any) => {
	// 	// 	console.log('Message from server:', data);
	// 	// 	setMessage(data);
	// 	// });
	// }, [socket]);

	socket.off('channels_message'); // Unbind previous event
	socket.on('channels_message', (data: any) => {
		console.log('Socket channels_message:');
		console.log(data);
	});

	return (
		<div className="home">
			<h1>My progression</h1>
			<p>User: {props.user.username}</p>
			{socket.connected ? (
				<div className="chat-container">
					<div>Socket Connected</div>
					<p>Last message from socket: {message}</p>
				</div>
			) : (
				<div>Socket Not Connected</div>
			)}

			<button className="button-start-game">Start a game</button>
		</div>
	);
};

export default Home;
