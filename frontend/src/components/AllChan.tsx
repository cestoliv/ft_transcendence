import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelBannedUser, IChannelInvitedUser } from '../interfaces';

import ChansBan from './ChansBan'
import ChansInv from './ChansInv'
import ChansOther from './ChansOther'

type AllChanProps = {
	user_me : IUser,
};

export const AllChan = (props: AllChanProps) => {
    const socket = useContext(SocketContext);

    const [chans, setChans] = useState<IChannel[] | null>(null);

    useEffect(() => {
        socket.emit(
            'channels_list',
            {},
             (data: any) => {
                setChans(data);
		    });
	},[chans]);

	return (
		<div className="AllChan-wrapper">
            <h3 className='display-chan-title pixel-font'>All Chan</h3>
            <div className='ChansOther-wrapper'>
              {chans?.filter(chan => {
                  if (chan.visibility === 'public' ||chan.visibility == 'password-protected')
                    return true;
                  return false
                })
                .map(chan => (
                  <ChansOther chan={chan} user_me={props.user_me}/>
                ))
              }
            </div>
            <h3 className='display-chan-title pixel-font'>ban Chan</h3>
            {chans?.map(chan => (
						  <ChansBan chan={chan} user_me={props.user_me}/>
					  ))}
            <h3 className='display-chan-title pixel-font'>invit chan</h3>
            {chans?.map(chan => (
						  <ChansInv chan={chan} user_me={props.user_me}/>
					  ))}
		</div>
	);
};

export default AllChan;
