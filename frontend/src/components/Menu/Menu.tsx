import { message } from 'antd';
import React, { useContext } from 'react';
import { SocketContext } from '../../context/socket';
import { NavLink } from 'react-router-dom';
import '../../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import useAuth from '../../hooks/useAuth';
import { SetCookie } from '../../types';

export default function Menu(props: { setCookie: SetCookie }) {
	const { setAuth } = useAuth();
	const socket = useContext(SocketContext);
	const handleLogout = () => {
		props.setCookie('bearer', null, {
			path: '/',
			sameSite: 'strict',
			domain: process.env.REACT_APP_COOKIE_DOMAIN,
		});
		setAuth({ bearer: null, otp_ok: false, user: null });
		socket.disconnect();
		message.success('Logged out');
		window.location.reload();
	};
	return (
		<div className="menu">
			<NavLink to="/" className="menu-title">
				<h1>
					<span>42</span>PONG
				</h1>
			</NavLink>
			<ul>
				<li>
					<NavLink
						to="/"
						className={({ isActive }: { isActive: boolean }) => (isActive ? 'activeLink' : undefined)}
					>
						<img src="https://github.com/cadgerfeast/pixel-icons/raw/master/png-128/home.png" />
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/friends"
						className={({ isActive }: { isActive: boolean }) => (isActive ? 'activeLink' : undefined)}
					>
						<img src="https://cdn-icons-png.flaticon.com/512/465/465253.png" />
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/searchGame"
						className={({ isActive }: { isActive: boolean }) => (isActive ? 'activeLink' : undefined)}
					>
						<img src="https://github.com/cadgerfeast/pixel-icons/raw/master/png-128/chevron-right.png" />
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/stats"
						className={({ isActive }: { isActive: boolean }) => (isActive ? 'activeLink' : undefined)}
					>
						<img src="https://cdn-icons-png.flaticon.com/512/465/465269.png" />
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/ladder"
						className={({ isActive }: { isActive: boolean }) => (isActive ? 'activeLink' : undefined)}
					>
						<img src="https://fanaplay.fr/6277-medium_default/playmobil-30046843-echelle-pour-creneau-09.jpg" />
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/settings"
						className={({ isActive }: { isActive: boolean }) => (isActive ? 'activeLink' : undefined)}
					>
						<img
							style={{ filter: 'invert(1)' }}
							src="https://cdn-icons-png.flaticon.com/512/7734/7734280.png"
						/>
					</NavLink>
				</li>
				<li onClick={handleLogout} className="logout">
					<img src="https://cdn-icons-png.flaticon.com/512/7734/7734267.png" />
				</li>
			</ul>
		</div>
	);
}
