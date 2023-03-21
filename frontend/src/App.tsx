import '../src/css/app.scss';
import React, { useContext, useEffect } from 'react';
import { ConfigProvider, message, theme } from 'antd';
import { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import Login from './components/Login/Login';
import Menu from './components/Menu/Menu';
import Home from './pages/Home';
import { SocketContext } from './context/socket';
import Friends from './pages/Friends';
import Pong from './pages/P5Pong';
import SearchGame from './pages/SearchGame';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import { IUser } from './interfaces';
import NoUserFound from './pages/404';
import RequireAuth from './components/RequireAuth';
import useAuth from './hooks/useAuth';
import useGameInfo from './hooks/useGameInfo';
import useMatchmaking from './hooks/useMatchmaking';
import NotFound from './pages/NotFound';
import Ladder from './pages/Ladder';
import { ILocalGameInfo } from './interfaces';
import MusicPlayer from './components/MusicPlayer';

function App() {
	const navigate = useNavigate();
	const socket = useContext(SocketContext);
	const { auth, setAuth } = useAuth();
	const { gameInfo, setGameInfo } = useGameInfo();
	const { inMatchmaking, setInMatchmaking } = useMatchmaking();
	const [cookies, setCookie, removeCookie] = useCookies(['bearer']);
	const [userLoading, setUserLoading] = useState(true);
	const [user, setUser] = useState({} as IUser);
	const [alreadyConnected, setAlreadyConnected] = useState(false);
	const maxRetry = 5;
	let retry = 0;

	const fetchUser = async () => {
		const response = await fetch(process.env.REACT_APP_API_URL + '/users/me', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cookies.bearer}`,
			},
		}).catch((error) => {
			console.log(error);
			setAuth({ bearer: null, otp_ok: false, user: null });
		});
		if (!response) return;

		const data = await response.json();
		setUserLoading(false);
		if (response.ok) {
			setUser(data);
			if (auth.bearer !== cookies.bearer || auth.otp_ok !== true)
				setAuth({ bearer: cookies.bearer, otp_ok: true, user: data });
			// Connect to socket
			socket.connect();
			setAlreadyConnected(false);
			// if the user is on the login page, redirect him to the home page
			if (window.location.pathname === '/login') navigate('/');
		} else if (response.status === 401 && data.message.startsWith('TOTP')) {
			// User need to enter a TOTP
			if (auth.bearer !== cookies.bearer || auth.otp_ok !== false)
				setAuth({ bearer: cookies.bearer, otp_ok: false, user: null });
		} else if (response.status === 401) {
			// User is not connected
			if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false, user: null });
		} else console.log(data);
	};
	useEffect(() => {
		socket.off('connect');
		socket.on('connect', () => {
			console.log('Socket connected');
			if (retry > 0) message.success('Reconnected');
		});
		socket.off('disconnect');
		socket.on('disconnect', () => {
			console.log('Socket disconnected');
		});
		// if the user can't connect to the server after 3 tries, he will be disconnected
		socket.off('connect_error');
		socket.on('connect_error', () => {
			message.error('Trying to reconnect...');
			if (retry < maxRetry) {
				retry++;
				socket.connect();
			} else {
				socket.disconnect();
				setAuth({ bearer: null, otp_ok: false, user: null });
				message.error('Connection failed');
			}
		});
		socket.off('error');
		socket.on('error', (error: any) => {
			console.log('Socket error:', error);
			if (error.statusCode === 401) {
				// User is not connected
				if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false, user: null });
			} else if (error.statusCode === 409) {
				message.error(error.errors[0]);
				// navigate('/notFound', { replace: true });
				if (auth.bearer !== null || auth.otp_ok !== false) {
					setAlreadyConnected(true);
					setAuth({ bearer: null, otp_ok: false, user: null });
				}
			}
		});
		return () => {
			if (gameInfo) socket.emit('games_leave', { id: gameInfo.id });
			if (inMatchmaking) socket.emit('games_quit_matchmaking');
			socket.off();
		};
	}, []);

	socket.off('games_start');
	socket.on('games_start', (data: ILocalGameInfo) => {
		console.log('games_start', data);
		setGameInfo(data);
		setInMatchmaking(false);
		navigate(`/pong/${data.id}`);
	});
	socket.off('game_invitation');
	socket.on('game_invitation', (data: any) => {
		console.log('game_invitation', data);
		message.info(
			<div className="invite-notification">
				<p>You receive an invitation from {data.players[0].user.username}</p>
				<button className="nes-btn" onClick={() => joinGame(data)}>
					Join
				</button>
			</div>,
			10,
		);
	});

	const joinGame = (joinGameInfo: any) => {
		if (gameInfo) {
			message.error('You are already in a game');
			return;
		}
		socket.emit('games_join', { id: joinGameInfo.id }, (data: any) => {
			console.log('games_join', data);
			if (data?.statusCode) {
				message.error(data.messages);
			} else {
				navigate(`/pong/${joinGameInfo.id}`);
			}
		});
	};

	useEffect(() => {
		if (auth.bearer != null && !alreadyConnected) {
			fetchUser();
		}
	}, [auth]);

	if (auth.bearer != null && userLoading)
		return (
			<p className="loading">
				<span>l</span>
				<span>o</span>
				<span>a</span>
				<span>d</span>
				<span>i</span>
				<span>n</span>
				<span>g</span>
			</p>
		);
	if (auth.bearer != null && !userLoading && auth.user?.firstConnection)
		return <Settings user_me={user} setUser={setUser} />;

	return (
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm,
			}}
		>
			<SocketContext.Provider value={socket}>
				<Menu setCookie={setCookie} />
				<Routes>
					<Route
						path="/login"
						element={<Login fetchUser={fetchUser} setCookie={setCookie} removeCookie={removeCookie} />}
					/>
					<Route element={<RequireAuth />}>
						<Route path="/" element={<Home />} />
						<Route path="/friends" element={<Friends user_me={user} />} />
						<Route path="/searchGame" element={<SearchGame user_me={user} />} />
						<Route path="/stats" element={<Stats user_me={user} />} />
						<Route path="/searchGame" element={<SearchGame user_me={user} />} />
						<Route path="/stats/:userId" element={<Stats user_me={user} />} />
						<Route path="/404" element={<NoUserFound />} />
						<Route path="/settings" element={<Settings user_me={user} setUser={setUser} />} />
						<Route path="/pong/:gameId" element={<Pong />} />
						<Route path="/ladder" element={<Ladder />} />
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
				<MusicPlayer />
			</SocketContext.Provider>
		</ConfigProvider>
	);
}

export default App;
