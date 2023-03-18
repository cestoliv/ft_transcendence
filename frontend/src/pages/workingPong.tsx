import React, { useRef, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

// const style = {
//   position: 'absolute' as 'absolute',
//   top: '50%',
//   left: '50%',
//   transform: 'translate(-50%, -50%)',
//   width: 400,
//   bgcolor: 'background.paper',
//   border: '2px solid #000',
//   boxShadow: 24,
//   p: 4,
//   display: flexbox,
//   justify-content: center,
// };

const Pong: React.FC = () => {
	// game var

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [leftRacketY, setLeftRacketY] = useState(200);
	const [rightRacketY, setRightRacketY] = useState(200);
	const [ballX, setBallX] = useState(320);
	const [ballY, setBallY] = useState(240);
	const [ballSpeedX, setBallSpeedX] = useState(1);
	const [ballSpeedY, setBallSpeedY] = useState(1);
	const [dx, setDx] = useState(2);
	const [dy, setDy] = useState(2);
	const [gameStarted, setGameStarted] = useState(false);
	const [gameEnd, setGameEnd] = useState(false);
	const [leftScore, setLeftScore] = useState(0);
	const [rightScore, setRightScore] = useState(0);

	const speedStart = 2;

	// modal var

	const [open, setOpen] = React.useState(false);
	const [redirect, setRedirect] = useState<boolean>(false);

	const draw = () => {
		if (canvasRef.current) {
			const ctx = canvasRef.current.getContext('2d');
			if (ctx) {
				// Dessiner le fond en noir
				const canvasHeight = window.innerHeight - 110; // 929 - 100
				// console.log("window h " + x);
				ctx.canvas.width = 640;
				ctx.canvas.height = canvasHeight;
				ctx.fillStyle = '#000';
				ctx.fillRect(0, 0, 640, canvasHeight);
				// Dessiner la raquette gauche en blanc
				ctx.fillStyle = '#FFF';
				ctx.fillRect(0, leftRacketY, 10, 80);
				// Dessiner la raquette droite en blanc
				ctx.fillStyle = '#FFF';
				ctx.fillRect(630, rightRacketY, 10, 80);
				// Dessiner la balle en bleu
				ctx.fillStyle = '#00F';
				ctx.beginPath();
				ctx.arc(ballX, ballY, 10, 0, 2 * Math.PI);
				ctx.fill();
			}
		}
	};

	useEffect(() => {
		draw();
	}, [leftRacketY, rightRacketY, ballX, ballY, gameStarted]);

	useEffect(() => {
		if (gameStarted && !gameEnd) {
			const intervalId = setInterval(() => {
				if (rightScore == 2 || leftScore == 2) {
					setGameEnd(true);
					setOpen(true);
					return () => {
						clearInterval(intervalId);
					};
				}
				if (dx < 0 && ballX < 20 && ballX > 10 && ballY + dy < leftRacketY + 80 && ballY + dy > leftRacketY) {
					let x = ballY - leftRacketY;
					if (x < 40) {
						x = (40 - x) / 10;
						setBallSpeedX(x);
						setBallSpeedY(x);
					}
					if (x > 40) {
						x = (x - 40) / 10;
						setBallSpeedX(x);
						setBallSpeedY(x);
					}
					setDx(-dx);
				}
				if (
					dx > 0 &&
					ballX > 620 &&
					ballX < 630 &&
					ballY + dy < rightRacketY + 80 &&
					ballY + dy > rightRacketY
				) {
					let x = ballY - rightRacketY;
					if (x < 40) {
						x = (40 - x) / 10;
						setBallSpeedX(x);
						setBallSpeedY(x);
					}
					if (x > 40) {
						x = (x - 40) / 10;
						setBallSpeedX(x);
						setBallSpeedY(x);
					}
					setDx(-dx);
				}
				if (ballX + dx > 640 || ballX + dx < 0) {
					if (ballX + dx < 0) setRightScore(rightScore + 1);
					if (ballX + dx > 640) setLeftScore(leftScore + 1);
					setBallX(320);
					setBallY(240);
					setDx(-dx);
					setBallSpeedX(1);
					return;
				}
				if (ballY + dy > 460 || ballY + dy < 20) {
					setDy(-dy);
				}
				if (ballSpeedX < 1) setBallX(ballX + dx * speedStart);
				else setBallX(ballX + dx * speedStart * ballSpeedX);
				setBallY(ballY + dy);
			}, 16);

			return () => {
				clearInterval(intervalId);
			};
		}
	}, [gameStarted, ballX, ballY, ballSpeedX, ballSpeedY]);

	const handleKeyDown = (event: KeyboardEvent) => {
		switch (event.keyCode) {
			case 38:
				setRightRacketY((prevY) => Math.max(0, prevY - 20));
				break;
			case 40:
				setRightRacketY((prevY) => Math.min(400, prevY + 20));
				break;
			case 90:
				setLeftRacketY((prevY) => Math.max(0, prevY - 20));
				break;
			case 83:
				setLeftRacketY((prevY) => Math.min(400, prevY + 20));
				break;
			default:
				break;
		}
	};

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	const handleKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			setGameStarted(true);
		}
	};

	useEffect(() => {
		window.addEventListener('keypress', handleKeyPress);
		return () => {
			window.removeEventListener('keypress', handleKeyPress);
		};
	}, []);

	const handleRedirect = (): void => {
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
			<Modal open={open} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
				<Box className="end-game-modal">
					<h1>Score</h1>
					<h3>
						hadrien {leftScore} - {rightScore} Olivier
					</h3>
					<button className="redirect-game-button" onClick={handleRedirect}>
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
