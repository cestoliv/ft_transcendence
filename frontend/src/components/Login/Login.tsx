import '../../css/app.scss';
import { ConfigProvider, theme, Divider, message } from 'antd';
import Modal from '@mui/material/Modal';
import { ILogin } from '../../interfaces';
import { QRCodeCanvas } from 'qrcode.react';
import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';

const Login = (props: ILogin) => {
	const { auth, setAuth } = useAuth();
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
	const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
	const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
	const [username, setUsername] = useState('');
	const [newUsername, setNewUsername] = useState('');
	const [otpCode, setOtpCode] = useState('');
	const [totpCode, setTotpCode] = useState();
	const [totpUrl, setTotpUrl] = useState<string>('');

	const handle42Login = () => {
		window.location.assign(`${process.env.REACT_APP_API_URL}/auth/login`);
	};

	const showLoginModal = () => setIsLoginModalOpen(true);
	const showRegisterModal = () => setIsRegisterModalOpen(true);

	const handleRegister = async (e: React.SyntheticEvent) => {
		e.preventDefault();
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

	const handleOtp = async (e: React.SyntheticEvent) => {
		e.preventDefault();
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
			setAuth({ bearer: data.bearer, otp_ok: true, user: auth.user });
			window.location.replace('/');
		} else {
			message.error(data.message);
		}
	};

	const handleLogin = async (e: React.SyntheticEvent) => {
		e.preventDefault();
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
			setAuth({
				bearer: data.bearer,
				otp_ok: false,
				user: null,
			});
		} else {
			message.error(data.message);
		}
	};

	const handleGithub = () => {
		window.open('https://github.com/cestoliv/ft_transcendence', '_blank', 'noopener,noreferrer');
	};

	const handleCloseLogin = () => setIsLoginModalOpen(false);
	const handleCloseRegister = () => setIsRegisterModalOpen(false);
	const handleCloseOtp = () => {
		setIsOtpModalOpen(false);
		props.removeCookie('bearer', {
			path: '/',
			sameSite: 'strict',
			domain: process.env.REACT_APP_COOKIE_DOMAIN,
		});
		setAuth({ bearer: null, otp_ok: false, user: null });
		message.error('You need to enable 2FA to log in');
	};
	const handleCloseTotp = () => setIsTotpModalOpen(false);

	useEffect(() => {
		if (auth.bearer != null && !auth.otp_ok) {
			setIsOtpModalOpen(true);
		}
	}, [auth]);

	useEffect(() => {
		if (totpCode != null) {
			setIsTotpModalOpen(true);
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
				<Modal open={isLoginModalOpen} onClose={handleCloseLogin}>
					<div className="modal">
						<h3>Login</h3>
						<form onSubmit={handleLogin}>
							<input
								placeholder="Enter your username"
								className="nes-input is-dark"
								onChange={(e) => setUsername(e.target.value)}
							/>
							<button className="nes-btn is-success" type="submit">
								Confirm
							</button>
						</form>
						{/* <Input
							placeholder="Enter your OTP code"
							onChange={(e) => setOtpCode(e.target.value)}
							prefix={<UserOutlined />}
						/> */}
						{/* <Button onClick={handleOtp}>Valid OTP</Button> */}
					</div>
				</Modal>
				<Modal open={isRegisterModalOpen} onClose={handleCloseRegister}>
					<div className="modal">
						<h3>Register</h3>
						<form onSubmit={handleRegister}>
							<input
								className="nes-input is-dark"
								placeholder="Enter your username"
								value={newUsername}
								onChange={(e) => setNewUsername(e.target.value)}
							/>
							<button className="nes-btn is-success">Confirm</button>
						</form>
					</div>
				</Modal>
				<Modal open={isTotpModalOpen} onClose={handleCloseTotp}>
					<div className="info-2fa modal">
						<p className="title">Scan this QR Code : </p>
						<QRCodeCanvas value={totpUrl} />
						<p>Or enter this code in your 2FA App :</p>
						<p className="code">{totpCode}</p>
					</div>
				</Modal>
				<Modal open={isOtpModalOpen} onClose={handleCloseOtp}>
					<div className="modal">
						<h3>Enter your OTP </h3>
						<form onSubmit={handleOtp}>
							<input
								placeholder="Enter your OTP code"
								className="nes-input is-dark"
								onChange={(e) => setOtpCode(e.target.value)}
							/>
							<button className="nes-btn is-success">Confirm</button>
						</form>
					</div>
				</Modal>
				<div onClick={handleGithub} className="made-by typing">
					<p>Made with</p>
					<img
						src="https://cdn.pixabay.com/photo/2017/09/23/16/33/pixel-heart-2779422_1280.png"
						alt="Heart"
					/>
					<p>by hprudhom, ocartier, mservage, paime.</p>
				</div>
			</div>
		</ConfigProvider>
	);
};

export default Login;
