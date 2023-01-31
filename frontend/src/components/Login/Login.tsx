import React from 'react';
import '../../css/app.css';

export default function Login() {
	const loginUrl = process.env.REACT_APP_API_URL + '/auth/login';

	return (
		<div className="login-wrapper">
			<h1>Please Log In</h1>
			<a href={loginUrl}>
				<button className="login-button">Log in with intra42</button>
			</a>
		</div>
	);
}
