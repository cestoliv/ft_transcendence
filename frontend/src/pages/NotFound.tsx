import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
	return (
		<div className="notFound">
			<img src="/img/404.png" alt="404" />
			<h2>Page not found</h2>
			<Link className="nes-btn" to="/">
				Go back to home
			</Link>
		</div>
	);
}
