import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelMessage, IUserMessage } from '../interfaces';

type FriendConvMessagesProps = {
	user_me: IUser;
	chan_id: number;
	allPrivateConvMessages: IUserMessage[];
};

export const FriendConvMessages = (props: FriendConvMessagesProps) => {
	function formatDate(date: Date): string {
		const now: Date = new Date();
		const diffInMs: number = now.getTime() - date.getTime();
		const diffInSec: number = Math.floor(diffInMs / 1000);
		const diffInMin: number = Math.floor(diffInSec / 60);

		if (diffInSec < 60) {
			return 'just now';
		} else if (diffInMin < 60) {
			return `${diffInMin} minutes ago`;
		} else if (date.toDateString() === now.toDateString()) {
			return `today at ${date.toLocaleTimeString()}`;
		} else if (date.getFullYear() === now.getFullYear()) {
			return date.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
			});
		} else {
			return date.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		}
	}

	return (
		<div className="chat-messages-wrapper">
			{props.allPrivateConvMessages &&
				props.allPrivateConvMessages
					.filter((message) => {
						if (
							(props.chan_id === message.receiverId && message.senderId === props.user_me.id) ||
							(props.chan_id === message.senderId && message.receiverId === props.user_me.id)
						)
							return true;
						return false;
					})
					.map((message, index) => (
						<div key={index} className="display-message">
							<div className="message-name-date">
								<p className="message-name pixel-font">{message?.sender.username}</p>
								<p className="message-date pixel-font">{formatDate(new Date(message.sentAt))}</p>
							</div>
							<p className="message pixel-font">{message?.message}</p>
						</div>
					))}
		</div>
	);
};

export default FriendConvMessages;
