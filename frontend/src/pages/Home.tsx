import React, { useContext } from 'react';
import { SocketContext } from '../context/socket';
import { NavLink } from 'react-router-dom';

const Home = () => {
	const socket = useContext(SocketContext);
	window.socket = socket;

	return (
		<div className="home">
			<div className="welcome">
				<h2>Welcome to</h2>
				<h2>
					<span>42</span>Pong
				</h2>
			</div>
			<button className="nes-btn">
				<NavLink to="/searchGame">Play !</NavLink>
			</button>
		</div>
	);
};

export default Home;
