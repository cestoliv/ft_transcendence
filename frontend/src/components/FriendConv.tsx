import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import { message } from 'antd';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

import { SocketContext } from '../context/socket';

import { IUser, IUserMessage } from '../interfaces';

import FriendConvMessages from './FriendConvMessages';

type FriendConvProps = {
	user_me: IUser;
	activeConvId: number;
	allPrivateConvMessages: IUserMessage[];
};

export default function FriendConv(props: FriendConvProps) {
	const socket = useContext(SocketContext);

	const [passWord, setPassWord] = useState<string>('');
	const [messageValue, setMessage] = useState<string>('');
	const [talkTo, setTalkto] = useState<IUser>();

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'password-input') setPassWord(event.target.value);
		if (event.target.name === 'message-input') setMessage(event.target.value);
	};

	const submitMessage = async (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLImageElement>) => {
		event.preventDefault();
		if (messageValue != '') {
			socket.emit(
				'users_sendMessage',
				{
					id: props.activeConvId,
					message: messageValue,
				},
				(data: any) => {
					if (data.messages) {
						message.error(data.messages);
					} else {
						props.allPrivateConvMessages.unshift(data);
						setMessage('');
					}
				},
			);
		}
	};
	useEffect(() => {
		console.log('FriendConv useEffect');
		socket.emit(
			'users_get',
			{
				id: props.activeConvId,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else setTalkto(data as IUser);
			},
		);
	}, [props.activeConvId]);

	return (
		<div className="chat-wrapper discord-black-three">
			<div className="chat-nav" id="chat-nav">
				<img src={talkTo?.profile_picture} alt={talkTo?.username} />
				<span className="pixel-font">{talkTo?.username}</span>
			</div>
			<FriendConvMessages
				user_me={props.user_me}
				allPrivateConvMessages={props.allPrivateConvMessages}
				chan_id={props.activeConvId}
			/>
			<form className="write-message" onSubmit={submitMessage}>
				<input
					value={messageValue}
					name="message-input"
					id="message-input"
					type="message"
					placeholder="Enter your message..."
					onChange={handleChange}
					required
				/>
				<img
					src="https://cdn-icons-png.flaticon.com/512/408/408161.png"
					className="send-button"
					alt="Send"
					onClick={submitMessage}
				/>
			</form>
		</div>
	);
}
