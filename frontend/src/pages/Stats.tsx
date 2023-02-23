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
	const initialUser: IUser = {id:0, id42: 0, username: 'NaN', elo: 0, wins: 0, loses: 0, scores: [], invitedFriends: [], friendOf: [], friends: []};
	const [user, setUser] = useState<IUser>(initialUser);
	const [displayScores, setDisplayScores] = useState<IScore []>([{me: 2, op: 1, op_name:"NOOB"}, {me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"},{me: 2, op: 1, op_name:"NOOB"}]);
	const currentId: number = props.user_me.id;
	console.log("Stat");
	socket.emit('users_get',
	{
		id: currentId,
	},
	(data: any) => {
		// if (data.errors)
		// {
			// 	console.log("error");
			// 	//setRedirect(true); a voir
			// }
			setUser(data);
		});
	console.log("Stat1");
	const	gameHistory = () => {
		return (displayScores.map((score, index) => (
			<span className="historic-item" key={index}>
			{user.username} {score.me} versus {score.op} {score.op_name}
				</span>)));
	}
	const	defineRank = () =>{
		const current_elo: number = user.elo;
		if (current_elo < 1000){
			return ("Fer");
		}
		else if (current_elo >= 1250){
			return ("Argent");
		}
		else if (current_elo >= 1500){
			return ("Fer");
		}
		else if (current_elo >= 1750){
			return ("Platine");
		}
		else if (current_elo >= 2000){
			return ("Diamant");
		}
		else {
			return ("undefined");
		}
	}
	const	displayRank = () =>{
			const current_elo: number = user.elo;
			if (current_elo < 1000)
				return (<img src="https://i.pinimg.com/originals/f5/a5/9d/f5a59d542851a7dcb3d0eae1851af735.png" alt="marche po"/>);
			else if (current_elo >= 1250)
				return (<img src="https://www.jeuxvideo.lol/wp-content/uploads/2015/10/silver_1-510061efab32cd096791a8d62bf63b39-1.png" alt="marche po"/>);
			else if (current_elo >= 1500)
				return (<img src="https://i.pinimg.com/originals/d7/58/1b/d7581b2a1033309523d20c9d1a1f4589.png" alt="marche po"/>);
			else if (current_elo >= 1750)
				return (<img src="https://i.pinimg.com/originals/d7/47/1e/d7471e2ef48175986e9b75b566f61408.png" alt="marche po"/>);
			else if (current_elo >= 2000)
				return (<img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/d6df2d66-13da-4ce4-ae85-8009742c5c94/d6u3aiw-18765c64-e07c-418e-a1d9-ffc958e48202.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi9kNmRmMmQ2Ni0xM2RhLTRjZTQtYWU4NS04MDA5NzQyYzVjOTQvZDZ1M2Fpdy0xODc2NWM2NC1lMDdjLTQxOGUtYTFkOS1mZmM5NThlNDgyMDIucG5nIn1dXX0.Nfy5H5LA8hOJG0tCTSQayRJ3R2H2ThI9eQbbUQNKE84" alt="marche po" />);
			else
				return (<img src="" alt="marche po"/>);
		}
	const percentWinrate = () => {
		if (user.wins + user.loses > 0)
			return (100 * (user.wins / user.loses));
		else
			return (0);
	}

	return (
		<div className="wrapper">
			<div className="rank">
				{displayRank()}
			</div>
			<div className="profil-wrapper">
				<div className='profil'>
					<div className="avatar">
						<svg viewBox="0 0 200 200">
							<circle cx="50%" cy="50%" r="50%" fill="#fff" />
							<clipPath id="circle">
							<circle cx="50%" cy="50%" r="50%" />
							</clipPath>
							<image clip-path="url(#circle)" href="https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png" x="0" y="0" width="100%" height="100%" />
						</svg>
					</div>
					<h2 className="userName">{user.username}</h2>
					<h2>{user.elo} elo</h2>
				</div>
			</div>
			<div className="historic-wrapper">
				<div className='historic'>
					<h1>Match history</h1>
					<div className='games'>
						{gameHistory()}
					</div>
				</div>
			</div>
			<div className="stats-wrapper">
				<div className='stats'>
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
		</div>
	);
};

export default Stats;
