import '../../css/app.scss';
import { Button, Modal, Input, ConfigProvider, theme, Divider, message } from 'antd';
import { ILogin } from '../../interfaces';
import { UserOutlined } from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import Otp from '../Otp/Otp';

const Login = (props: ILogin) => {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
	const [username, setUsername] = useState('');
	const [newUsername, setNewUsername] = useState('');
	const [totpCode, setTotpCode] = useState();
	const [totpUrl, setTotpUrl] = useState();
	const { auth } = useAuth();
	console.log(auth);

	const handle42Login = () => {
		window.location.assign(`${process.env.REACT_APP_API_URL}/auth/login`);
	};

	const showLoginModal = () => {
		setIsLoginModalOpen(true);
	};

	const showRegisterModal = () => {
		setIsRegisterModalOpen(true);
	};

	const handleOkRegister = async () => {
		setIsRegisterModalOpen(false);
		if (!newUsername) {
			message.error('Please enter a username');
			return;
		}
		const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username: newUsername }),
		});
		const data = await response.json();
		if (response.status === 201) {
			message.success('Account created, you can now log in');
			setTotpCode(data.secret);
			setTotpUrl(data.url);
			setNewUsername('');
		} else {
			message.error(data.message);
		}
	};

	const handleOkLogin = () => {
		setIsLoginModalOpen(false);
		if (!username) {
			message.error('Please enter a username');
			return;
		}
		setUsername('');
		window.location.assign(`http://api.transcendence.local/api/v1/auth/login?username=${username}`);
	};

	const handleCancelLogin = () => {
		setIsLoginModalOpen(false);
	};

	const handleCancelRegister = () => {
		setIsRegisterModalOpen(false);
	};

	if (auth.bearer != null && !auth.otp_ok) {
		return <Otp fetchUser={props.fetchUser} setCookie={props.setCookie} removeCookie={props.removeCookie} />;
	}
	return (
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm,
			}}
		>
			<div className="login-wrapper">
				<h1>Log In</h1>
				<div className="button-wrapper">
					<div onClick={handle42Login} className="login-42 nes-btn">
						<img
							src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/42_Logo.svg/2048px-42_Logo.svg.png"
							alt="42 Logo"
						/>
						With 42
					</div>
					<button onClick={showLoginModal} className="nes-btn">
						With username
					</button>
					<Divider />
					<button onClick={showRegisterModal} className="nes-btn">
						Create account
					</button>
				</div>
				<Modal
					title="Login with username"
					open={isLoginModalOpen}
					onOk={handleOkLogin}
					onCancel={handleCancelLogin}
				>
					<Input
						placeholder="Enter your username"
						onChange={(e) => setUsername(e.target.value)}
						prefix={<UserOutlined />}
					/>
				</Modal>
				<Modal
					title="Create account with username"
					open={isRegisterModalOpen}
					onOk={handleOkRegister}
					onCancel={handleCancelRegister}
				>
					<Input
						placeholder="Enter your username"
						onChange={(e) => setNewUsername(e.target.value)}
						prefix={<UserOutlined />}
					/>
					{totpCode && (
						<div className="info-2fa">
							<p className="title">Scan this QR Code : </p>
							<QRCodeCanvas value={totpUrl} />
							<p>Or enter this code in your 2FA App :</p>
							<p className="code">{totpCode}</p>
						</div>
					)}
				</Modal>
			</div>
		</ConfigProvider>
	);
};

export default Login;
