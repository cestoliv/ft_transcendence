import React, { ChangeEvent, useEffect, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Checkbox from './Checkbox';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import ChatMessages from './ChatMessages'

type ChatProps = {
	user_me : IUser,
	activeConvId : number,
};

export default function Chat(props: ChatProps) {

	const socket = useContext(SocketContext);

	const [passWord, setPassWord] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	const [chan, setChan] = useState<IChannel | null>(null);

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
				'channels_sendMessage',
				{
					id : chan?.id,
					message : message,
				},
				(data: any) => {
					setMessage('');	
				},
			);
		}
    };

	const addPassWord = (event: any): void => {
		event?.preventDefault();
		socket.emit(
			'channels_update',
			{
				id: chan?.id,
				visibility: 'password-protected',
				password: passWord,
			},
			(data: any) => {
				if (data.message)
						alert(data.errors);
				else
				{
					setChan(data);
					setPassWord("");
				}
			},
		);
	}

	const isChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (chan && chan.visibility === "public" || chan?.visibility === 'password-protected')
		{
			socket.emit(
				'channels_update',
				{
					id: chan.id,
					visibility: 'private',
				},
				(data: any) => {
					if (data.message)
							alert(data.errors);
					else
					{
						setChan(data);
					}
				},
			);
		}
		else {
			socket.emit(
				'channels_update',
				{
					id: chan?.id,
					visibility: 'public',
				},
				(data: any) => {
					if (data.message)
							alert(data.errors);
					else
						setChan(data);
				},
			);
		}
	};

	const toggleHidden = (event: any) => {
		const active_elem =
			document.getElementsByClassName('wrapper-settings')[0];
		if (active_elem) active_elem.classList.toggle('hidden');
	};

	const isOwner = (): boolean => {
        if (props.user_me.id === chan?.owner.id)
			return true;
		return false;
    }

	useEffect(() => {

		// let windowHeight = window.innerHeight;
		// let chatnav = document.getElementById('chat-nav');
		// if (chatnav)
		// 	chatnav.style.height = '50px';
		socket.emit(
			'channels_get',
			{
				id: props.activeConvId,
			},
			(data: any) => {
				if (data.message)
					alert(data.errors);
				else
					setChan(data);
			},
		);
	}, [chan]);

	return (
		<div className="chat-wrapper">
			<div className="chat-nav" id='chat-nav'>
				<span>{chan ? `${chan.name} #${chan.code}` : 'Unknown channel'}</span>
				{isOwner() && (
					<div className="chat-nav-right">
						<div className="wrapper-settings hidden">
							<Checkbox
								handleChange={isChecked}
								isChecked={chan?.visibility === 'public' || chan?.visibility === 'password-protected' ? false : true}
								label="Private"
							/>
							<form className="mpd-form">
								<label htmlFor="mdp" id="mdp-label">
									mdp
								</label>
								<input
									name='password-input'
									type="text"
									id="mdp"
									value={passWord}
									onChange={handleChange}
								/>
								<button type="submit" id="mdp-submit-button" onClick={addPassWord}>
									Change
								</button>
							</form>
						</div>
						<span
							onClick={toggleHidden}
							className="e-icons e-large e-settings"
						></span>
					</div>
				)}
			</div>
			<ChatMessages user_me={props.user_me} chan_id={props.activeConvId}/>
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
