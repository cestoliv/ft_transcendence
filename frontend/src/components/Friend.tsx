import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';

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
	banFriend : (banTime : string, friend_id : number) => void;
	gameInfo: any;
};

export const Friend = (props: FriendProps) => {
	const socket = useContext(SocketContext);

	const [banTimeValue, setBanTimeValue] = useState<string>('');
    const [muteTimeValue, setMuteTimeValue] = useState<string>('');

	const [privateChanJoined, setPrivateChanJoined] = useState<IChannel[]>([]);
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

	const [openBanTimeModal, setOpenBanTimeModal] = React.useState(false);
	const OpenBanTimeModal = () => setOpenBanTimeModal(true);
	const closeBanTimeModal = () => setOpenBanTimeModal(false);

    const [openMuteTimeModal, setOpenMuteTimeModal] = React.useState(false);
	const OpenMuteTimeModal = () => setOpenMuteTimeModal(true);
	const closeMuteTimeModal = () => setOpenMuteTimeModal(false);

	const handleChangeBantime = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'ban-time-input') setBanTimeValue(event.target.value);
	};

    const handleChangeMutetime = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'mute-time-input') setMuteTimeValue(event.target.value);
	};

	const removeFriendClick = (event: any): void => {
		props.removeFriend(props.user.id);
	};

	const banFriend = async (event: any) => {
        event.preventDefault();
        props.banFriend(banTimeValue, props.user.id);
        closeBanTimeModal();
    }

    const muteFriend = async (event: any) => {
        event.preventDefault();
		let now = new Date();
        now.setMinutes(now.getMinutes() + parseInt(muteTimeValue));
        socket.emit(
			'users_mute',
			{
				id: props.user.id,
				until: now,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else closeBanTimeModal();
			},
		);
    }

	// const muteFriend = (event: any): void => {
	// 	socket.emit(
	// 		'users_mute',
	// 		{
	// 			id: props.user.id,
	// 			until: new Date().toISOString(),
	// 		},
	// 		(data: any) => {
	// 			if (data.messages) alert(data.messages);
	// 		},
	// 	);
	// };

	// const banFriend = (event: any): void => {
	// 	socket.emit(
	// 		'users_ban',
	// 		{
	// 			id: props.user.id,
	// 			until: new Date().toISOString(),
	// 		},
	// 		(data: any) => {
	// 			if (data.messages) alert(data.messages);
	// 		},
	// 	);
	// };

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

	const chanInvit = (chan_id : number, invited_user_id : number): void => {
		socket.emit(
			'channels_inviteUser',
			{
				id: chan_id,
				user_id: invited_user_id,
			},
			(data: any) => {
				if (data.messages) 
					alert(data.messages);
				else
				{
					setPrivateChanJoined((prevList) => prevList.filter((chan) => chan.id !== data.channelId));
				}
			},
		);
	};

	useEffect(() => {
		// Filtrez tous les canaux privés auxquels l'utilisateur n'a pas encore rejoint.
		let privateChanNotJoined = props.chanList.filter(channel =>
			channel.visibility === 'private' && !channel.members.some(member => member.id === props.user.id) && !channel.invited.some(member => member.userId === props.user.id)
		);
		// props.chanList.map(chan => (console.log(chan)));
		// Mettez à jour l'état de votre composant avec la liste des canaux privés non rejoint par l'utilisateur donné.
		setPrivateChanJoined(privateChanNotJoined);
	}, [props.chanList]);

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
						<button className='discord-blue'>Regarder la partie</button>
						<button className='discord-blue' onClick={OpenChanListModal}>Inviter channel</button>
						<button className='discord-blue' onClick={OpenMuteTimeModal}>Mute</button>
						<button className='discord-blue' onClick={OpenBanTimeModal}>Ban</button>
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
					{privateChanJoined.map((chan) => (
							<PrivateChanJoined key={chan.id} chan={chan} userToInviteId={props.user.id} chanInvit={chanInvit} />
						))}
				</Box>
			</Modal>

			<Modal
                open={openBanTimeModal}
                onClose={closeBanTimeModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="ban-time-modal background-modal">
                    <form className="ban-time-form" onSubmit={banFriend}>
                        <input value={banTimeValue} name='ban-time-input' type='message' placeholder='Ban time in mintues' onChange={handleChangeBantime} required className="ban-time-input"/>
                    </form>
                </Box>
            </Modal>

            <Modal
                open={openMuteTimeModal}
                onClose={closeMuteTimeModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="mute-time-modal background-modal">
                    <form className="mute-time-form" onSubmit={muteFriend}>
                        <input value={muteTimeValue} name='mute-time-input' type='message' placeholder='Mute time in minutes' onChange={handleChangeMutetime} required className="mute-time-input"/>
                    </form>
                </Box>
            </Modal>
		</div>
	);
};

export default Friend;
