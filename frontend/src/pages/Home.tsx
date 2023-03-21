import React, { useContext } from 'react';
import { SocketContext } from '../context/socket';
import { Link } from 'react-router-dom';

const Home = () => {
	const socket = useContext(SocketContext);
	window.socket = socket;

	const handleGithub = () => {
		window.open('https://github.com/cestoliv/ft_transcendence', '_blank', 'noopener,noreferrer');
	};

	return (
		<div className="home">
			<div className="welcome">
				<h2>Welcome to</h2>
				<h2>
					<span>42</span>Pong
				</h2>
			</div>
			<Link className="nes-btn is-primary" to="/searchGame">
				Play !
			</Link>
			<div onClick={handleGithub} className="made-by typing">
				<p>Made with</p>
				<img src="https://cdn.pixabay.com/photo/2017/09/23/16/33/pixel-heart-2779422_1280.png" alt="Heart" />
				<p>by hprudhom, ocartier, mservage, paime.</p>
			</div>
		</div>
	);
};

export default Home;
