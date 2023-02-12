import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import 'reactjs-popup/dist/index.css';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

type PrivateChanJoinedProps = {
	chan: IChannel;
};

export const PrivateChanJoined = (props: PrivateChanJoinedProps) => {
	return (
		<div className="wrapper-private-chan-joined-item">
			<span>{props.chan.name}</span>
		</div>
	);
};

export default PrivateChanJoined;
