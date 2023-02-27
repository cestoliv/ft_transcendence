import '../../css/app.scss';
import { Button, Modal, Input, ConfigProvider, theme, Divider, message } from 'antd';
import { ILogin } from '../../interfaces';
import { UserOutlined } from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import Otp from '../Otp/Otp';

const Login = (props: ILogin) => {
	const { auth, setAuth } = useAuth();
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
	const [isShowTotpModalOpen, setIsShowTotpModalOpen] = useState(false);
	const [username, setUsername] = useState('');
	const [newUsername, setNewUsername] = useState('');
	const [otpCode, setOtpCode] = useState('');
	const [totpCode, setTotpCode] = useState();
	const [totpUrl, setTotpUrl] = useState();
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

	const handleOtp = async () => {
		const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/totp/${otpCode}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${auth.bearer}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			props.setCookie('bearer', data.bearer, {
				path: '/',
				sameSite: 'strict',
				domain: process.env.REACT_APP_COOKIE_DOMAIN,
			});
			setAuth({ bearer: data.bearer, otp_ok: true });
			window.location.replace('/');
		} else {
			message.error(data.message);
		}
	};

	const handleCancelOtp = () => {
		setIsOtpModalOpen(false);
	};

	const handleOkLogin = async () => {
		setConfirmLoading(true);
		if (!username) {
			message.error('Please enter a username');
			return;
		}
		const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login?username=${username}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();
		props.setCookie('bearer', data.bearer, {
			path: '/',
			sameSite: 'strict',
			domain: process.env.REACT_APP_COOKIE_DOMAIN,
		});
		if (response.status === 200) {
			setAuth({ bearer: data.bearer });
		} else {
			message.error(data.message);
		}
		setConfirmLoading(false);
		console.log(data);
		// window.location.assign(`http://api.transcendence.local/api/v1/auth/login?username=${username}`);
	};

	const handleCancelLogin = () => {
		setIsLoginModalOpen(false);
	};

	const handleCancelRegister = () => {
		setIsRegisterModalOpen(false);
	};

	useEffect(() => {
		if (auth.bearer != null && !auth.otp_ok) {
			setIsOtpModalOpen(true);
		}
	}, [auth]);

	useEffect(() => {
		if (totpCode != null) {
			setIsShowTotpModalOpen(true);
		}
	}, [totpCode]);

	// if (auth.bearer != null && !auth.otp_ok) {
	// 	return <Otp fetchUser={props.fetchUser} setCookie={props.setCookie} removeCookie={props.removeCookie} />;
	// }
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
					confirmLoading={confirmLoading}
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
						value={newUsername}
						placeholder="Enter your username"
						onChange={(e) => setNewUsername(e.target.value)}
						prefix={<UserOutlined />}
					/>
				</Modal>
				<Modal
					title="Your 2FA Code :"
					open={isShowTotpModalOpen}
					onOk={() => setIsShowTotpModalOpen(false)}
					onCancel={() => setIsShowTotpModalOpen(false)}
				>
					<div className="info-2fa">
						<p className="title">Scan this QR Code : </p>
						<QRCodeCanvas value={totpUrl} />
						<p>Or enter this code in your 2FA App :</p>
						<p className="code">{totpCode}</p>
					</div>
				</Modal>
				<Modal title="Enter your OTP code" open={isOtpModalOpen} onOk={handleOtp} onCancel={handleCancelOtp}>
					<Input
						placeholder="Enter your OTP code"
						onChange={(e) => setOtpCode(e.target.value)}
						prefix={<UserOutlined />}
					/>
				</Modal>
			</div>
		</ConfigProvider>
	);
};

export default Login;
