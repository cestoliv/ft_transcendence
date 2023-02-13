import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelMessage, IUserMessage } from '../interfaces';

type FriendConvMessagesProps = {
	user_me : IUser,
	chan_id : number,
};

export const FriendConvMessages = (props: FriendConvMessagesProps) => {
    const socket = useContext(SocketContext);
    const [chanMessages, setChanMessages] = useState<IUserMessage[] | null>(null);

    useEffect(() => {
        if (props.chan_id)
        {
            socket.emit('users_getMessages', {
                id: props.chan_id,
                before: new Date().toISOString(),
            },
                (data: any) => {
                    setChanMessages(data);
                }
            );
        }
	}, [chanMessages]);

	return (
		<div className='chat-messages-wrapper'>
		{chanMessages && chanMessages.map((message, index) => (
			<div key={index} className="display-message">
				<div className='message-name-date'><p className='message-name'>{message?.sender.username}</p><p className='message-date'>{message?.sentAt.toString()}</p></div>
				<p className='message'>{message?.message}</p>
			</div>
		))}
	</div>
	);
};

export default FriendConvMessages;
