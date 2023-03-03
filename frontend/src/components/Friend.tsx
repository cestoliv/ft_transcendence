import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';

import useGameInfo from '../hooks/useGameInfo';

import PrivateChanJoined from './PrivateChanJoined';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { message } from 'antd';

type FriendProps = {
	user: IUser;
	chanList: IChannel[];
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	removeFriend: (user_id: number) => void;
	gameInfo: any;
};

export const Friend = (props: FriendProps) => {
	const socket = useContext(SocketContext);
	const navigate = useNavigate();
	const { gameInfo, setGameInfo } = useGameInfo();

	// const [chanListJoined, setChanListJoined] = useState<IChannel[]>([]);
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

	const removeFriendClick = (event: any): void => {
		props.removeFriend(props.user.id);
	};

	const muteFriend = (event: any): void => {
		socket.emit(
			'users_mute',
			{
				id: props.user.id,
				until: new Date().toISOString(),
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
			},
		);
	};

	const banFriend = (event: any): void => {
		socket.emit(
			'users_ban',
			{
				id: props.user.id,
				until: new Date().toISOString(),
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
			},
		);
	};

	const inviteFriend = () => {
		socket.emit('games_create', { maxDuration: parseInt(time), maxScore: parseInt(points), mode: mode, visibility: 'private' }, (data: any) => {
			console.log(data);
			if (data?.statusCode) {
				message.error(data.messages);
				return;
			}
			socket.emit('games_invite', { id: data.id, user_id: props.user.id }, (data: any) => {
				console.log(data);
				if (data?.statusCode) {
					message.error(data.messages);
					// TODO: delete game if needed
					return;
				}
				message.success('Invitation sent');
			});
		});
	};

	const showGame = () => {
		console.log(props.user.id)
		socket.emit('games_userGame', { id: props.user.id }, (data: any) => {
			console.log(data);
			if (data?.statusCode) {
				message.error(data.messages);
				return;
			}
			socket.emit('games_startWatching', { id: data.id }, (data: any) => {
				console.log(data);
				if (data?.statusCode) {
					message.error(data.messages);
					return;
				}
				setGameInfo({...data, isWatching: true});
				navigate(`/pong/${data.id}`)
			});
		});
		console.log(gameInfo);
	}

	// useEffect(() => {
	// 	console.log("Friend useEffect");
	// 	socket.emit('channels_listJoined', {}, (data: any) => {
	// 		setChanListJoined(data);
	// 	});
	// }, []);

	return (
		<div
			data-id={props.user.id}
			data-conv-type="friend-conv"
			className="wrapper-active-conv list-item"
			onClick={props.activeConv}
		>
			<div className="avatar_username">
				<img className='avatar' src={props.user.profile_picture} alt="" />
				<Link to={`/profile/${props.user.id}`} className='friend-list-item-username pixel-font '>{props.user.username}</Link>
			</div>
			<div className="friendsList-settings">
				{/* {props.states === 'connected' && (
					<span className="e-icons e-medium e-play"></span>
				)}
				{props.states === 'ingame' && (
					<span className="e-icons e-medium e-radio-button"></span>
				)} */}
				<span className="e-icons e-medium e-menu modal-e-plus" onClick={OpenFriendActionModal}></span>
				<Modal
					open={openFActionModal}
					onClose={CloseFriendActionModal}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box className="friend-action-modal background-modal">
						<button className='discord-blue' onClick={OpenInviteGameModal}>Inviter à jouer</button>
						<button className='discord-blue' onClick={showGame}>Regarder la partie</button>
						<button className='discord-blue' onClick={OpenChanListModal}>Inviter channel</button>
						<button className='discord-blue' onClick={muteFriend}>Mute</button>
						<button className='discord-blue' onClick={banFriend}>Ban</button>
						<button className='discord-blue' onClick={removeFriendClick}>Suprrimer</button>
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
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMode(e.target.value)}
								required
								id="mode_select"
							>
								{modeOptions.map((option) => {
									return (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									);
								})}
							</select>
						</div>
						<label htmlFor="time-select">Time</label>
						<div className="nes-select is-dark">
							<select
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTime(e.target.value)}
								required
								id="time_select"
							>
								{timeOptions.map((option) => {
									return (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									);
								})}
							</select>
						</div>
						<label htmlFor="points_select">Points</label>
						<div className="nes-select is-dark">
							<select
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPoints(e.target.value)}
								required
								id="points_select"
							>
								{pointsOptions.map((option) => {
									return (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									);
								})}
							</select>
						</div>
						<button className="nes-btn" onClick={inviteFriend}>Invite</button>
					</div>
				</Modal>
			</div>
			<Modal
				open={openChanListModal}
				onClose={CloseChanListModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="chan-user-modal">
					{props.chanList
						?.filter((chan) => {
							if (chan.visibility === 'private') return true;
							return false;
						})
						.map((chan) => (
							<PrivateChanJoined key={chan.id} chan={chan} userToInviteId={props.user.id} />
						))}
				</Box>
			</Modal>
		</div>
	);
};

export default Friend;
