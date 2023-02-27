import '../../css/app.scss';
import React, { FormEventHandler, useState } from 'react';
import { IOtp } from '../../interfaces';
import { Input, Button, ConfigProvider, theme } from 'antd';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Otp = (props: IOtp) => {
	const navigate = useNavigate();
	const [formError, setFormError] = useState('');
	const { auth, setAuth } = useAuth();
	const [totp, setTotp] = useState('');
	const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		console.log(auth);
		// submitTOTP(
		// 	totp,
		// 	setFormError,
		// 	auth,
		// 	setAuth,
		// 	props.setCookie,
		// 	props.removeCookie,
		// );
		const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/totp/${totp}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${auth.bearer}`,
			},
		});

		const data = await response.json();
		//console.log(data);
		if (response.ok) {
			// User is logged
			props.setCookie('bearer', data.bearer, {
				path: '/',
				sameSite: 'strict',
				domain: process.env.REACT_APP_COOKIE_DOMAIN,
			});
			setAuth({ bearer: data.bearer, otp_ok: true, user: data.user });
			window.location.assign('/');
			// navigate('/', { replace: true });
		} else if (response.status === 401 && data.message === 'Invalid TOTP') {
			// User need to enter a TOTP
			setFormError('Invalid TOTP');
		} else {
			// This will bring the user back to the login page
			props.removeCookie('bearer');
			if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false });
			console.error(data);
		}
	};

	return (
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm,
			}}
		>
			<div className="otp-wrapper">
				<h1>Please enter your OTP</h1>
				<form onSubmit={handleSubmit}>
					<p>{formError}</p>
					<Input
						onChange={(e) => setTotp(e.target.value)}
						placeholder="Your otp"
						type="text"
						id="otp-input"
						name="otp-input"
					/>
					<Button htmlType="submit" type="primary">
						Submit
					</Button>
				</form>
			</div>
		</ConfigProvider>
	);
};

export default Otp;
