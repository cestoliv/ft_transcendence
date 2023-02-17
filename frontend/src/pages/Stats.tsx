import * as React from 'react';
import default_avatar from "../../public/default-avatar.png";
import { useState, useEffect } from 'react';
import { IUser } from '../interfaces';
import { socket, SocketContext } from '../context/socket';
import { IScore } from '../interfaces';


import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

type StatsProps = {
	user_me : IUser,
}; 

export const Stats = (props :StatsProps ) => {
	const initialUser: IUser = {id:0, id42: 0, username: 'NaN', elo: 0, wins: 0, loses: 0, scores: []};
	const [user, setUser] = useState<IUser>(initialUser);
	const [displayScores, setDisplayScores] = useState<IScore []>([]);
	const currentId: number = props.user_me.id;

	useEffect(() => {
		socket.emit('users_get',
			{
				id: currentId,
			},
			(data: any) => {
				if (data.errors)
				{
					console.log("error");
					//setRedirect(true); a voir
				}
				else
					setUser(data);
			});
	},[user,currentId]);
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
			<div className="rank">
				<img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/d6df2d66-13da-4ce4-ae85-8009742c5c94/d6u3aiw-18765c64-e07c-418e-a1d9-ffc958e48202.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi9kNmRmMmQ2Ni0xM2RhLTRjZTQtYWU4NS04MDA5NzQyYzVjOTQvZDZ1M2Fpdy0xODc2NWM2NC1lMDdjLTQxOGUtYTFkOS1mZmM5NThlNDgyMDIucG5nIn1dXX0.Nfy5H5LA8hOJG0tCTSQayRJ3R2H2ThI9eQbbUQNKE84" alt="marche po" />
			</div>
			<div className="profil">
				<div className="avatar">
					<img src="https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png" alt="marche po" />
				</div>
				<h2 className="userName">{user.username}</h2>
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

export default Stats;
