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

    const [openChanListModal, setOpenChanListModal] = React.useState(false);
	const OpenChanListModal = () => setOpenChanListModal(true);
	const CloseChanListModal = () => setOpenChanListModal(false);

	useEffect(() => {
		socket.emit('channels_listJoined', {}, (data: any) => {
			setChanListJoined(data);
		});
		console.log("hello 70");
		console.log(chanListJoined);
	}, [chanListJoined]);

	return (
		<div className="wrapper-active-conv" onClick={props.activeConv}>
			<Link to={`/profile/${props.user.id}`}>
				{props.user.username}
			</Link>
			<span className="e-icons e-medium e-play" onClick={OpenChanListModal}></span>
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
							<PrivateChanJoined chan={chan}/>
						))
					}
                </Box>
            </Modal>
			{/* <Link to={`/profile/${props.idd}`} className={props.states}>
				{props.name}
			</Link> */}
			{/* <div className="friendsList-settings">
				{props.states === 'connected' && (
					<span className="e-icons e-medium e-play"></span>
				)}
				{props.states === 'ingame' && (
					<span className="e-icons e-medium e-radio-button"></span>
				)}
				<span className="e-icons e-medium e-close"></span>
			</div> */}
		</div>
	);
};

export default Friend;
