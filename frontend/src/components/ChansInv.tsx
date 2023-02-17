import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import ChanBanItem from './ChanBanItem';

type ChansInvProps = {
	chan: IChannel | null;
	user_me: IUser;
};

export const ChansInv = (props: ChansInvProps) => {
	const socket = useContext(SocketContext);

	const joinChan = (event: any): void => {
		socket.emit(
			'channels_join',
			{
				code: props.chan?.code,
				motdepasse: '',
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
			},
		);
	};

	const isInv = (): boolean => {
		if (props.chan) {
			let x = 0;
			while (x < props.chan.invited.length) {
				if (props.chan.invited[x].userId === props.user_me.id) return true;
				x++;
			}
			return false;
		}
		return false;
	};

	return (
		<div className="ChansInv-wrapper">
			<div className="">
				{isInv() && (
					<div className="chan-list-item">
						<span>{props.chan?.name}</span>
						<span className="e-icons e-medium e-plus" onClick={joinChan}></span>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChansInv;
