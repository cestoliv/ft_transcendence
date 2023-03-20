import React, { useEffect, useContext } from 'react';
import { message } from 'antd';
import { useState } from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

import { IChannel, IUser, IUserFriend, ILocalGameInfo, IChannelMessage } from '../interfaces';

import useMatchmaking from '../hooks/useMatchmaking';
import FriendsList from '../components/FriendsList';
import useGameInfo from '../hooks/useGameInfo';
import { SocketContext } from '../context/socket';
import { SearchSettings } from '../components/SearchGame/SearchSettings';

type FriendsProps = {
	user_me: IUser;
};

export const SearchGame = (props: FriendsProps) => {
	const socket = useContext(SocketContext);

	// for friendlist component
	const [chanList, setChanList] = useState<IChannel[]>([]);
	const [friendOf, setFriendOf] = useState<IUserFriend[]>([]);
	const [friends, setFriends] = useState<IUser[]>([]);

	// list of available games
	const [availableGames, setAvailableGames] = useState<ILocalGameInfo[]>([]);

	// Search Filter
	// const [visibility, setVisibility] = useState('public');
	const [mode, setMode] = useState('classic');
	const [time, setTime] = useState('1');
	const [points, setPoints] = useState('5');

	const { gameInfo, setGameInfo } = useGameInfo();
	const { inMatchmaking, setInMatchmaking } = useMatchmaking();

	const [user, setUser] = useState<IUser>();

	const activeConv = (event: any) => {
		let active_elem = document.getElementsByClassName('active-conv-bg')[0];
		if (active_elem) active_elem.classList.toggle('active-conv-bg');
		const element = event.target;
		element.classList.toggle('active-conv-bg');
		active_elem = element;
	};

	const showOptions = () => {
		document.getElementsByClassName('searchGame-settings')[0]?.classList.toggle('active-searchGame-settings');
	};

	const showFriends = () => {
		document.getElementsByClassName('priv-conv-list')[0]?.classList.toggle('active-friends-list');
	};

	const createGame = () => {
		// if (gameInfo || inMatchmaking) {
		// 	message.error('You are already in a game');
		// 	return;
		// }
		socket.emit(
			'games_create',
			{
				maxDuration: parseInt(time),
				maxScore: parseInt(points),
				mode: mode,
				visibility: 'public',
			},
			(data: any) => {
				// console.log(data);
				if (data?.statusCode) {
					message.error(data.messages);
					return;
				}
				message.success('Game created');
				setGameInfo(data);
			},
		);
	};

	const joinMatchmaking = () => {
		socket.emit('games_joinMatchmaking', (data: any) => {
			// console.log(data);
			// console.log(gameInfo);
			setInMatchmaking(data);
		});
	};

	const quitGame = () => {
		if (!gameInfo || !gameInfo.id) {
			setGameInfo(null);
			return;
		}
		socket.emit(
			'games_quit',
			{
				id: gameInfo.id,
			},
			(data: any) => {
				// console.log(data);
				if (data?.statusCode) {
					message.error(data.error);
					return;
				}
				setGameInfo(null);
			},
		);
	};

	const quitMatchmaking = () => {
		socket.emit('games_quitMatchmaking', (data: any) => {
			// console.log(data);
			if (data?.statusCode) {
				message.error(data.messages);
				return;
			}
			setInMatchmaking(data);
		});
	};

	const handleQuit = () => {
		if (gameInfo) {
			quitGame();
		} else if (inMatchmaking) {
			quitMatchmaking();
		}
	};

	// socket.off('games_start');
	// socket.on('games_start', (data: any) => {
	// 	navigate(`/pong/${data.id}`);
	// 	console.log(data);
	// });

	const AddFriend = (username: string) => {
		socket.emit(
			'users_inviteFriend',
			{
				username: username,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
			},
		);
	};

	const accept_friend_request = (inviter_id: number, display_message: number): void => {
		socket.emit(
			'users_acceptFriend',
			{
				id: inviter_id,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					setFriends((prevFriends) => [...prevFriends, data.inviter as IUser]);
					setFriendOf((prevList) => prevList.filter((item) => item.inviterId !== (data.inviterId as number)));
					if (display_message) message.destroy();
				}
			},
		);
	};

	const refuse_friend_request = (inviter_id: number, display_message: number): void => {
		socket.emit(
			'users_removeFriend',
			{
				id: inviter_id,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					setFriendOf((prevList) => prevList.filter((item) => item.inviterId !== (data.inviterId as number)));
					if (display_message) message.destroy();
				}
			},
		);
	};

	const removeFriend = (user_id: number): void => {
		socket.emit(
			'users_removeFriend',
			{
				id: user_id,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else setFriends((prevList) => prevList.filter((user) => user.id !== user_id));
			},
		);
	};

	const muteFriend = (muteTime: string, friend_id: number) => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(muteTime));
		socket.emit(
			'users_mute',
			{
				id: friend_id,
				until: now,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
			},
		);
	};

	const banFriend = (banTime: string, friend_id: number): void => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(banTime));
		socket.emit(
			'users_ban',
			{
				id: friend_id,
				until: now,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else setFriends((prevList) => prevList.filter((user) => user.id !== friend_id));
			},
		);
	};

	// start socket.on user

	socket.off('users_update'); // Unbind previous event
	socket.on('users_update', (data: any) => {
		console.log('users_update', data);
		const index = friends.findIndex((friend) => friend.id === (data.id as number));

		if (index !== -1) {
			const updatedFriendList: IUser[] = [...friends];
			updatedFriendList[index] = data as IUser;
			setFriends(updatedFriendList);
		}
	});

	socket.off('users_friendshipInvitation'); // Unbind previous event
	socket.on('users_friendshipInvitation', (data: any) => {
		setFriendOf((prevList) => [...prevList, data as IUserFriend]);
	});

	socket.off('users_friendshipAccepted'); // Unbind previous event
	socket.on('users_friendshipAccepted', (data: any) => {
		setFriends((prevList) => [...prevList, data.invitee as IUser]);
	});

	socket.off('users_friendshipRemoved'); // Unbind previous event
	socket.on('users_friendshipRemoved', (data: any) => {
		setFriends((prevList) => prevList.filter((friend) => friend.id !== (data.invitee.id as number)));
		setFriends((prevList) => prevList.filter((friend) => friend.id !== (data.inviter.id as number)));
	});

	socket.off('users_banned'); // Unbind previous event
	socket.on('users_banned', (data: any) => {
		setFriends((prevList) => prevList.filter((user) => user.id !== (data.userId as number)));
	});

	useEffect(() => {
		socket.emit(
			'users_get',
			{
				id: props.user_me.id,
			},
			(data: any) => {
				setUser(data);
			},
		);
	}, []);

	useEffect(() => {
		console.log('ChansList UseEffect');
		socket.emit('channels_list', {}, (data: IChannel[]) => {
			const chanJoined = data.filter((channel) =>
				channel.members.some((member) => member.id === props.user_me.id),
			);
			// props.chanList.map(chan => (console.log(chan)));
			// Mettez à jour l'état de votre composant avec la liste des canaux privés non rejoint par l'utilisateur donné.
			setChanList(chanJoined);
		});
		// Filtrez tous les canaux privés auxquels l'utilisateur n'a pas encore rejoint.
	}, []);

	useEffect(() => {
		console.log('FriendsList useEffect');
		socket.emit(
			'users_get',
			{
				id: props.user_me.id,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					setFriendOf(data.friendOf);
					setFriends(data.friends);
				}
			},
		);
	}, []);

	useEffect(() => {
		console.log('Available games useEffect');
		socket.emit('games_available', {}, (data: any) => {
			if (data.statusCode) message.error(data.error);
			else setAvailableGames(data);
		});
	}, []);

	socket.off('games_available');
	socket.on('games_available', (data: any) => {
		if (data.statusCode) message.error(data.error);
		else setAvailableGames(data);
	});

	return (
		<div className="searchGame-wrapper">
			{user && (
				<FriendsList
					user_me={user}
					chanList={chanList}
					friends={friends}
					friendOf={friendOf}
					activeConv={activeConv}
					AddFriend={AddFriend}
					accept_friend_request={accept_friend_request}
					refuse_friend_request={refuse_friend_request}
					removeFriend={removeFriend}
					banFriend={banFriend}
					muteFriend={muteFriend}
					gameInfo={gameInfo}
				/>
			)}
			<div className="searchRandomPlayer">
				{gameInfo || inMatchmaking ? (
					<div className="loading-wrapper">
						<p className="loading">
							<span>w</span>
							<span>a</span>
							<span>i</span>
							<span>t</span>
							<span>i</span>
							<span>n</span>
							<span>g</span>
						</p>
						{inMatchmaking ? (
							<>
								{availableGames.length > 0 ? (
									<p>
										<span className="nes-text is-primary">{availableGames.length}</span> games
										available
									</p>
								) : (
									<p className="nes-text is-disabled">
										no game available,
										<br />
										you should create one!
									</p>
								)}
							</>
						) : (
							<></>
						)}
						<button className="quit nes-btn" onClick={handleQuit}>
							Quit
						</button>
					</div>
				) : (
					<>
						<div className="available-games-wrapper">
							{availableGames.length > 0 ? (
								<p>
									<span className="nes-text is-primary">{availableGames.length}</span> games available
								</p>
							) : (
								<p className="nes-text is-disabled">
									no game available,
									<br />
									you should create one!
								</p>
							)}
						</div>
						<div className="button-wrapper">
							{/* <button className="searchButton nes-btn" onClick={createGame}>
								Create a game
							</button> */}
							<button className="searchButton nes-btn is-primary" onClick={joinMatchmaking}>
								Search a game
							</button>
						</div>
					</>
				)}
				{/* <Modal
					open={open}
					onClose={handleClose}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box sx={style}>
						<button className="redirect-button" onClick={handleRedirect}>
							redirect
						</button>
					</Box>
				</Modal> */}
				<div className="button-wrapper">
					<button onClick={showOptions} className="show-settings nes-btn">
						Settings
					</button>
					<button onClick={showFriends} className="show-friends nes-btn">
						Friends
					</button>
				</div>
			</div>
			<SearchSettings setMode={setMode} setTime={setTime} setPoints={setPoints} createGame={createGame} />
			{/* <div className="searchGame-settings">
				<div className="formControl formControl-mode-wrapper">
					<Box sx={{ minWidth: 120 }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">Mode</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={mode}
								label="Mode"
								onChange={handleChangeMode}
							>
								<MenuItem value={'Normal'}>Normal</MenuItem>
								<MenuItem value={'hard'}>Hard</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</div>
				<div className="formControl formControl-time-wrapper">
					<Box sx={{ minWidth: 120 }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">Time</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={time}
								label="Mode"
								onChange={handleChangeTime}
							>
								<MenuItem value={2}>2 min</MenuItem>
								<MenuItem value={5}>5 min</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</div>
				<div className="formControl formControl-points-wrapper">
					<Box sx={{ minWidth: 120 }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">Points</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={points}
								label="Mode"
								onChange={handleChangePoints}
							>
								<MenuItem value={0}>Any</MenuItem>
								<MenuItem value={5}>5</MenuItem>
								<MenuItem value={10}>10</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</div>
			</div> */}
		</div>
	);
};

export default SearchGame;
