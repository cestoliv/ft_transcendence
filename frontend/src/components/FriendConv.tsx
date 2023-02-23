import React, { ChangeEvent, useEffect, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Checkbox from './Checkbox';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IUserMessage } from '../interfaces';

import FriendConvMessages from './FriendConvMessages'

type FriendConvProps = {
	user_me : IUser,
	activeConvId : number,
};

export default function FriendConv(props: FriendConvProps) {

	const socket = useContext(SocketContext);

	const [passWord, setPassWord] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	const [talkTo, setTalkto] = useState<IUser>();
	const [chanMessages, setChanMessages] = useState<IUserMessage[]>([]);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'password-input')
			setPassWord(event.target.value);
		if (event.target.name === 'message-input')
			setMessage(event.target.value);
	};

	const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
		if (message != '')
		{
			socket.emit(
				'users_sendMessage',
				{
					id : props.activeConvId,
					message : message,
				},
				(data: any) => {
                    if (data.messages)
						alert(data.messages);
                    else
					{
						setChanMessages((prevMessages) => [data, ...prevMessages]);
						setMessage('');
					}
				},
			);
		}
    };

	useEffect(() => {
		console.log("FriendConv useEffect");
		console.log(props.activeConvId);
		socket.emit(
            'users_get',
            {
                id : props.activeConvId,
            },
            (data: any) => {
                if (data.messages)
                    alert(data.messages);
                else
					setTalkto(data);
            },
        );
		{
            socket.emit('users_getMessages', {
                id: props.activeConvId,
                before: new Date().toISOString(),
            },
                (data: any) => {
                    setChanMessages(data);
                }
            );
        }
	}, [props.activeConvId]);

	return (
		<div className="chat-wrapper">
			<div className="chat-nav" id='chat-nav'>
				<span>{talkTo?.username}</span>
			</div>
			<FriendConvMessages user_me={props.user_me} chan_id={props.activeConvId} chanMessages={chanMessages}/>
			<form className="write-message" onSubmit={submitMessage}>
					<input
						value={message}
						name='message-input'
						id='message-input'
						type='message'
						placeholder='Message'
						onChange={handleChange}
						required
						/>
			</form>
		</div>
	);
}
