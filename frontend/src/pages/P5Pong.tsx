import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { message, Modal } from 'antd';
import Sketch from 'react-p5';
import p5Types from 'p5'; //Import this for typechecking and intellisense
import { IUser, ILocalGameInfo } from '../interfaces';
import { SocketContext } from '../context/socket';
import useAuth from '../hooks/useAuth';
import { throttle } from '../utils';
import { useNavigate } from 'react-router-dom';
import useGameInfo from '../hooks/useGameInfo';

const Canvas = (gameId: any) => {
	gameId = gameId.gameId;
	const socket = useContext(SocketContext);
	const { gameInfo } = useGameInfo();
	const computeCanvasSize = () => {
		const parent = document.getElementById('game-container');
		if (!parent) return { width: 0, height: 0 };
		let width = parent.clientWidth - 8; // -8 for padding
		let height = parent.clientHeight - 8; // -8 for padding
		// Apply 1:2 ratio
		height = Math.floor(width / 2);
		// Cap height to 70% of the screen
		if (height > window.innerHeight * 0.7) {
			height = Math.floor(window.innerHeight * 0.7);
			width = Math.floor(height * 2);
		}
		return { width, height };
	};

	// If !gameInfo, go back with an error
	if (!gameInfo) return <></>;

	// Vars
	const serverScreen = {
		width: 512,
		height: 256,
	};
	let canvasSize: { width: number; height: number } = computeCanvasSize();
	let mP5: p5Types;
	let started = false;

	// Start the game at the right time
	let delay = (gameInfo.startAt || 0) - Date.now();
	if (delay < 0) delay = 0;
	setTimeout(() => {
		started = true;
	}, delay);

	const ball = {
		// Server coordinates
		server_x: serverScreen.width / 2,
		server_y: serverScreen.height / 2,
		server_radius: 10,
		// Client coordinates
		x: 0,
		y: 0,
		radius: 0,
		// Functions
		applyRatio: function () {
			this.x = (this.server_x / serverScreen.width) * canvasSize.width;
			this.y = (this.server_y / serverScreen.height) * canvasSize.height;
			this.radius = (this.server_radius / serverScreen.width) * canvasSize.width;
		},
		position: function (x: number, y: number) {
			this.server_x = x;
			this.server_y = y;
			this.applyRatio();
		},
		reset: function () {
			this.server_x = serverScreen.width / 2;
			this.server_y = serverScreen.height / 2;
			this.applyRatio();
		},
		draw: function () {
			// yellow
			mP5.stroke(255);
			mP5.fill(255);
			mP5.circle(this.x, this.y, this.radius);
		},
	};
	const me = {
		// Server coordinates
		server_x: serverScreen.width - 10,
		server_y: serverScreen.height / 2,
		server_width: 2,
		server_height: gameInfo.paddleHeight,
		// Client coordinates
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		// Functions
		applyRatio: function () {
			this.x = (this.server_x / serverScreen.width) * canvasSize.width;
			this.y = (this.server_y / serverScreen.height) * canvasSize.height;
			this.width = (this.server_width / serverScreen.width) * canvasSize.width;
			this.height = (this.server_height / serverScreen.height) * canvasSize.height;
		},
		reset: function () {
			this.server_x = serverScreen.width - 10;
			this.server_y = serverScreen.height / 2;
			this.applyRatio();
		},
		computePosition: function (y: number) {
			return mP5.min(serverScreen.height - this.server_height / 2, mP5.max(y, 0 + this.server_height / 2));
		},
		position: function (y: number) {
			this.server_y = this.computePosition(y);
			this.applyRatio();
		},
		draw: function () {
			mP5.stroke(255);
			mP5.fill(255);
			// Draw paddle rect
			mP5.rect(this.x, this.y - this.height / 2, this.width, this.height);
		},
	};
	const opponent = {
		// Server coordinates
		server_x: 10 - 2, // -2 for width
		server_y: serverScreen.height / 2,
		server_width: 2,
		server_height: gameInfo.paddleHeight,
		// Client coordinates
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		// Functions
		applyRatio: function () {
			this.x = (this.server_x / serverScreen.width) * canvasSize.width;
			this.y = (this.server_y / serverScreen.height) * canvasSize.height;
			this.width = (this.server_width / serverScreen.width) * canvasSize.width;
			this.height = (this.server_height / serverScreen.height) * canvasSize.height;
		},
		reset: function () {
			this.server_x = 10 - 2; // -2 for width
			this.server_y = serverScreen.height / 2;
			this.applyRatio();
		},
		computePosition: function (y: number) {
			return mP5.min(serverScreen.height - this.server_height / 2, mP5.max(y, 0 + this.server_height / 2));
		},
		position: function (y: number) {
			this.server_y = this.computePosition(y);
			this.applyRatio();
		},
		draw: function () {
			mP5.stroke(255);
			mP5.fill(255);
			// Draw paddle rect
			mP5.rect(this.x, this.y - this.height / 2, this.width, this.height);
		},
	};
	const game = {
		reset: function () {
			ball.reset();
			me.reset();
			opponent.reset();
		},
		draw: function () {
			// Draw a dotted line in the middle (10 dots)
			mP5.stroke(128);
			mP5.strokeCap(mP5.SQUARE);
			mP5.strokeWeight(4);

			const nbDots = 10;
			let dotSize = canvasSize.height / nbDots;
			dotSize += dotSize / nbDots / 2;
			for (let i = 0; i < nbDots; i++) {
				let y1 = i * dotSize + 1;
				if (i == 0) y1--;
				let y2 = i * dotSize + dotSize / 2 + 1;
				if (i == nbDots - 1) y2++;
				mP5.line(canvasSize.width / 2, y1, canvasSize.width / 2, y2);
			}
		},
	};

	const fontRef = useRef<p5Types.Font | null>(null);
	const preload = (p5: p5Types) => {
		mP5 = p5;
		fontRef.current = p5.loadFont('/Press_Start_2P/PressStart2P-Regular.ttf');
	};

	const setup = (p5: p5Types, canvasParentRef: Element) => {
		mP5 = p5;
		canvasSize = computeCanvasSize();

		p5.createCanvas(canvasSize.width, canvasSize.height).parent(canvasParentRef);
		game.reset();
	};

	const sendPaddlePos = (y: number) => {
		if (y <= 0 || y >= serverScreen.height) return;
		socket.emit('games_playerMove', { id: gameId, y });
	};
	const throttledSendPaddlePos = throttle(sendPaddlePos, 1000 / 30);

	const draw = (p5: p5Types) => {
		mP5 = p5;
		if (!canvasSize || canvasSize.height == 0 || canvasSize.width == 0) windowResized();
		if (me.x == 0) me.applyRatio();
		if (opponent.x == 0) opponent.applyRatio();
		if (ball.x == 0 && ball.y == 0) ball.applyRatio();

		p5.background(0);

		//If pos changed, send it to the server
		if (!gameInfo.isWatching && started) {
			const serverMouseY = p5.mouseY * (serverScreen.height / canvasSize.height);

			if (me.server_y != serverMouseY) {
				me.position(serverMouseY);
				throttledSendPaddlePos(serverMouseY);
			}
		}

		game.draw();
		me.draw();
		opponent.draw();

		// Show counter if game not started
		if (!started) {
			const counter = Math.ceil(((gameInfo.startAt || Date.now()) - Date.now()) / 1000);
			p5.textSize(128);
			p5.textAlign(p5.CENTER, p5.CENTER);
			if (fontRef.current) p5.textFont(fontRef.current);
			p5.fill(255);
			p5.text(counter, canvasSize.width / 2, canvasSize.height / 2);
		} else ball.draw();
	};

	const windowResized = () => {
		canvasSize = computeCanvasSize();

		if (mP5) mP5.resizeCanvas(canvasSize.width, canvasSize.height);
		ball.applyRatio();
		me.applyRatio();
		opponent.applyRatio();
	};

	// On resize, update the canvas size
	window.removeEventListener('resize', windowResized);
	window.addEventListener('resize', windowResized);

	socket.off('games_opponentMove'); // Unbind previous event
	socket.on('games_opponentMove', (data: any) => {
		if (mP5) opponent.position(data.y);
	});
	socket.off('games_ballMove'); // Unbind previous event
	socket.on('games_ballMove', (data: any) => {
		if (mP5) ball.position(data.x, data.y);
	});

	// Watchers events
	socket.off('games_watch_opponentMove'); // Unbind previous event
	socket.on('games_watch_opponentMove', (data: any) => {
		if (mP5) opponent.position(data.y);
	});
	socket.off('games_watch_creatorMove'); // Unbind previous event
	socket.on('games_watch_creatorMove', (data: any) => {
		if (mP5) me.position(data.y);
	});
	socket.off('games_watch_ballMove'); // Unbind previous event
	socket.on('games_watch_ballMove', (data: any) => {
		if (mP5) ball.position(data.x, data.y);
	});

	return (
		<div className="canvas-wrapper">
			<Sketch preload={preload} setup={setup} draw={draw} />
		</div>
	);
};

const Pong = () => {
	const navigate = useNavigate();
	const params = useParams();
	const gameId = params.gameId;
	const socket = useContext(SocketContext);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { gameInfo, setGameInfo } = useGameInfo();
	const [meInfo, setMeInfo] = useState<ILocalGameInfo['players'][0] | null>(null);
	const [opponentInfo, setOpponentInfo] = useState<ILocalGameInfo['players'][0] | null>(null);
	const [endGameInfo, setEndGameInfo] = useState<{
		winner: {
			user: IUser;
			score: number;
		};
		score: number | undefined; // On normal game
		creator_score: number | undefined; // On watch game
		opponent_score: number;
	} | null>(null);
	const { auth } = useAuth();

	const [gameScore, setGameScore] = React.useState<{
		you: number | undefined; // On normal game
		creator: number | undefined; // On watch game
		opponent: number;
	}>({
		you: 0,
		creator: 0,
		opponent: 0,
	});

	window.socket = socket;

	// If no game info

	useEffect(() => {
		if (!gameInfo) {
			message.error('No game info');
			navigate('/notFound');
		}
	}, []);

	useEffect(() => {
		if (!gameInfo || !gameInfo.players || gameInfo.players.length !== 2) return;

		if (gameInfo.isWatching) {
			setMeInfo(gameInfo.players[0]);
			setOpponentInfo(gameInfo.players[1]);
		} else {
			setMeInfo(gameInfo.players.filter((p: any) => p.user.id === auth.user?.id)[0]);
			setOpponentInfo(gameInfo.players.filter((p: any) => p.user.id !== auth.user?.id)[0]);
		}
	}, []);

	socket.off('games_score');
	socket.on('games_score', (data: any) => {
		setGameScore(data);
	});
	socket.off('games_end'); // Unbind previous event
	socket.on('games_end', (data: any) => {
		if (!data.winner) {
			navigate('/searchGame', { replace: true });
			return;
		}
		setEndGameInfo(data);
		setIsModalOpen(true);
	});

	// Watchers events
	socket.off('games_watch_score'); // Unbind previous event
	socket.on('games_watch_score', (data: any) => {
		setGameScore(data);
	});
	socket.off('games_watch_end'); // Unbind previous event
	socket.on('games_watch_end', (data: any) => {
		setEndGameInfo(data);
		setIsModalOpen(true);
	});

	const stopWatching = () => {
		navigate(-1);
	};

	const quitGame = () => {
		navigate(-1);
	};

	const closeModal = () => {
		setIsModalOpen(false);
	};

	const closeAndQuitGame = () => {
		closeModal();
		quitGame();
	};

	useEffect(() => {
		if (gameInfo?.isWatching) {
			setGameScore({
				creator: gameInfo.players[0].score,
				opponent: gameInfo.players[1].score,
				you: 0,
			});
		}
		return () => {
			if (gameInfo) {
				if (gameInfo.isWatching) {
					socket.emit('games_watch_stop', { id: gameId });
				} else {
					socket.emit('games_quit', { id: gameId });
				}
			}
			setGameInfo(null);
		};
	}, []);

	return (
		<div className="game-wrapper">
			<div className="game-score">
				<div className="opponent">
					<div className="info">
						<img src={opponentInfo?.user?.profile_picture} alt="User image" />
						<p>{opponentInfo?.user?.username}</p>
					</div>
					<span className="score">
						{gameInfo && gameInfo.isWatching ? gameScore.opponent : gameScore.opponent}
					</span>
				</div>
				<span>-</span>
				<div className="me">
					<div className="info">
						<img src={meInfo?.user?.profile_picture} />
						<p>{meInfo?.user?.username}</p>
					</div>
					<span className="score">{gameInfo && gameInfo.isWatching ? gameScore.creator : gameScore.you}</span>
				</div>
			</div>
			<div className="pong-wrapper" id="game-container">
				<Canvas gameId={gameId} />
			</div>
			{endGameInfo ? (
				<Modal
					style={{ padding: '0.5rem 0.3rem' }}
					className="nes-dialog is-dark is-rounded"
					open={isModalOpen}
					onCancel={closeModal}
					wrapClassName="end-game-wrapper"
					footer={[
						<button key="quit" onClick={closeAndQuitGame} className="nes-btn is-primary">
							OK
						</button>,
					]}
				>
					<div className="end-game">
						<p className="winner">
							Winner : <span>{endGameInfo.winner.user.username}</span>
						</p>
						<div className="game-score">
							<p className="opponent">
								{opponentInfo?.user.username}
								<span className="score">{endGameInfo.opponent_score}</span>
							</p>
							<span>-</span>
							<p className="me">
								<span className="score">
									{gameInfo && gameInfo.isWatching ? endGameInfo.creator_score : endGameInfo.score}
								</span>
								{meInfo?.user.username}
							</p>
						</div>
					</div>
				</Modal>
			) : null}
			{gameInfo && gameInfo.isWatching ? (
				<button className="nes-btn quit-button is-error" onClick={stopWatching}>
					Stop watching
				</button>
			) : (
				<button className="nes-btn quit-button is-error" onClick={quitGame}>
					Quit
				</button>
			)}
		</div>
	);
};

export default Pong;
