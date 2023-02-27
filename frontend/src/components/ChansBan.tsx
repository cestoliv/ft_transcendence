import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import ChanBanItem from './ChanBanItem'

type ChansBanProps = {
	chan: IChannel | null,
	user_me : IUser,
};

export const ChansBan = (props: ChansBanProps) => {

	const isBan = (): boolean => {
        if (props.chan)
        {
            let x = 0;
            while (x < props.chan.banned.length)
            {
                if (props.chan.banned[x].userId === props.user_me.id)
                    return true;
                x++;
            }
            return false;
        }
        return false;
    }

	return (
		<div className="ChansBan-item-wrapper">			
				{isBan() && (
					<div className='chan-list-item modal-item'>
                        <span className='pixel-font'>{props.chan?.name}</span>
                    </div>
				)}
		</div>
	);
};

export default ChansBan;
