import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

export default function Menu() {
	return (
		<div className="menu">
			<h1>PONG</h1>
			<ul>
				<li>
					<NavLink
						to="/home"
						className={({ isActive }: { isActive: boolean }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-home"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/friends"
						className={({ isActive }: { isActive: boolean }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-people"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/searchGame"
						className={({ isActive }: { isActive: boolean }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-play"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/stats"
						className={({ isActive }: { isActive: boolean }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-change-chart-type"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/settings"
						className={({ isActive }: { isActive: boolean }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span className="e-icons e-large e-settings"></span>
					</NavLink>
				</li>
				<li>
					<NavLink
						to="/pong"
						className={({ isActive }: { isActive: boolean }) =>
							isActive ? 'activeLink' : undefined
						}
					>
						<span>Pong</span>
					</NavLink>
				</li>
			</ul>
		</div>
	);
}
