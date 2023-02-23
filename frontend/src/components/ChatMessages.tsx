import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelMessage } from '../interfaces';

type ChatMessagesProps = {
	user_me : IUser,
	chan_id : number,
    messages : IChannelMessage[],
};

export const ChatMessages = (props: ChatMessagesProps) => {
    const socket = useContext(SocketContext);
    const [chanMessages, setChanMessages] = useState<IChannelMessage[] | null>(null);
    const [chans, setChans] = useState<IChannel[] | null>(null);


    // useEffect(() => {
    //     console.log("hello32");
    //     if (props.chan_id)
    //     {
    //         socket.emit('channels_messages', {
    //             id: props.chan_id,
    //             before: new Date().toISOString(),
    //         },
    //             (data: any) => {
    //                 setChanMessages(data);
    //             }
    //         );
    //     }
	// }, [props.messages]);

	return (
		<div className='chat-messages-wrapper'>
        {props.messages && props.messages.filter(message => {
                  if (props.chan_id ===  message.channelId)
                    return true;
                  return false
                })
                .reverse().map((message, index) => (
                    <div key={index} className="display-message">
                        <div className='message-name-date'><p className='message-name'>{message?.sender.username}</p><p className='message-date'>{message?.sentAt.toString()}</p></div>
                        <p className='message'>{message?.message}</p>
                    </div>
                ))
              }
		{/* {chanMessages && chanMessages.map((message, index) => (
			<div key={index} className="display-message">
				<div className='message-name-date'><p className='message-name'>{message?.sender.username}</p><p className='message-date'>{message?.sentAt.toString()}</p></div>
				<p className='message'>{message?.message}</p>
			</div>
		))} */}
	</div>
	);
};

export default ChatMessages;
