import '../src/css/app.css';
import React, { useContext, useEffect } from 'react';
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import Login from './components/Login/Login';
import Menu from './components/Menu/Menu';
import Home from './pages/Home';
import Otp from './components/Otp/Otp';
import { SocketContext } from './context/socket';
import Friends from './pages/Friends';
import OtherUserProfile from './pages/OtherUserProfile';
import Pong from './pages/Pong';
import SearchGame from './pages/SearchGame';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import { IAuth, IUser, IUserFriend, IChannel } from './interfaces';
import NoUserFound from './pages/404';

function App() {
	const socket = useContext(SocketContext);
	const [cookies, setCookie, removeCookie] = useCookies(['bearer']);
	const [auth, setAuth] = useState({
		bearer: cookies.bearer,
		otp_ok: false,
	} as IAuth);
	const [user, setUser] = useState({} as IUser);

	const fetchUser = async () => {
		const response = await fetch(
			process.env.REACT_APP_API_URL + '/users/me',
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${cookies.bearer}`,
				},
			},
		);
		const data = await response.json();
		if (response.ok) {
			setUser(data);
			if (auth.bearer !== cookies.bearer || auth.otp_ok !== true)
				setAuth({ bearer: cookies.bearer, otp_ok: true });

			// Connect to socket
			socket.connect();
		} else if (response.status === 401 && data.message.startsWith('TOTP')) {
			// User need to enter a TOTP
			if (auth.bearer !== cookies.bearer || auth.otp_ok !== false)
				setAuth({ bearer: cookies.bearer, otp_ok: false });
		} else if (response.status === 401) {
			// User is not connected
			if (auth.bearer !== null || auth.otp_ok !== false)
				setAuth({ bearer: null, otp_ok: false });
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
			if (auth.bearer !== null || auth.otp_ok !== false)
				setAuth({ bearer: null, otp_ok: false });
		}
	});

	useEffect(() => {
		if (auth.bearer != null) {
			fetchUser();
		}
	}, [auth]);

	// If user is not connected, show login page
	if (auth.bearer == null) {
		return <Login />;
	}

	// If user is connected but need to enter a TOTP, show TOTP page
	if (auth.bearer != null && !auth.otp_ok) {
		return (
			<Otp
				auth={auth}
				setAuth={setAuth}
				fetchUser={fetchUser}
				setCookie={setCookie}
				removeCookie={removeCookie}
			/>
		);
	}

	// If user is connected and has entered a TOTP, show app
	return (
		<SocketContext.Provider value={socket}>
			<Menu />
			<Routes>
				<Route path="/" element={<Home user={user} auth={auth} />} />
				<Route path="/friends" element={<Friends user_me={user}/>} />
				<Route path="/stats" element={<Stats user_me={user} />} />
				<Route path="/searchGame" element={<SearchGame user_me={user}/>} />
				<Route path="/profile/:userId" element={<OtherUserProfile />} />
				<Route path="/404" element={<NoUserFound />} />
				<Route path="/settings" element={<Settings user_me={user}/>} />
				<Route path="/pong" element={<Pong />} />
			</Routes>
		</SocketContext.Provider>
	);
}

export default App;
