import React, { ChangeEvent, useEffect, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Checkbox from './Checkbox';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelMessage } from '../interfaces';

import ChatMessages from './ChatMessages';

type ChatProps = {
	user_me: IUser;
	activeChan : IChannel;
	messages: IChannelMessage[];
	addPassword: (passWord: string, chan_id : number) => void;
	togglePrivateChan : (activeChan : IChannel) => void;
};

export default function Chat(props: ChatProps) {
	const socket = useContext(SocketContext);

	const [passWord, setPassWord] = useState<string>('');
	const [message, setMessage] = useState<string>('');

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'password-input') setPassWord(event.target.value);
		if (event.target.name === 'message-input') setMessage(event.target.value);
	};

	const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (message != '') {
			socket.emit(
				'channels_sendMessage',
				{
					id: props.activeChan?.id,
					message: message,
				},
				(data: any) => {
					if (data.messages) alert(data.messages);
					else
					{
						setMessage('');
						props.messages.unshift(data);
					}
				},
			);
		}
	};

	const addPassWord = (event: any): void => {
		event?.preventDefault();
		props.addPassword(passWord, props.activeChan.id);
		setPassWord('');
	};

	const isChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
		props.togglePrivateChan(props.activeChan);
	};

	const toggleHidden = (event: any) => {
		const active_elem = document.getElementsByClassName('wrapper-settings')[0];
		if (active_elem) active_elem.classList.toggle('hidden');
	};

	const isOwner = (): boolean => {
		if (props.user_me.id === props.activeChan?.owner.id) return true;
			return false;
	};

	return (
		<div className="chat-wrapper discord-black-three">
			<div className="chat-nav" id="chat-nav">
				<span className='pixel-font'>{props.activeChan ? `${props.activeChan.name} #${props.activeChan.code}` : 'Unknown channel'}</span>
				{isOwner() && (
					<div className="chat-nav-right">
						<div className="wrapper-settings hidden pixel-font">
							<Checkbox
								handleChange={isChecked}
								isChecked={
									props.activeChan?.visibility === 'public' || props.activeChan?.visibility === 'password-protected'
										? false
										: true
								}
								label="Private"
							/>
							<form className="mpd-form" onSubmit={addPassWord}>
								<label htmlFor="mdp" id="mdp-label" className='pixel-font'>
									mdp :
								</label>
								<input
									className='change-password-input pixel-font'
									name='password-input'
									type="text"
									id="mdp"
									value={passWord}
									onChange={handleChange}
								/>
							</form>
						</div>
						<span onClick={toggleHidden} className="e-icons e-large e-settings"></span>
					</div>
				)}
			</div>
			<ChatMessages user_me={props.user_me} chan_id={props.activeChan.id} messages={props.messages} />
			<form className="write-message" onSubmit={submitMessage}>
				<input
					value={message}
					name="message-input"
					id="message-input"
					type="message"
					placeholder="Message"
					onChange={handleChange}
					required
				/>
			</form>
		</div>
	);
}
