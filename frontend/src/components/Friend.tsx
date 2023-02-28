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
	gameInfo: any;
};

export const Friend = (props: FriendProps) => {
	const socket = useContext(SocketContext);

	// const [chanListJoined, setChanListJoined] = useState<IChannel[]>([]);

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
		if (!props.gameInfo) {
			message.error('No game created');
			return;
		}
		socket.emit('games_invite', { id: props.gameInfo.id, user_id: props.user.id }, (data: any) => {
			console.log(data);
			if (data?.statusCode) {
				message.error(data.messages);
				return;
			}
			message.success('Invitation sent');
		});
	};

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
			<Link to={`/profile/${props.user.id}`} className='friend-list-item-username pixel-font '>{props.user.username}</Link>
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
						<button onClick={inviteFriend}>Inviter à jouer</button>
						<button>Regarder la partie</button>
						<button onClick={OpenChanListModal}>Inviter channel</button>
						<button onClick={muteFriend}>Mute</button>
						<button onClick={banFriend}>Ban</button>
						<button onClick={removeFriendClick}>Suprrimer</button>
					</Box>
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
