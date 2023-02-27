import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import ChanBanItem from './ChanBanItem'

type ChansInvProps = {
	chan: IChannel,
    chanList : IChannel[],
	user_me : IUser,
    chanListJoin: (chan_code: string | undefined) => void;
};

export const ChansInv = (props: ChansInvProps) => {
    const socket = useContext(SocketContext);

    const handleJoinClick = () => {
        props.chanListJoin(props.chan?.code)
    };

	return (
		<div className="ChansInv-wrapper">			
			<div className="">
                <div className='chan-list-item modal-item pixel-font'>
                    <span className='pixel-font'>{props.chan?.name}</span>
                    <span className="e-icons e-medium e-plus modal-e-plus" onClick={handleJoinClick}></span>
                </div>
			</div>
		</div>
	);
};

export default ChansInv;