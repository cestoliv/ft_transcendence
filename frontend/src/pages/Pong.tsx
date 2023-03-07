import React, {
	useRef,
	useEffect,
	useState,
	useContext,
	useCallback,
	useDebugValue,
} from 'react';
import { Navigate } from 'react-router-dom';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { SocketContext } from '../context/socket';
import { Socket } from 'socket.io-client';
import { throttle, useDebounce, usePrevious, useStateCallback } from '../utils';

const Pong: React.FC = () => {
	const socket = useContext(SocketContext);
	window.socket = socket;

	const [isMounted, setIsMounted] = useState(false);

	const canvasRef = useRef<HTMLCanvasElement>(null);

	// canvas var

	const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 110);
	const [canvasWidth, setCanvasWidth] = useState(window.innerWidth / 2);

	// game var

	const [racketHeight, setRacketHeight] = useState(canvasHeight / 6);
	const [leftRacketY, setLeftRacketY] = useState(
		canvasHeight / 2 - racketHeight / 2,
	);
	const [rightRacketY, setRightRacketY] = useState(
		canvasHeight / 2 - racketHeight / 2,
	);

	const [ballX, setBallX] = useState(canvasWidth / 2);
	const [ballY, setBallY] = useState(canvasHeight / 2);
	const [ballSpeedX, setBallSpeedX] = useState(canvasWidth / 630);
	const [ballSpeedY, setBallSpeedY] = useState(Math.random() * 9);
	const [dx, setDx] = useState(canvasWidth / 320);
	const [dy, setDy] = useState(canvasHeight / 240);
	const [gameStarted, setGameStarted] = useState(false);
	const [gameEnd, setGameEnd] = useState(false);
	const [leftScore, setLeftScore] = useState(0);
	const [rightScore, setRightScore] = useState(0);

	const speedStart = 2;

	// modal var

	const [open, setOpen] = React.useState(false);
	const [redirect, setRedirect] = useState<boolean>(false);

	const victoryScore = 10;

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const draw = () => {
		if (canvasRef.current) {
			const ctx = canvasRef.current.getContext('2d');
			if (ctx) {
				// Dessiner le fond en noir
				ctx.canvas.width = canvasWidth;
				ctx.canvas.height = canvasHeight;
				ctx.fillStyle = '#000';
				ctx.fillRect(0, 0, canvasWidth, canvasHeight);
				// Dessiner la raquette gauche en blanc
				ctx.fillStyle = '#FFF';
				ctx.fillRect(0, leftRacketY, 10, racketHeight);
				// Dessiner la raquette droite en blanc
				ctx.fillStyle = '#FFF';
				ctx.fillRect(canvasWidth - 10, rightRacketY, 10, racketHeight);
				// Dessiner la balle en bleu
				ctx.fillStyle = '#00F';
				ctx.beginPath();
				ctx.arc(ballX, ballY, 10, 0, 2 * Math.PI);
				ctx.fill();
			}
		}
	};

	/* Sockets */
	// const [isHost, setIsHost] = useState<boolean | undefined>(undefined);
	const [isHost, setIsHost, setIsHostCallback] = useStateCallback<
		boolean | undefined
	>(undefined);

	// Racket move
	useEffect(() => {
		if (!isMounted) return;
		console.log(isHost);
		// Send the new position of the clayer rackets to the server
		socket.emit('games_move', { newY: rightRacketY }, (data: any) => {
			console.log(data);
		});
	}, [rightRacketY]);

	socket.on('games_move', (data: any) => {
		if (data.newY) setLeftRacketY(data.newY);
	});

	// Start game
	useEffect(() => {
		if (!isMounted) return;
		// Set Host
		if (gameStarted && isHost === undefined)
			setIsHostCallback(true, (newState) => {
				console.log('game started', isHost, newState);
				socket.emit(
					'games_start',
					{ started: gameStarted },
					(data: any) => {
						console.log(data);
						setGameStarted(data.started);
					},
				);
			});
	}, [gameStarted]);

	useEffect(() => {
		if (!isMounted) return;
		console.log('new isHost', isHost);
	}, [isHost]);

	socket.on('games_start', (data: any) => {
		if (isHost === false) return;
		if (data.started) {
			// Set Host
			if (!gameStarted && isHost === undefined) setIsHost(false);
			console.log('socket', 'game started', isHost);
			setGameStarted(data.started);
		}
	});

	// Ball move
	const sendBallMove = (x: number, y: number) => {
		console.log('hello from debounce');
		socket.emit('games_ball', { newX: x, newY: y }, (data: any) => {
			console.log(data);
		});
	};
	const throttledSendBallMove = throttle(sendBallMove, 1000 / 20);

	// const [ballDebounce] = useDebounce(sendBallMove, 500);

	useEffect(() => {
		if (!isMounted) return;
		console.log('ball move', isHost);
		if (isHost !== true) return;
		console.log('ball move', isHost, ballX, ballY);

		throttledSendBallMove(ballX, ballY);

		// Check if the position of the ball has changed
		// if (
		// 	Math.round(prevBallX || ballX) === Math.round(ballX) &&
		// 	Math.round(prevBallY || ballY) === Math.round(ballY)
		// )
		// 	return;
		// Send the new position of the ball to the server
	}, [ballX, ballY]);

	socket.on('games_ball', (data: any) => {
		console.log('socket', 'ball move');
		if (isHost) return;
		if (data.newX && data.newY) {
			console.log('socket', 'ball move', data.newX, data.newY);
			setBallX(data.newX);
			setBallY(data.newY);
		}
	});
	/* End Sockets */

	useEffect(() => {
		draw();
	}, [
		leftRacketY,
		rightRacketY,
		ballX,
		ballY,
		gameStarted,
		canvasHeight,
		canvasWidth,
		racketHeight,
	]);

	useEffect(() => {
		let animationId: any;

		const gameLoop = () => {
			// ...code pour mettre à jour la position de la balle...
			if (rightScore == 2 || leftScore == 2) {
				setGameEnd(true);
				setOpen(true);
				return () => {
					window.cancelAnimationFrame(animationId);
				};
			}
			//collide right
			if (
				ballSpeedX > 0 &&
				ballX > canvasWidth - 20 &&
				ballX < canvasWidth - 10 &&
				ballY + ballSpeedY < rightRacketY + racketHeight &&
				ballY + ballSpeedY > rightRacketY
			) {
				// Change direction
				setBallSpeedX(-ballSpeedX);
				const impact = ballY - rightRacketY - racketHeight / 2;
				const ratio = 100 / (racketHeight / 2);

				// Get a value between 0 and 10
				setBallSpeedY(Math.round((impact * ratio) / 10));

				// Increase speed if it has not reached max speed
				if (Math.abs(ballSpeedX) < 12) {
					setBallSpeedX(ballSpeedX * -1.2);
				}
				// colide left
			} else if (
				ballSpeedX < 0 &&
				ballX < 20 &&
				ballX > 10 &&
				ballY + ballSpeedY < leftRacketY + racketHeight &&
				ballY + ballSpeedY > leftRacketY
			) {
				// Change direction
				setBallSpeedX(ballSpeedX * -1);
				const impact = ballY - leftRacketY - racketHeight / 2;
				const ratio = 100 / (racketHeight / 2);

				// Get a value between 0 and 10
				setBallSpeedY(Math.round((impact * ratio) / 10));

				// Increase speed if it has not reached max speed
				if (Math.abs(ballSpeedX) < 12) {
					setBallSpeedX(ballSpeedX * -1.2);
				}
			}
			// Rebounds on top and bottom
			if (
				ballY + ballSpeedY + 5 > canvasHeight ||
				ballY + ballSpeedY + 5 < 0
			) {
				setBallSpeedY(ballSpeedY * -1);
			}
			// goal
			if (ballX < 0 || ballX > canvasWidth) {
				// add goal
				if (ballX < 0) setRightScore(rightScore + 1);
				else setLeftScore(leftScore + 1);
				// reset
				setBallX(canvasWidth / 2);
				setBallY(canvasHeight / 2);
				setBallSpeedX(3);
				setBallSpeedY(Math.random() * 3);
				return;
			}
			// new position
			setBallX(ballX + ballSpeedX);
			setBallY(ballY + ballSpeedY);
		};

		if (gameStarted && !gameEnd) {
			animationId = window.requestAnimationFrame(gameLoop);
		}
	}, [
		gameStarted,
		gameEnd,
		rightRacketY,
		leftRacketY,
		ballX,
		ballY,
		ballSpeedX,
		ballSpeedY,
	]);

	// useEffect(() => {
	// 	if (gameStarted && !gameEnd) {
	// 		const intervalId = setInterval(() => {

	// 		}, 32);

	// 		return () => {
	// 			clearInterval(intervalId);
	// 		};
	// 	}
	// }, [gameStarted, ballX, ballY, ballSpeedX, ballSpeedY, racketHeight]);

	const handleKeyDown = (event: KeyboardEvent) => {
		console.log('5');
		switch (event.keyCode) {
			case 38:
				setRightRacketY((prevY) => Math.max(0, prevY - 20));
				break;
			case 40:
				setRightRacketY((prevY) =>
					Math.min(canvasHeight - racketHeight, prevY + 20),
				);
				break;
			case 90:
				setLeftRacketY((prevY) => Math.max(0, prevY - 20));
				break;
			case 83:
				setLeftRacketY((prevY) =>
					Math.min(canvasHeight - racketHeight, prevY + 20),
				);
				break;
			default:
				break;
		}
	};

	useEffect(() => {
		console.log('3');
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [canvasHeight]);

	const handleKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			setGameStarted(true);
		}
	};

	useEffect(() => {
		console.log('4');
		window.addEventListener('keypress', handleKeyPress);
		return () => {
			window.removeEventListener('keypress', handleKeyPress);
		};
	}, []);

	const handleRedirect = (event: any): void => {
		setRedirect(true);
	};

	const renderRedirect = () => {
		if (redirect) {
			return <Navigate to="/searchGame" />;
		}
	};

	return (
		<div className="pong-wrapper">
			{renderRedirect()}
			<Modal
				open={open}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="end-game-modal">
					<h1>Score</h1>
					<h3>
						hadrien {leftScore} - {rightScore} Olivier
					</h3>
					<button
						className="redirect-game-button"
						onClick={handleRedirect}
					>
						Continuer
					</button>
				</Box>
			</Modal>
			<div className="leftScore">{leftScore}</div>
			<div className="canvas-wrapper">
				<canvas ref={canvasRef} />
			</div>
			<div className="rightScore">{rightScore}</div>
		</div>
	);
};

export default Pong;
