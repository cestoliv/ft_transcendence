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
};

export const PrivateChanJoined = (props: PrivateChanJoinedProps) => {
	const socket = useContext(SocketContext);

	const chanInvit = (event: any): void => {
		socket.emit(
			'channels_inviteUser',
			{
				id: props.chan.id,
				user_id: props.userToInviteId,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else {
					console.log('hello100');
					console.log(data);
				}
			},
		);
	};
	return (
		<div className="wrapper-private-chan-joined-item">
			<div className="private-chan-joined-item" onClick={chanInvit}>
				{props.chan.name}
			</div>
		</div>
	);
};

export default PrivateChanJoined;
