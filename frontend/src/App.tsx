import './css/app.css';
import React, { useContext, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import Dashboard from './components/Dashboard/Dashboard';
import Preferences from './components/Preferences/Preferences';
import Login from './components/Login/Login';
import Menu from './components/Menu/Menu';
import Home from './pages/Home';
import Otp from './components/Otp/Otp';
import { IAuth, IUser } from './interfaces';
import { SocketContext } from './context/socket';

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
			'http://api.transcendence.local/api/v1/users/me',
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
				<Route
					path="/home"
					element={<Home user={user} auth={auth} />}
				/>
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/preferences" element={<Preferences />} />
			</Routes>
		</SocketContext.Provider>
	);
}

export default App;
