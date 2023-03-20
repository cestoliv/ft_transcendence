import * as React from 'react';
import { useEffect, useState } from 'react';
import { IUser, IGame, IStat } from '../interfaces';
import { socket } from '../context/socket';
import { useNavigate, useParams } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import { message } from 'antd';
import { capitalize } from '../utils';

type StatsProps = {
	user_me: IUser;
};

export const Stats = (props: StatsProps) => {
	const params = useParams();
	const [user, setUser] = useState<IUser>();
	const [myUser, setMyUser] = useState<IUser>();
	const [is_friend, setIs_friend] = useState(false);
	const [is_block, setIs_block] = useState(false);
	const [rerender, setRerender] = useState(false);
	const [displayScores, setDisplayScores] = useState<IGame[]>();
	const [userStat, setUserStat] = useState<IStat>();
	const [redirect, setRedirect] = useState(false);
	const Navigate = useNavigate();
	const rerendUseEffect = !rerender;

	useEffect(() => {
		let currentId: number;
		if (params.userId) {
			currentId = parseInt(params.userId);
		} else {
			currentId = props.user_me.id;
		}
		socket.emit(
			'users_get',
			{
				id: currentId,
			},
			(data: any) => {
				if (data.messages) {
					message.error(data.messages);
					setRedirect(true);
				}
				setUser(data);
			},
		);
		socket.emit(
			'users_get',
			{
				id: props.user_me.id,
			},
			(data: any) => {
				if (data.messages) {
					message.error(data.messages);
					setRedirect(true);
				}
				setMyUser(data);
				initIsfriend();
				initBlocked();
			},
		);
		socket.emit(
			'games_history',
			{
				id: currentId,
			},
			(data: any) => {
				if (data.messages) {
					message.error(data.messages);
					setRedirect(true);
				}
				setDisplayScores(data);
			},
		);
		socket.emit(
			'games_userStats',
			{
				id: currentId,
			},
			(data: any) => {
				if (data.messages) {
					message.error(data.messages);
					setRedirect(true);
				}
				setUserStat(data);
			},
		);
	}, [rerender, rerendUseEffect]);
	const initIsfriend = () => {
		if (myUser && user && user.id !== myUser.id && (myUser.friends || myUser.invitedFriends)) {
			let l: number = myUser.friends.length;
			for (let i = 0; i < l; i++) {
				if (myUser.friends[i].id === user.id) {
					return setIs_friend(true);
				}
			}
			l = myUser.invitedFriends.length;
			for (let i = 0; i < l; i++) {
				if (myUser.invitedFriends[i].inviteeId === user.id) {
					return setIs_friend(true);
				}
			}
			return setIs_friend(false);
		}
	};
	const initBlocked = () => {
		if (myUser && user && user.id !== myUser.id && myUser.muted) {
			const l: number = myUser.muted.length;
			const now = new Date();
			for (let i = 0; i < l; i++) {
				if (myUser.muted[i].mutedId === user.id) {
					if (myUser.muted[i].until <= now) return setIs_block(true);
				}
			}
			return setIs_block(false);
		}
	};

	if (redirect) {
		Navigate('/404');
		setRerender(!rerender);
	}
	if (!user || !myUser || !userStat || !displayScores) {
		setTimeout(() => {
			setRerender(!rerender);
		}, 1000);
		return (
			<div className="loading-wapper">
				<div>Loading...</div>
			</div>
		);
	}

	const statClickHandler = (score: IGame) => {
		let opponent_profil = '/stats/';
		if (user.id !== score.loser.id) {
			opponent_profil += score.loser.id;
		} else {
			opponent_profil += score.winner.id;
		}
		Navigate(opponent_profil);
		setRerender(!rerender);
	};
	const gameHistory = () => {
		const lastTenScores = displayScores.slice(-10);
		return lastTenScores.map((game, index) => {
			let side = 'draw';
			if (!game.isDraw) {
				if (user.id === game.winner.id) side = 'left';
				else side = 'right';
			}

			// Current user on the left
			const left = {
				user: game.winner.id === user.id ? game.winner : game.loser,
				score: game.winner.id === user.id ? game.winnerScore : game.loserScore,
			};
			const right = {
				user: game.winner.id === user.id ? game.loser : game.winner,
				score: game.winner.id === user.id ? game.loserScore : game.winnerScore,
			};

			return (
				<span className={`historic-item ${side}`} key={index} onClick={() => statClickHandler(game)}>
					{capitalize(game.mode)} - {game.maxDuration}min <br />
					{left.user.username} {left.score} VS {right.user.username} {right.score}
				</span>
			);
		});
	};
	const defineRank = () => {
		const current_elo: number = user.elo;
		if (current_elo < 1250) {
			return 'Fer';
		} else if (current_elo < 1500) {
			return 'Argent';
		} else if (current_elo < 1750) {
			return 'gold';
		} else if (current_elo < 2000) {
			return 'Platine';
		} else if (current_elo) {
			return 'Diamant';
		} else {
			return 'undefined';
		}
	};
	const displayRank = () => {
		const current_elo: number = user.elo;
		if (current_elo < 1250)
			return (
				<img
					src="https://i.pinimg.com/originals/f5/a5/9d/f5a59d542851a7dcb3d0eae1851af735.png"
					alt="marche po"
				/>
			);
		else if (current_elo < 1500)
			return (
				<img
					src="https://www.jeuxvideo.lol/wp-content/uploads/2015/10/silver_1-510061efab32cd096791a8d62bf63b39-1.png"
					alt="marche po"
				/>
			);
		else if (current_elo < 1750)
			return (
				<img
					src="https://i.pinimg.com/originals/d7/58/1b/d7581b2a1033309523d20c9d1a1f4589.png"
					alt="marche po"
				/>
			);
		else if (current_elo < 2000)
			return (
				<img
					src="https://i.pinimg.com/originals/d7/47/1e/d7471e2ef48175986e9b75b566f61408.png"
					alt="marche po"
				/>
			);
		else if (current_elo)
			return (
				<img
					src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/d6df2d66-13da-4ce4-ae85-8009742c5c94/d6u3aiw-18765c64-e07c-418e-a1d9-ffc958e48202.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi9kNmRmMmQ2Ni0xM2RhLTRjZTQtYWU4NS04MDA5NzQyYzVjOTQvZDZ1M2Fpdy0xODc2NWM2NC1lMDdjLTQxOGUtYTFkOS1mZmM5NThlNDgyMDIucG5nIn1dXX0.Nfy5H5LA8hOJG0tCTSQayRJ3R2H2ThI9eQbbUQNKE84"
					alt="marche po"
				/>
			);
		else
			return (
				<img
					src="https://i.pinimg.com/originals/f5/a5/9d/f5a59d542851a7dcb3d0eae1851af735.png"
					alt="marche po"
				/>
			);
	};
	const percentWinrate = () => {
		if (userStat.stats.wins + userStat.stats.losses > 0)
			return Math.trunc(100 * (userStat.stats.wins / (userStat.stats.losses + userStat.stats.wins)));
		else return 0;
	};
	const onChangeFriend = () => {
		if (is_friend) {
			console.log('removed friend');
			setIs_friend(!is_friend);
			//envois suppr ami au back
			socket.emit(
				`users_removeFriend`,
				{
					id: user.id, // Id of the user how invited the client
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
				},
			);
		} else {
			console.log('added friend');
			setIs_friend(!is_friend);
			socket.emit(
				'users_inviteFriend',
				{
					username: user.username,
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
				},
			);
		}
	};

	const onChangeblocked = () => {
		if (is_block) {
			console.log('removed blocked');
			setIs_block(!is_block);
			socket.emit(
				'users_mute',
				{
					id: user.id,
					until: '2000-01-01T01:00:00-01:00',
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
				},
			);
		} else {
			console.log('added blocked');
			setIs_block(!is_block);
			socket.emit(
				'users_mute',
				{
					id: user.id,
					until: '2666-01-01T01:00:00-01:00',
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
				},
			);
		}
	};

	if (myUser.id === user.id)
		// cas ou c'est nortre profil
		return (
			<div className="wrapper">
				<div className="rank">{displayRank()}</div>
				<div className="profil-wrapper">
					<div className="profil">
						<div className="avatar">
							<svg viewBox="0 0 200 200">
								<circle cx="50%" cy="50%" r="50%" fill="#fff" />
								<clipPath id="circle">
									<circle cx="50%" cy="50%" r="50%" />
								</clipPath>
								<image
									clipPath="url(#circle)"
									href={
										user.profile_picture
											? user.profile_picture
											: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png'
									}
									x="0"
									y="0"
									width="100%"
									height="100%"
								/>
							</svg>
						</div>
						<h2 className="userName">{user.username}</h2>
						<h2>{user.elo} elo</h2>
					</div>
				</div>
				<div className="historic-wrapper">
					<div className="historic">
						<h1>Match history</h1>
						<div className="games">{gameHistory()}</div>
					</div>
				</div>
				<div className="stats-wrapper">
					<div className="stats">
						<h1>Stats</h1>
						<div className="stats-item">
							<span>Nombre de parties</span>
							<span className="score">{userStat.stats.games}</span>
						</div>
						<div className="stats-item">
							<span>Gagnées</span>
							<span className="score">{userStat.stats.wins}</span>
						</div>
						<div className="stats-item">
							<span>Perdu</span>
							<span className="score">{userStat.stats.losses}</span>
						</div>
						<div className="stats-item">
							<span>Winrate</span>
							<span className="score">{percentWinrate()}%</span>
						</div>
						<div className="stats-item">
							<span>Rank</span>
							<span className="score">{defineRank()}</span>
						</div>
					</div>
				</div>
			</div>
		);
	return (
		<div className="wrapper">
			<div className="rank">{displayRank()}</div>
			<div className="profil-wrapper">
				<div className="profil">
					<div className="avatar">
						<svg viewBox="0 0 200 200">
							<circle cx="50%" cy="50%" r="50%" fill="#fff" />
							<clipPath id="circle">
								<circle cx="50%" cy="50%" r="50%" />
							</clipPath>
							<image
								clipPath="url(#circle)"
								href={
									user.profile_picture
										? user.profile_picture
										: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png'
								}
								x="0"
								y="0"
								width="100%"
								height="100%"
							/>
						</svg>
					</div>
					<h2 className="userName">{user.username}</h2>
					<h2>{user.elo} elo</h2>
					<input
						className="addfriend"
						type="Checkbox"
						onChange={() => onChangeFriend()}
						id="myCheckbox"
						checked={is_friend}
					></input>
					<label className="addfiendlabel" htmlFor="myCheckbox"></label>
					<input
						className="block"
						type="Checkbox"
						onChange={() => onChangeblocked()}
						id="myblockCheckbox"
						checked={is_block}
					></input>
					<label className="blocklabel" htmlFor="myblockCheckbox"></label>
				</div>
			</div>
			<div className="historic-wrapper">
				<div className="historic">
					<h1>Match history</h1>
					<div className="games">{gameHistory()}</div>
				</div>
			</div>
			<div className="stats-wrapper">
				<div className="stats">
					<h1>Stats</h1>
					<div className="stats-item">
						<span>Nombre de parties</span>
						<span className="score">{userStat.stats.games}</span>
					</div>
					<div className="stats-item">
						<span>Gagnées</span>
						<span className="score">{userStat.stats.wins}</span>
					</div>
					<div className="stats-item">
						<span>Perdu</span>
						<span className="score">{userStat.stats.losses}</span>
					</div>
					<div className="stats-item">
						<span>Winrate</span>
						<span className="score">{percentWinrate()}%</span>
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
