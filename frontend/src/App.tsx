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
import { IAuth, IUser } from './interfaces';
import NoUserFound from './pages/404';
import RequireAuth from './components/RequireAuth';
import useAuth from './hooks/useAuth';
import useGameInfo from './hooks/useGameInfo';
import NotFound from './pages/NotFound';

function App() {
	const navigate = useNavigate();
	const socket = useContext(SocketContext);
	const { auth, setAuth } = useAuth();
	const { gameInfo, setGameInfo } = useGameInfo();
	const [cookies, setCookie, removeCookie] = useCookies(['bearer']);
	const [userLoading, setUserLoading] = useState(true);
	const [user, setUser] = useState({} as IUser);

	const fetchUser = async () => {
		const response = await fetch(process.env.REACT_APP_API_URL + '/users/me', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cookies.bearer}`,
			},
		});
		const data = await response.json();
		console.log(data);
		setUserLoading(false);
		if (response.ok) {
			setUser(data);
			console.log('user', data);
			if (auth.bearer !== cookies.bearer || auth.otp_ok !== true)
				setAuth({ bearer: cookies.bearer, otp_ok: true, user: data });
			// Connect to socket
			socket.connect();
		} else if (response.status === 401 && data.message.startsWith('TOTP')) {
			// User need to enter a TOTP
			if (auth.bearer !== cookies.bearer || auth.otp_ok !== false)
				setAuth({ bearer: cookies.bearer, otp_ok: false, user: null });
		} else if (response.status === 401) {
			// User is not connected
			if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false, user: null });
		} else console.error(data);
	};

	socket.off(); // Unbind all previous events
	socket.on('connect', () => {
		console.log('Socket connected');
	});
	socket.on('disconnect', () => {
		console.log('Socket disconnected');
	});
	socket.on('connect_error', (error: any) => {
		console.log('Socket connect_error:', error);
	});
	socket.on('error', (error: any) => {
		console.log('Socket error:', error);
		if (error.code === 401) {
			// User is not connected
			if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false, user: null });
		}
	});

	const joinGame = (gameInfo: any) => {
		socket.emit('games_join', { id: gameInfo.id }, (data: any) => {
			console.log('games_join', data);
			if (data?.statusCode) {
				message.error(data.error);
			} else {
				navigate(`/pong/${gameInfo.id}`);
			}
		});
	};

	socket.off();
	socket.on('games_start', (data: any) => {
		console.log('games_start', data);
		setGameInfo(data);
		navigate(`/pong/${data.id}`);
	});
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

	useEffect(() => {
		console.log(gameInfo);
	}, [gameInfo]);

	useEffect(() => {
		console.log(auth);
		if (auth.bearer != null) {
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
						<Route path="/" element={<Home user={user} auth={auth} />} />
						<Route path="/friends" element={<Friends user_me={user} />} />
						<Route path="/searchGame" element={<SearchGame user_me={user} />} />
						<Route path="/stats" element={<Stats user_me={user} />} />
						<Route path="/searchGame" element={<SearchGame user_me={user} />} />
						<Route path="/stats/:userId" element={<Stats user_me={user} />} />
						<Route path="/404" element={<NoUserFound />} />
						<Route path="/settings" element={<Settings user_me={user} auth={auth} />} />
						<Route path="/pong/:gameId" element={<Pong />} />
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</SocketContext.Provider>
		</ConfigProvider>
	);
}

export default App;
