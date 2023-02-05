import React, { useRef, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { flexbox } from '@mui/system';

const Pong: React.FC = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);


  // canvas var

  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 110);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth / 2);

  // game var

  const [racketHeight, setRacketHeight] = useState(canvasHeight / 6);
  const [leftRacketY, setLeftRacketY] = useState((canvasHeight / 2) - (racketHeight / 2));
  const [rightRacketY, setRightRacketY] = useState((canvasHeight / 2) - (racketHeight / 2));
  const [ballX, setBallX] = useState((canvasWidth / 2));
  const [ballY, setBallY] = useState((canvasHeight / 2));
  const [ballSpeedX, setBallSpeedX] = useState(1);
  const [ballSpeedY, setBallSpeedY] = useState(1);
  const [dx, setDx] = useState(canvasWidth / 320);
  const [dy, setDy] = useState(canvasHeight / 240);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnd, setGameEnd] = useState(false);
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);

  const speedStart = 2;

  // modal var

  const [open, setOpen] = React.useState(false);
  let [redirect, setRedirect] = useState<boolean>(false);

  const draw = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {

        // const canvasHeight = window.innerHeight - 110; // 929 - 100
        console.log("canvas h " + canvasHeight);
        console.log("canvas w " + canvasWidth);
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

  useEffect(() => {
    draw();
  }, [leftRacketY, rightRacketY, ballX, ballY, gameStarted, canvasHeight, canvasWidth, racketHeight]);

  useEffect(() => {
    if (gameStarted && !gameEnd) { 
        const intervalId = setInterval(() => {
          if (rightScore == 2 || leftScore == 2)
          {
            setGameEnd(true);
            setOpen(true);
            return () => {
              clearInterval(intervalId);
            };
          }
        if (dx < 0 && ballX < 20 && ballX > 10 && ballY + dy < leftRacketY + racketHeight && ballY + dy > leftRacketY)
        {
          let x = ballY - leftRacketY;
          if (x < (racketHeight / 2))
          {
            x = (racketHeight / 2 - x) / 10;
            setBallSpeedX(x);
            setBallSpeedY(x);
          }
          if (x > racketHeight / 2)
          {
              x = (x - racketHeight / 2) / 10;
              setBallSpeedX(x);
              setBallSpeedY(x);
          }
          setDx(-dx);
        }
        if (dx > 0 && ballX > (canvasWidth - 20) && ballX < (canvasWidth - 10) && ballY + dy < rightRacketY + racketHeight  && ballY + dy > rightRacketY)
        {
          let x = ballY - rightRacketY;
          if (x < (racketHeight / 2))
          {
            x = (racketHeight / 2 - x) / 10;
            setBallSpeedX(x);
            setBallSpeedY(x);
          }
          if (x > racketHeight / 2)
          {
              x = (x - racketHeight / 2) / 10;
              setBallSpeedX(x);
              setBallSpeedY(x);
          }
          setDx(-dx);
        }
        if (ballX + dx > canvasWidth || ballX + dx < 0) {
          if (ballX + dx < 0)
            setRightScore(rightScore + 1);
          if (ballX + dx > canvasWidth)
            setLeftScore(leftScore + 1);
          setBallX((canvasWidth / 2));
          setBallY((canvasHeight / 2));
          setDx(-dx);
          setBallSpeedX(1);
          return ;
        }
        if (ballY + dy > (canvasHeight - 20) || ballY + dy < 20) {
          setDy(-dy);
        }
        if (ballSpeedX < 1)
          setBallX(ballX + (dx * speedStart));
        else
          setBallX(ballX + ((dx * speedStart) * ballSpeedX));
        setBallY(ballY + dy);
      }, 16);
  
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [gameStarted, ballX, ballY, ballSpeedX, ballSpeedY, racketHeight]);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.keyCode) {
      case 38:
        setRightRacketY(prevY => Math.max(0, prevY - 20));
        break;
      case 40:
        setRightRacketY(prevY => Math.min(canvasHeight - racketHeight, prevY + 20));
        break;
      case 90:
        setLeftRacketY(prevY => Math.max(0, prevY - 20));
        break;
      case 83:
        setLeftRacketY(prevY => Math.min(canvasHeight - racketHeight, prevY + 20));
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
    
  }, [canvasHeight]);

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


  const handleRedirect = (event: any) : void => {
    setRedirect(true);
  }

  const renderRedirect = () => {
      if (redirect) {
        return <Navigate to='/searchGame' />
      }
    }

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
              <h3>hadrien {leftScore} - {rightScore} Olivier</h3>
              <button className="redirect-game-button" onClick={handleRedirect}>Continuer</button>
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
