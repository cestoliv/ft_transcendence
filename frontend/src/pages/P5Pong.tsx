import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { message, Modal } from 'antd';
import Sketch from 'react-p5';
import p5Types from 'p5'; //Import this for typechecking and intellisense
import { IUser, IAuth } from '../interfaces';
import { SocketContext } from '../context/socket';
import useAuth from '../hooks/useAuth';
import { throttle } from '../utils';
import { useNavigate } from 'react-router-dom';
import useGameInfo from '../hooks/useGameInfo';

const Canvas = ({ gameId, socket }) => {
	const { gameInfo, setGameInfo } = useGameInfo();
	const computeCanvasSize = () => {
		const parent = document.getElementById('game-container');
		let width = parent?.offsetWidth || window.innerWidth;
		let height = parent?.offsetHeight || window.innerHeight;
		// Apply 1:2 ratio
		// TODO: make it more responsive
		if (height > width / 2) height = width / 2;
		else width = height * 2;
		return { width, height };
	};

	// Vars
	let canvasSize: { width: number; height: number } = computeCanvasSize();
	let mP5: p5Types;
	let started = false;

	const ball = {
		x: canvasSize.width / 2,
		y: canvasSize.height / 2,
		radius: 10,
		speed: {
			x: Math.cos(Math.random() * Math.PI * 2) * 4,
			y: Math.sin(Math.random() * Math.PI * 2) * 4,
		},
		draw: function () {
			// yellow
			mP5.stroke(255, 255, 0);
			mP5.fill(255, 255, 0);
			mP5.circle(this.x, this.y, this.radius);
		},
		reset: function () {
			this.x = canvasSize.width / 2;
			this.y = canvasSize.height / 2;
			// Random angle
			const angle = Math.random() * Math.PI * 2;
			this.speed.x = Math.cos(angle) * 4;
			this.speed.y = Math.cos(angle) * 4;
		},
	};
	const me = {
		x: canvasSize.width - 10,
		y: canvasSize.height / 2,
		radius: 30,
		reset: function () {
			this.x = canvasSize.width - 10;
			this.y = canvasSize.height / 2;
		},
		computePosition: function (y: number) {
			return mP5.min(canvasSize.height, mP5.max(y, 0));
		},
		position: function (y: number) {
			if (gameInfo.isWatching)
				this.y = mP5.min(canvasSize.height, mP5.max(y, 0));
			else this.y = this.computePosition(y);
		},
		draw: function () {
			mP5.stroke(255);
			mP5.fill(255);
			mP5.line(
				this.x,
				this.y - this.radius,
				this.x,
				this.y + this.radius,
			);
		},
	};
	const opponent = {
		x: 10,
		y: canvasSize.height / 2,
		radius: 30,
		reset: function () {
			this.x = 10;
			this.y = canvasSize.height / 2;
		},
		position: function (y: number) {
			this.y = mP5.min(canvasSize.height, mP5.max(y, 0));
		},
		draw: function () {
			mP5.stroke(255);
			mP5.fill(255);
			mP5.line(
				this.x,
				this.y - this.radius,
				this.x,
				this.y + this.radius,
			);
		},
	};
	const game = {
		reset: function () {
			ball.reset();
			me.reset();
			opponent.reset();
		},
	};

	const setup = (p5: p5Types, canvasParentRef: Element) => {
		mP5 = p5;
		canvasSize = computeCanvasSize();

		p5.createCanvas(canvasSize.width, canvasSize.height).parent(
			canvasParentRef,
		);
		game.reset();
	};

	const sendPaddlePos = (y: number) => {
		if (y == 0) return;
		// Apply ratio, server side is 512x256
		y = y * (256 / canvasSize.height);
		socket.emit('games_playerMove', { id: gameId, y });
	};
	const throttledSendPaddlePos = throttle(sendPaddlePos, 1000 / 30);

	const draw = (p5: p5Types) => {
		mP5 = p5;
		if (!canvasSize) canvasSize = computeCanvasSize();

		p5.background(0);

		//If pos changed, send it to the server
		if (me.y != me.computePosition(p5.mouseY) && !gameInfo.isWatching) {
			me.position(p5.mouseY);
			throttledSendPaddlePos(p5.mouseY);
		}
		me.draw();

		opponent.draw();
		ball.draw();
	};

	const windowResized = (p5: p5Types) => {
		canvasSize = computeCanvasSize();

		p5.resizeCanvas(canvasSize.width, canvasSize.height);
	};

	// On resize, update the canvas size
	React.useEffect(() => {
		window.addEventListener('resize', () => windowResized(mP5));
		return () =>
			window.removeEventListener('resize', () => windowResized(mP5));
	}, []);

	socket.off('games_start'); // Unbind previous event
	socket.on('games_start', (data: any) => {
		console.log('games_start', data);
		if (mP5) {
			// Start the game at the right time
			let delay = data.startAt - Date.now();
			if (delay < 0) delay = 0;
			setTimeout(() => {
				console.log('start');
				started = true;
			}, delay);
		}
	});
	socket.off('games_opponentMove'); // Unbind previous event
	socket.on('games_opponentMove', (data: any) => {
		console.log('games_opponentMove', data);
		if (mP5) {
			// Apply ratio, server side is 512x25
			opponent.position(data.y * (canvasSize.height / 256));
		}
	});
	socket.off('games_ballMove'); // Unbind previous event
	socket.on('games_ballMove', (data: any) => {
		if (mP5) {
			// Apply ratio, server side is 512x256
			ball.x = data.x * (canvasSize.width / 512);
			ball.y = data.y * (canvasSize.height / 256);
		}
	});

	// Watchers events
	socket.off('games_watch_opponentMove'); // Unbind previous event
	socket.on('games_watch_opponentMove', (data: any) => {
		if (mP5) {
			// Apply ratio, server side is 512x256
			opponent.position(data.y * (canvasSize.height / 256));
		}
		console.log('games_watch_opponentMove', data);
	});
	socket.off('games_watch_creatorMove'); // Unbind previous event
	socket.on('games_watch_creatorMove', (data: any) => {
		console.log('games_watch_creatorMove', data);
		if (mP5) {
			// Apply ratio, server side is 512x256
			me.position(data.y * (canvasSize.height / 256));
		}
	});
	socket.off('games_watch_ballMove'); // Unbind previous event
	socket.on('games_watch_ballMove', (data: any) => {
		if (mP5) {
			// Apply ratio, server side is 512x256
			ball.x = data.x * (canvasSize.width / 512);
			ball.y = data.y * (canvasSize.height / 256);
		}
		console.log('games_watch_ballMove', data);
	});

	return (
		<div className="canvas-wrapper">
			<Sketch setup={setup} draw={draw} />
		</div>
	);
};

const Pong = (props: { user: IUser; auth: IAuth }) => {
	const navigate = useNavigate();
	const params = useParams();
	const gameId = params.gameId;
	const socket = useContext(SocketContext);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { gameInfo, setGameInfo } = useGameInfo();
	// const [gameInfo, setGameInfo] = useState(null);
	const [meInfo, setMeInfo] = useState({});
	const [opponentInfo, setOpponentInfo] = useState({});
	const [endGameInfo, setEndGameInfo] = useState(null);
	const { auth } = useAuth();

	const closeModal = () => {
		setIsModalOpen(false);
	};

	const [gameScore, setGameScore] = React.useState<{
		you: number;
		opponent: number;
	}>({
		you: 0,
		opponent: 0,
	});

	window.socket = socket;

	useEffect(() => {
		if (gameInfo.isWatching) {
			setMeInfo(gameInfo.players[0]);
			setOpponentInfo(gameInfo.players[1]);
		} else {
			setMeInfo(
				gameInfo.players.filter(
					(p: any) => p.user.username === auth.user.username,
				)[0],
			);
			setOpponentInfo(
				gameInfo.players.filter(
					(p: any) => p.user.username !== auth.user.username,
				)[0],
			);
		}
		// if (!gameInfo.isWatching) {
		// 	socket.emit('games_info', { id: gameId }, (data: any) => {
		// 		console.log('games_info', data);
		// 		if (!data) {
		// 			message.error('Game not found');
		// 		}
		// 		setGameInfo(data);
		// 		// setOpponentName()
		// 		setOpponentInfo(data.players.filter((p: any) => p.user.username !== auth.user.username)[0]);
		// 		console.log('opponentInfo', data.players.filter((p: any) => p.user.username !== auth.user.username)[0]);
		// 	});
		// }
	}, []);

	socket.off('games_score');
	socket.on('games_score', (data: any) => {
		setGameScore(data);
		console.log('games_score', data);
	});
	socket.off('games_end'); // Unbind previous event
	socket.on('games_end', (data: any) => {
		setEndGameInfo(data);
		setIsModalOpen(true);
		console.log('games_end', data);
	});

	// Watchers events
	socket.off('games_watch_score'); // Unbind previous event
	socket.on('games_watch_score', (data: any) => {
		console.log('games_watch_score', data);
		setGameScore(data);
	});
	socket.off('games_watch_end'); // Unbind previous event
	socket.on('games_watch_end', (data: any) => {
		console.log('games_watch_end', data);
		setEndGameInfo(data);
		setIsModalOpen(true);
	});

	const stopWatching = () => {
		navigate(-1);
	};

	const quitGame = () => {
		navigate(-1);
	};

	useEffect(() => {
		return () => {
			if (gameInfo) {
				if (gameInfo.isWatching) {
					socket.emit(
						'games_watch_stop',
						{ id: gameId },
						(data: any) => {
							console.log('games_watch_stop', data);
						},
					);
				} else {
					socket.emit('games_quit', { id: gameId }, (data: any) => {
						console.log('games_quit', data);
					});
				}
			}
			setGameInfo(null);
			console.log('unmount');
		};
	}, []);

	return (
		<div className="game-wrapper">
			<div className="game-score">
				<div className="opponent">
					<div className="info">
						<img
							src={opponentInfo?.user?.profile_picture}
							alt="User image"
						/>
						<p>{opponentInfo?.user?.username}</p>
					</div>
					<span className="score">
						{gameInfo.isWatching
							? gameScore.opponent
							: gameScore.opponent}
					</span>
				</div>
				<span>-</span>
				<div className="me">
					<div className="info">
						<img src={meInfo?.user?.profile_picture} />
						<p>{meInfo?.user?.username}</p>
					</div>
					<span className="score">
						{gameInfo.isWatching
							? gameScore.creator
							: gameScore.you}
					</span>
				</div>
			</div>
			<div className="pong-wrapper" id="game-container">
				<Canvas gameId={gameId} socket={socket} />
			</div>
			{endGameInfo && (
				<Modal
					style={{ padding: '0.5rem 0.3rem' }}
					className="nes-dialog is-dark is-rounded"
					open={isModalOpen}
					onOk={closeModal}
					onCancel={closeModal}
					okButtonProps={{ className: 'nes-btn is-primary' }}
					cancelButtonProps={{ className: 'nes-btn is-error' }}
					wrapClassName="end-game-wrapper"
				>
					<div className="end-game">
						<p className="winner">
							Winner :{' '}
							<span>{endGameInfo.winner.user.username}</span>
						</p>
						<div className="game-score">
							<p className="opponent">
								{opponentInfo.user.username}
								<span className="score">
									{endGameInfo.opponent_score}
								</span>
							</p>
							<span>-</span>
							<p className="me">
								<span className="score">
									{gameInfo.isWatching
										? endGameInfo.creator_score
										: endGameInfo.score}
								</span>
								{meInfo.user.username}
							</p>
						</div>
					</div>
				</Modal>
			)}
			{gameInfo.isWatching ? (
				<button
					className="nes-btn quit-button is-error"
					onClick={stopWatching}
				>
					Stop watching
				</button>
			) : (
				<button
					className="nes-btn quit-button is-error"
					onClick={quitGame}
				>
					Quit
				</button>
			)}
			<div className="game-info">
				<p>
					<span className="title">Game ID</span> : {gameId}
				</p>
				<div className="divider"></div>
				{/* convert unix timestamp to date */}
				<p>
					<span className="title">Started at</span> :{' '}
					{new Date(gameInfo.startAt).toLocaleString()}
				</p>
				<div className="divider"></div>
				<div className="players-list">
					<p className="title">Players : </p>
					<div className="list">
						{gameInfo.players.map((player: any) => (
							<div className="player" key={player.user.username}>
								<img
									src={player.user.profile_picture}
									alt="User image"
								/>
								<p>{player.user.username}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Pong;
