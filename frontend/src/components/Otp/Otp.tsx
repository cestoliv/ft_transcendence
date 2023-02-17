import '../../css/app.css';
import React, { Dispatch, FormEventHandler, SetStateAction, useState } from 'react';
import { IAuth } from '../../interfaces';
import { RemoveCookie, SetAuth, SetCookie } from '../../types';

// Submit the TOTP to the API
const submitTOTP = async (
	totp: string,
	setFormError: Dispatch<SetStateAction<string>>,
	auth: IAuth,
	setAuth: SetAuth,
	setCookie: SetCookie,
	removeCookie: RemoveCookie,
) => {
	const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/totp/${totp}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${auth.bearer}`,
		},
	});

	const data = await response.json();
	console.log(data);
	if (response.ok) {
		// User is logged
		setCookie('bearer', data.bearer, {
			path: '/',
			sameSite: 'strict',
			domain: process.env.REACT_APP_COOKIE_DOMAIN,
		});
		setAuth({ bearer: data.bearer, otp_ok: true });
	} else if (response.status === 401 && data.message === 'Invalid TOTP') {
		// User need to enter a TOTP
		setFormError('Invalid TOTP');
	} else {
		// This will bring the user back to the login page
		removeCookie('bearer');
		if (auth.bearer !== null || auth.otp_ok !== false) setAuth({ bearer: null, otp_ok: false });
		console.error(data);
	}
};

const Otp = (props: {
	auth: IAuth;
	setAuth: Dispatch<SetStateAction<IAuth>>;
	setCookie: SetCookie;
	removeCookie: RemoveCookie;
	fetchUser: () => Promise<void>;
}) => {
	const [formError, setFormError] = useState('');

	const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();
		const totp_input = e.currentTarget.elements.namedItem('otp-input') as HTMLInputElement;
		submitTOTP(totp_input.value, setFormError, props.auth, props.setAuth, props.setCookie, props.removeCookie);
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
