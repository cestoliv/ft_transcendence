import '../src/css/app.scss';
import React, { useContext, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import Login from './components/Login/Login';
import Menu from './components/Menu/Menu';
import Home from './pages/Home';
import { SocketContext } from './context/socket';
import Friends from './pages/Friends';
import OtherUserProfile from './pages/OtherUserProfile';
import Pong from './pages/P5Pong';
import SearchGame from './pages/SearchGame';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import { IAuth, IUser } from './interfaces';
import NoUserFound from './pages/404';
import RequireAuth from './components/RequireAuth';
import useAuth from './hooks/useAuth';

function App() {
	const socket = useContext(SocketContext);
	const { auth, setAuth } = useAuth();
	const [cookies, setCookie, removeCookie] = useCookies(['bearer']);
	const [userLoading, setUserLoading] = useState(true);
	const [user, setUser] = useState({} as IUser);
	const [allChanMessages, setAllChanMessages] = useState<IChannelMessage[]>([]);

	const fetchUser = async () => {
		const response = await fetch(process.env.REACT_APP_API_URL + '/users/me', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${cookies.bearer}`,
			},
		});
		const data = await response.json();
		setUserLoading(false);
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
			if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false });
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
			if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false });
		}
	});

	useEffect(() => {
		console.log(auth);
		if (auth.bearer != null) {
			fetchUser();
		}
	}, [auth]);

	if (auth.bearer != null && userLoading) return <div>Loading...</div>;

	return (
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm,
			}}
		>
			<SocketContext.Provider value={socket}>
				<Menu />
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
						<Route path="/profile/:userId" element={<OtherUserProfile />} />
						<Route path="/404" element={<NoUserFound />} />
						<Route path="/settings" element={<Settings user_me={user} />} />
						<Route path="/pong" element={<Pong />} />
					</Route>
				</Routes>
			</SocketContext.Provider>
		</ConfigProvider>
	);
}

export default App;
