import * as React from 'react';
import { useState } from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

export const Stats = () => {
	// export default function Stats({ Stats }: StatsProps) {

	return (
		<div className="stats-wrapper">
			<div className="profil">
				<div className="avatar"></div>
				<h1>Pseudo</h1>
				<h2>1306 points</h2>
			</div>
			<div className="historic">
				<h1>Historic</h1>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
				<div className="historic-item">
					<span className="opposent">had</span>
					<span className="score">3 - 1</span>
				</div>
			</div>
			<div className="stats">
				<h1>Stats</h1>
				<div className="stats-item">
					<span>Nombre de parties</span>
					<span className="score">126</span>
				</div>
				<div className="stats-item">
					<span>Gagnées</span>
					<span className="score">63</span>
				</div>
				<div className="stats-item">
					<span>Perdu</span>
					<span className="score">63</span>
				</div>
				<div className="stats-item">
					<span>Winrate</span>
					<span className="score">50%</span>
				</div>
				<div className="stats-item">
					<span>Record de points</span>
					<span className="score">32</span>
				</div>
			</div>
			<div className="classement">
				<h1>Classement</h1>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
				<div className="classement-item">
					<span className="opposent">had</span>
					<span className="score">200 victoires</span>
				</div>
			</div>
		</div>
	);
};

export default Stats;
