import * as React from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import { useEffect, useContext, useState } from 'react';
import { IUser, IGame, IStat, ILeaderboards } from '../interfaces';
import { useNavigate, Navigate, useParams } from 'react-router-dom';
import { socket, SocketContext } from '../context/socket';

export const Ladder = () => {
	let Navigate = useNavigate();
	const [redirect, setRedirect] = useState(false);
	const [leaderboards, setLeaderboards] = useState<ILeaderboards>();
	const [rerender, setRerender] = useState(false);
	const [selectedLadder, setSelectedLadder] = useState(true);
	let rerendUseEffect:boolean = true;

	useEffect(()=> {
		socket.emit("games_leaderboards",{},(data: any) => {
			if (data.messages) {
				alert(data.messages);
				setRedirect(true);
			}
			else{
				setLeaderboards(data);
				if (leaderboards && leaderboards.elo && leaderboards.mostPlayed)
				{
					leaderboards.elo = leaderboards.elo.slice(10);
					leaderboards.mostPlayed = leaderboards.mostPlayed.slice(10);
				}
			}
		}
		)
	},[rerender, rerendUseEffect]);
	if (!leaderboards) {
		setTimeout(() => {
			setRerender(!rerender);
		}, 1000);
		return (
			<div className="loading-wapper">
				<div>Loading...</div>
			</div>
		);
	}

	const ladderEloClickHandler= (score: IUser) => { // navigate to the user profil
		let opponent_profil: string = "/stats/";
		opponent_profil += score.id;
		Navigate(opponent_profil);
		setRerender(!rerender);
	}

	const ladderPlayedClickHandler= (score: IStat) => { // navigate to the user profil
		let opponent_profil: string = "/stats/";
		opponent_profil += score.user.id;
		Navigate(opponent_profil);
		setRerender(!rerender);
	}

	const displayLadderPodium = () => {
		if (selectedLadder) {
			let podium: IUser[] = leaderboards.elo.slice(0, 3);
			console.log(podium, leaderboards.elo);
			return podium.map((score, index) => (
				<span className="ladder-item" key={index} id={"rank"+index} onClick={() => ladderEloClickHandler(score)}>
					<div><img src={score.profile_picture} alt="picture error" /></div>
					Rank:{index + 1} <br />{score.elo} {score.displayName}
				</span>
		));
		}
		else {
			let podium: IStat[] = leaderboards.mostPlayed.slice(0, 3);
			return podium.map((score, index) => (
				<span className="ladder-item" key={index} id={"rank"+index} onClick={() => ladderPlayedClickHandler(score)}>
					<div><img src={score.user.profile_picture} alt="picture error" /></div>
					Rank:{index + 1} <br />{score.stats.games} {score.user.displayName}
				</span>
		));
		}
	};

	const displayLadder = () => {
		
		if (selectedLadder && leaderboards.elo.length > 3) {
			let podium: IUser[] = leaderboards.elo.slice(3 - leaderboards.elo.length);
			console.log("dispalyladder",podium, leaderboards.elo);
			return podium.map((score, index) => (
				<span className="ladder-item" key={index} onClick={() => ladderEloClickHandler(score)}>
					<div><img src={score.profile_picture} alt="picture error" /></div>
					Rank:{index + 4} <br />{score.elo} {score.displayName}
				</span>
		));
		}
		else if (!selectedLadder && leaderboards.mostPlayed.length > 3) {
			let podium: IStat[] = leaderboards.mostPlayed.slice(3 - leaderboards.mostPlayed.length );

			return podium.map((score, index) => (
				<span className="ladder-item" key={index} onClick={() => ladderPlayedClickHandler(score)}>
					<div><img src={score.user.profile_picture} alt="picture error" /></div>
					Rank:{index + 4}<br />{score.stats.games} {score.user.displayName}
				</span>
		));
		}
	};
	return(
		<div className='ladder-wrapper'>
			<div>
			<input className="selectLadder" type="Checkbox" onChange={() => setSelectedLadder(!selectedLadder)} id="myCheckbox" checked={selectedLadder} >
			</input>
			<label htmlFor="myCheckbox">Ladder: {selectedLadder? <><span className="label-item"> elo</span> Played</>: <> elo<span className="label-item"> Played</span></> } </label>
			</div>
			<div className='ladder-items-wrapper'>
				<div className='podium'>
					{displayLadderPodium()}
				</div>
				<div className='non-podium'>
					{displayLadder()}
				</div>
			</div>
		</div>
	)
};

export default Ladder;
