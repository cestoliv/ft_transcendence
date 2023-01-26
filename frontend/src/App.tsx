import './css/app.css';
import React, { useEffect } from 'react';

import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import Dashboard from './components/Dashboard/Dashboard';
import Preferences from './components/Preferences/Preferences';
import Login from './components/Login/Login';
import Menu from './components/Menu/Menu';
import Home from './pages/Home';
import Otp from './components/Otp/Otp';
import { IAuth, IUser } from './interfaces';

function App() {
	const [cookies] = useCookies(['bearer']);
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

	useEffect(() => {
		if (auth.bearer != null) fetchUser();
	}, [auth]);

	if (auth.bearer == null) {
		return <Login />;
	}

	if (auth.bearer != null && !auth.otp_ok) {
		return <Otp auth={auth} setAuth={setAuth} fetchUser={fetchUser} />;
	}

	return (
		<>
			<Menu />
			<Routes>
				<Route path="/home" element={<Home user={user} />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/preferences" element={<Preferences />} />
			</Routes>
		</>
	);
}

export default App;
