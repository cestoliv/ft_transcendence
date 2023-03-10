import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';

import useGameInfo from '../hooks/useGameInfo';

import PrivateChanJoined from './PrivateChanJoined';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { message, Badge } from 'antd';

type FriendProps = {
	user: IUser;
	chanList: IChannel[];
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	removeFriend: (user_id: number) => void;
	banFriend: (banTime: string, friend_id: number) => void;
	gameInfo: any;
};

export const Friend = (props: FriendProps) => {
	const socket = useContext(SocketContext);

	const [redirect, setRedirect] = useState<boolean>(false);
	const navigate = useNavigate();
	const { gameInfo, setGameInfo } = useGameInfo();

	const [banTimeValue, setBanTimeValue] = useState<string>('');
	const [muteTimeValue, setMuteTimeValue] = useState<string>('');

	const [privateChanJoined, setPrivateChanJoined] = useState<IChannel[]>([]);
	const [openInviteGameModal, setOpenInviteGameModal] = React.useState(false);
	const OpenInviteGameModal = () => setOpenInviteGameModal(true);
	const CloseInviteGameModal = () => setOpenInviteGameModal(false);

	const [mode, setMode] = useState('classic');
	const [time, setTime] = useState('1');
	const [points, setPoints] = useState('5');

	const modeOptions = [
		{ value: 'classic', label: 'Classic' },
		{ value: 'hardcore', label: 'Hardcore' },
	];
	const timeOptions = [
		{ value: '1', label: '1 min' },
		{ value: '2', label: '2 min' },
		{ value: '3', label: '3 min' },
	];
	const pointsOptions = [
		{ value: '5', label: '5 points' },
		{ value: '10', label: '10 points' },
		{ value: '30', label: '30 points' },
		{ value: 'null', label: 'No limit' },
	];

	const [openFActionModal, setOpenFriendActionModal] = React.useState(false);
	const OpenFriendActionModal = () => setOpenFriendActionModal(true);
	const CloseFriendActionModal = () => setOpenFriendActionModal(false);

	const [openChanListModal, setOpenChanListModal] = React.useState(false);
	const OpenChanListModal = () => setOpenChanListModal(true);
	const CloseChanListModal = () => setOpenChanListModal(false);

	const [openBanTimeModal, setOpenBanTimeModal] = React.useState(false);
	const OpenBanTimeModal = () => setOpenBanTimeModal(true);
	const closeBanTimeModal = () => setOpenBanTimeModal(false);

	const [openMuteTimeModal, setOpenMuteTimeModal] = React.useState(false);
	const OpenMuteTimeModal = () => setOpenMuteTimeModal(true);
	const closeMuteTimeModal = () => setOpenMuteTimeModal(false);

	const handleChangeBantime = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'ban-time-input')
			setBanTimeValue(event.target.value);
	};

	const handleChangeMutetime = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'mute-time-input')
			setMuteTimeValue(event.target.value);
	};

	const removeFriendClick = (): void => {
		props.removeFriend(props.user.id);
	};

	const banFriend = async (event: any) => {
		event.preventDefault();
		props.banFriend(banTimeValue, props.user.id);
		closeBanTimeModal();
		setBanTimeValue('');
	};

	const muteFriend = async (event: any) => {
		event.preventDefault();
		const now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(muteTimeValue));
		socket.emit(
			'users_mute',
			{
				id: props.user.id,
				until: now,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else {
					closeMuteTimeModal();
					setMuteTimeValue('');
				}
			},
		);
	};

	const inviteFriend = () => {
		socket.emit(
			'games_create',
			{
				maxDuration: parseInt(time),
				maxScore: parseInt(points),
				mode: mode,
				visibility: 'private',
			},
			(data: any) => {
				console.log(data);
				if (data?.statusCode) {
					message.error(data.messages);
					return;
				}
				socket.emit(
					'games_invite',
					{ id: data.id, user_id: props.user.id },
					(data: any) => {
						console.log(data);
						if (data?.statusCode) {
							message.error(data.messages);
							// TODO: delete game if needed
							return;
						}
						message.success('Invitation sent');
					},
				);
			},
		);
	};

	const chanInvit = (chan_id: number, invited_user_id: number): void => {
		socket.emit(
			'channels_inviteUser',
			{
				id: chan_id,
				user_id: invited_user_id,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else {
					setPrivateChanJoined((prevList) =>
						prevList.filter(
							(chan) => chan.id !== (data.channelId as number),
						),
					);
				}
			},
		);
	};

	const handleRedirect = (event: any): void => {
		setRedirect(true);
	};

	const renderRedirect = () => {
		if (redirect) {
			return <Navigate to={`/stats/${props.user.id}`} />;
		}
	};

	useEffect(() => {
		// Filtrez tous les canaux privés auxquels l'utilisateur n'a pas encore rejoint.
		if (props.chanList) {
			let privateChanNotJoined = props.chanList.filter(
				(channel) =>
					channel.visibility === 'private' &&
					!channel.members.some(
						(member) => member.id === props.user.id,
					) &&
					!channel.invited.some(
						(member) => member.userId === props.user.id,
					),
			);
			// props.chanList.map(chan => (console.log(chan)));
			// Mettez à jour l'état de votre composant avec la liste des canaux privés non rejoint par l'utilisateur donné.
			setPrivateChanJoined(privateChanNotJoined);
		}
	}, [props.chanList]);

	const showGame = () => {
		console.log(props.user.id);
		// socket.emit('games_userGame', { id: props.user.id }, (data: any) => {
		// 	console.log(data);
		// 	if (data?.statusCode) {
		// 		message.error(data.messages);
		// 		return;
		// 	}
		// 	socket.emit('games_startWatching', { id: data.id }, (data: any) => {
		// 		console.log(data);
		// 		if (data?.statusCode) {
		// 			message.error(data.messages);
		// 			return;
		// 		}
		// 		setGameInfo({...data, isWatching: true});
		// 		navigate(`/pong/${data.id}`)
		// 	});
		// });
		socket.emit(
			'games_startWatching',
			{ id: props.user.id },
			(data: any) => {
				console.log(data);
				if (data?.statusCode) {
					message.error(data.messages);
					return;
				}
				setGameInfo({ ...data, isWatching: true });
				navigate(`/pong/${data.id}`);
			},
		);
		console.log(gameInfo);
	};

	function getBadgeStyle() {
		if (props.user.status === 'online') {
			return { backgroundColor: 'green' };
		} else if (props.user.status === 'offline') {
			return { backgroundColor: 'red' };
		} else if (props.user.status === 'playing') {
			return { backgroundColor: 'orange' };
		} else {
			return {}; // Retourne un objet vide pour utiliser le style par défaut
		}
	}

	return (
		<div
			data-id={props.user.id}
			data-conv-type="friend-conv"
			className="wrapper-active-conv list-item"
			onClick={props.activeConv}
		>
			{renderRedirect()}
			<Badge
				dot={true}
				className="badge wrapper-active-conv"
				data-id={props.user.id}
				style={getBadgeStyle()}
			>
				<img
					className="avatar wrapper-active-conv-img"
					src={props.user.profile_picture}
					alt=""
					onClick={props.activeConv}
				/>
			</Badge>
			<span
				className="wrapper-active-conv-span pixel-font"
				onClick={props.activeConv}
			>
				{props.user.displayName}
			</span>
			<div className="friendsList-settings">
				<img
					src="https://static.thenounproject.com/png/2758640-200.png"
					alt="Menu"
					onClick={OpenFriendActionModal}
				/>
				<Modal
					open={openFActionModal}
					onClose={CloseFriendActionModal}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box className="friend-action-modal background-modal">
						{props.user.status === 'online' && (
							<button
								className="nes-btn is-primary"
								onClick={OpenInviteGameModal}
							>
								Inviter à jouer
							</button>
						)}
						{props.user.status === 'playing' && (
							<button className="nes-btn is-primary" onClick={showGame}>
								Regarder la partie
							</button>
						)}
						<button
							className="nes-btn is-primary"
							onClick={handleRedirect}
						>
							Profil
						</button>
						<button
							className="nes-btn is-primary"
							onClick={OpenChanListModal}
						>
							Inviter channel
						</button>
						<button
							className="nes-btn is-primary"
							onClick={OpenMuteTimeModal}
						>
							Mute
						</button>
						<button
							className="nes-btn is-primary"
							onClick={OpenBanTimeModal}
						>
							Ban
						</button>
						<button
							className="nes-btn is-primary"
							onClick={removeFriendClick}
						>
							Suprrimer
						</button>
					</Box>
				</Modal>
				<Modal
					open={openInviteGameModal}
					onClose={CloseInviteGameModal}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<div className="invite-game-modal modal">
						<p className="title">Invite to play</p>
						<label htmlFor="mode_select">Mode</label>
						<div className="nes-select is-dark">
							<select
								onChange={(
									e: React.ChangeEvent<HTMLSelectElement>,
								) => setMode(e.target.value)}
								required
								id="mode_select"
							>
								{modeOptions.map((option) => {
									return (
										<option
											key={option.value}
											value={option.value}
										>
											{option.label}
										</option>
									);
								})}
							</select>
						</div>
						<label htmlFor="time-select">Time</label>
						<div className="nes-select is-dark">
							<select
								onChange={(
									e: React.ChangeEvent<HTMLSelectElement>,
								) => setTime(e.target.value)}
								required
								id="time_select"
							>
								{timeOptions.map((option) => {
									return (
										<option
											key={option.value}
											value={option.value}
										>
											{option.label}
										</option>
									);
								})}
							</select>
						</div>
						<label htmlFor="points_select">Points</label>
						<div className="nes-select is-dark">
							<select
								onChange={(
									e: React.ChangeEvent<HTMLSelectElement>,
								) => setPoints(e.target.value)}
								required
								id="points_select"
							>
								{pointsOptions.map((option) => {
									return (
										<option
											key={option.value}
											value={option.value}
										>
											{option.label}
										</option>
									);
								})}
							</select>
						</div>
						<button className="nes-btn" onClick={inviteFriend}>
							Invite
						</button>
					</div>
				</Modal>
			</div>
			<Modal
				open={openChanListModal}
				onClose={CloseChanListModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="chan-user-modal modal">
					{privateChanJoined.map((chan) => (
						<PrivateChanJoined
							key={chan.id}
							chan={chan}
							userToInviteId={props.user.id}
							chanInvit={chanInvit}
						/>
					))}
				</Box>
			</Modal>

			<Modal
				open={openBanTimeModal}
				onClose={closeBanTimeModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="ban-time-modal modal background-modal">
					<form className="ban-time-form" onSubmit={banFriend}>
						<input
							value={banTimeValue}
							name="ban-time-input"
							type="message"
							placeholder="Ban time in minutes"
							onChange={handleChangeBantime}
							required
							className="nes-input is-dark"
						/>
					</form>
				</Box>
			</Modal>

			<Modal
				open={openMuteTimeModal}
				onClose={closeMuteTimeModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="mute-time-modal modal background-modal">
					<form className="mute-time-form" onSubmit={muteFriend}>
						<input
							value={muteTimeValue}
							name="mute-time-input"
							type="message"
							placeholder="Mute time in minutes"
							onChange={handleChangeMutetime}
							required
							className="nes-input is-dark"
						/>
					</form>
				</Box>
			</Modal>
		</div>
	);
};

export default Friend;
