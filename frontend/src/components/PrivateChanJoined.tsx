import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

type PrivateChanJoinedProps = {
	chan: IChannel;
	userToInviteId: number;
	chanInvit: (chan_id: number, invited_user_id: number) => void;
};

export const PrivateChanJoined = (props: PrivateChanJoinedProps) => {
	const chanInvit = (): void => {
		props.chanInvit(props.chan.id, props.userToInviteId);
	};

	return (
		<div className="wrapper-private-chan-joined-item">
			<div className="private-chan-joined-item nes-btn is-primary" onClick={chanInvit}>
				{props.chan.name}
			</div>
		</div>
	);
};

export default PrivateChanJoined;
