import * as React from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import { useEffect, useState } from 'react';
import { IUser, IStat, ILeaderboards } from '../interfaces';
import { useNavigate } from 'react-router-dom';
import { socket } from '../context/socket';
import { message } from 'antd';

export const Ladder = () => {
	const Navigate = useNavigate();
	const [leaderboards, setLeaderboards] = useState<ILeaderboards>();
	const [rerender, setRerender] = useState(false);
	const [selectedLadder, setSelectedLadder] = useState(true);
	const rerendUseEffect = true;

	useEffect(() => {
		socket.emit('games_leaderboards', {}, (data: any) => {
			if (data.messages) {
				message.error(data.messages);
			} else {
				setLeaderboards(data);
				if (leaderboards && leaderboards.elo && leaderboards.mostPlayed) {
					leaderboards.elo = leaderboards.elo.slice(10);
					leaderboards.mostPlayed = leaderboards.mostPlayed.slice(10);
				}
			}
		});
	}, [rerender, rerendUseEffect]);
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

	const ladderEloClickHandler = (score: IUser) => {
		// navigate to the user profil
		let opponent_profil = '/stats/';
		opponent_profil += score.id;
		Navigate(opponent_profil);
		setRerender(!rerender);
	};

	const ladderPlayedClickHandler = (score: IStat) => {
		// navigate to the user profil
		let opponent_profil = '/stats/';
		opponent_profil += score.user.id;
		Navigate(opponent_profil);
		setRerender(!rerender);
	};

	const displayLadderPodium = () => {
		if (selectedLadder) {
			const podium: IUser[] = leaderboards.elo.slice(0, 3);
			return podium.map((score, index) => (
				<span
					className="ladder-item"
					key={index}
					id={'rank' + index}
					onClick={() => ladderEloClickHandler(score)}
				>
					<div>
						<img src={score.profile_picture} alt="picture error" />
					</div>
					Rank:{index + 1} <br />
					{score.elo} {score.username}
				</span>
			));
		} else {
			const podium: IStat[] = leaderboards.mostPlayed.slice(0, 3);
			return podium.map((score, index) => (
				<span
					className="ladder-item"
					key={index}
					id={'rank' + index}
					onClick={() => ladderPlayedClickHandler(score)}
				>
					<div>
						<img src={score.user.profile_picture} alt="picture error" />
					</div>
					Rank:{index + 1} <br />
					{score.stats.games} {score.user.username}
				</span>
			));
		}
	};

	const displayLadder = () => {
		if (selectedLadder && leaderboards.elo.length > 3) {
			const podium: IUser[] = leaderboards.elo.slice(3 - leaderboards.elo.length);
			return podium.map((score, index) => (
				<span className="ladder-item" key={index} onClick={() => ladderEloClickHandler(score)}>
					<div>
						<img src={score.profile_picture} alt="picture error" />
					</div>
					Rank:{index + 4} <br />
					{score.elo} {score.username}
				</span>
			));
		} else if (!selectedLadder && leaderboards.mostPlayed.length > 3) {
			const podium: IStat[] = leaderboards.mostPlayed.slice(3 - leaderboards.mostPlayed.length);

			return podium.map((score, index) => (
				<span className="ladder-item" key={index} onClick={() => ladderPlayedClickHandler(score)}>
					<div>
						<img src={score.user.profile_picture} alt="picture error" />
					</div>
					Rank:{index + 4}
					<br />
					{score.stats.games} {score.user.username}
				</span>
			));
		}
	};
	if ((selectedLadder && leaderboards.elo.length < 1) || (!selectedLadder && leaderboards.mostPlayed.length < 1)) {
		return <div className="ladder-wrapper-no-data">No current data</div>;
	}
	return (
		<div className="ladder-wrapper">
			<div>
				<input
					className="selectLadder"
					type="Checkbox"
					onChange={() => setSelectedLadder(!selectedLadder)}
					id="myCheckbox"
					checked={selectedLadder}
				></input>
				<label htmlFor="myCheckbox">
					Ladder:{' '}
					{selectedLadder ? (
						<>
							<span className="label-item"> elo</span> Played
						</>
					) : (
						<>
							{' '}
							elo<span className="label-item"> Played</span>
						</>
					)}{' '}
				</label>
			</div>
			<div className="ladder-items-wrapper">
				<div className="podium">{displayLadderPodium()}</div>
				<div className="non-podium">{displayLadder()}</div>
			</div>
		</div>
	);
};

export default Ladder;
