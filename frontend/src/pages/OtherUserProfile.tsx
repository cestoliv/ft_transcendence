import { display } from '@mui/system';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import { socket, SocketContext } from '../context/socket';
import { IUser } from '../interfaces';
import { IScore } from '../interfaces';


export const OtherUserProfile = () => {
	const params = useParams();
	const [redirect, setRedirect] = useState<boolean>(false);
	const initialUser: IUser = {id:0, id42: 0, username: 'NaN', elo: 0, wins: 0, loses: 0, scores: [], invitedFriends: [], friendOf: [], friends: []};
	const [user, setUser] = useState<IUser>(initialUser);
	const [displayScores, setDisplayScores] = useState<IScore []>([]);
	let currentId: number = 0;
	if (params.userId)
		currentId = parseInt(params.userId);
	socket.emit('users_get',
		{
			id: currentId,
		},
		(data: any) => {
			if (data.errors)
			{
				console.log("error");
				setRedirect(true); // a voir
			}
			else
				setUser(data);
				setDisplayScores(user.scores.slice(Math.min(user.wins + user.loses,10)));
			});
	const renderRedirect = () => {
		if (redirect)
			return <Navigate to="/404" />;
	};

	const	gameHistory = () => {
		return (displayScores.map((score, index) => (
			<span key={index}>
			{user.username} {score.me} versus {score.op} {score.op_name}
			</span>)));
	}
	const	defineRank = () =>{
		const current_elo: number = user.elo;
		if (current_elo < 1000)
			return ("Fer")
		else if (current_elo >= 1250)
			return ("Argent")
			else if (current_elo >= 1500)
			return ("Fer")
		else if (current_elo >= 1750)
		return ("Platine")
		else if (current_elo >= 2000)
			return ("Diamant")
	}

	const percentWinrate = () => {
		if (user.wins + user.loses > 0)
		return (100 * (user.wins / user.loses));
		else
		return (0);
	}

	return (
		<div className="stats-wrapper">
			{renderRedirect()}
			<div className="profil">
				<div className="avatar"></div>
				<h1>{user.username}</h1>
				<h2>{user.elo}</h2>
			</div>
			<div className="historic">
				<h1>Match history</h1>
				<div className="historic-item">
					<span className="score">{gameHistory()}</span>
				</div>
			</div>
			<div className="stats">
				<h1>Stats</h1>
				<div className="stats-item">
					<span>Nombre de parties</span>
					<span className="score">{user.wins + user.loses}</span>
				</div>
				<div className="stats-item">
					<span>Gagnées</span>
					<span className="score">{user.wins}</span>
				</div>
				<div className="stats-item">
					<span>Perdu</span>
					<span className="score">{user.loses}</span>
				</div>
				<div className="stats-item">
					<span>Winrate</span>
					<span className="score">{percentWinrate()}</span>
				</div>
				<div className="stats-item">
					<span>Rank</span>
					<span className="score">{defineRank()}</span>
				</div>
			</div>
		</div>
	);
};

export default OtherUserProfile;
