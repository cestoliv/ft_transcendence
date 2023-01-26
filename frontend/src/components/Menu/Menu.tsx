import React from 'react';
import { NavLink } from 'react-router-dom';
import '@syncfusion/ej2-icons/styles/bootstrap.css';
// import { FaGamepad } from "react-icons/fa";
// import { FaUserFriends } from "react-icons/fa";
// import { DiAptana } from "react-icons/di";
// import { SiBookmeter } from "react-icons/si";

export default function Menu() {
	return (
		<div className="menu">
			<h1>PONG</h1>
			<ul>
				<li>
					<NavLink
						to="/home"
						className={({ isActive }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-home"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/game"
						className={({ isActive }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-people"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/friends"
						className={({ isActive }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-play"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/Stats"
						className={({ isActive }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-change-chart-type"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/settings"
						className={({ isActive }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-settings"></span>
					</NavLink>
				</li>
			</ul>
		</div>
	);
}
