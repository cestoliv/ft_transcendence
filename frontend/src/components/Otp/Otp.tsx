import '../../css/app.css';
import React, { Dispatch, FormEventHandler, SetStateAction } from 'react';
import { useState } from 'react';
import { useCookies } from 'react-cookie';
import { IAuth } from '../../interfaces';

const Otp = (props: {
	auth: IAuth;
	setAuth: Dispatch<SetStateAction<IAuth>>;
	fetchUser: () => Promise<void>;
}) => {
	const [_cookies, setCookie, removeCookie] = useCookies(['bearer']);
	const [formError, setFormError] = useState('');

	const submitTOTP = async (totp: string) => {
		const response = await fetch(
			`http://api.transcendence.local/api/v1/auth/totp/${totp}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${props.auth.bearer}`,
				},
			},
		);

		const data = await response.json();
		if (response.ok) {
			// User is logged
			setCookie('bearer', data.bearer, {
				path: '/',
				sameSite: 'strict',
				domain: '.transcendence.local',
			});
			props.setAuth({ bearer: data.bearer, otp_ok: true });
		} else if (response.status === 401 && data.message === 'Invalid TOTP') {
			// User need to enter a TOTP
			setFormError('Invalid TOTP');
		} else {
			// This will bring the user back to the login page
			removeCookie('bearer');
			if (props.auth.bearer !== null || props.auth.otp_ok !== false)
				props.setAuth({ bearer: null, otp_ok: false });
			console.error(data);
		}
	};

	const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();
		const totp_input = e.currentTarget.elements.namedItem(
			'otp-input',
		) as HTMLInputElement;
		submitTOTP(totp_input.value);
	};

	return (
		<div className="otp-wrapper">
			<h1>Please enter your OTP</h1>
			<form onSubmit={handleSubmit}>
				<p>{formError}</p>
				<input type="text" id="otp-input" name="otp-input" />
				<button type="submit">Submit</button>
			</form>
		</div>
	);
};

export default Otp;
