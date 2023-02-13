import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';

import PrivateChanJoined from './PrivateChanJoined'

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

type FriendProps = {
	user: IUser,
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
};

export const Friend = (props: FriendProps) => {
	const socket = useContext(SocketContext);

	const [chanListJoined, setChanListJoined] = useState<IChannel[]>([]);

    const [openFActionModal, setOpenFriendActionModal] = React.useState(false);
	const OpenFriendActionModal = () => setOpenFriendActionModal(true);
	const CloseFriendActionModal = () => setOpenFriendActionModal(false);

	const [openChanListModal, setOpenChanListModal] = React.useState(false);
	const OpenChanListModal = () => setOpenChanListModal(true);
	const CloseChanListModal = () => setOpenChanListModal(false);

	const removeFriend = (event: any): void => {
		socket.emit(
			'users_removeFriend',
			{
				id: props.user.id,
			},
			(data: any) => {
				if (data.messages)
					alert(data.messages);
			},
		);
	}

	useEffect(() => {
		socket.emit('channels_listJoined', {}, (data: any) => {
			setChanListJoined(data);
		});
	}, []);

	return (
		<div data-id={props.user.id} data-conv-type='friend-conv' className="wrapper-active-conv" onClick={props.activeConv}>
			<Link to={`/profile/${props.user.id}`}>
				{props.user.username}
			</Link>
			<div className="friendsList-settings">
				{/* {props.states === 'connected' && (
					<span className="e-icons e-medium e-play"></span>
				)}
				{props.states === 'ingame' && (
					<span className="e-icons e-medium e-radio-button"></span>
				)} */}
				<span className="e-icons e-medium e-menu"  onClick={OpenFriendActionModal}></span>
				<Modal
					open={openFActionModal}
					onClose={CloseFriendActionModal}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box className="friend-action-modal">
						<button>Inviter à jouer</button>
						<button>Regarder la partie</button>
						<button onClick={OpenChanListModal}>Inviter channel</button>
						<button onClick={removeFriend}>Suprrimer</button>
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
					{chanListJoined?.filter(chan => {
							if (chan.visibility === 'private')
								return true;
							return false
						})
						.map(chan => (
							<PrivateChanJoined chan={chan} userToInviteId={props.user.id}/>
						))
					}
                </Box>
            </Modal>
		</div>
	);
};

export default Friend;
