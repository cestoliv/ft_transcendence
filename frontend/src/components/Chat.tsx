import React, { ChangeEvent, useEffect, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Checkbox from './Checkbox';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelMessage } from '../interfaces';
import Modal from '@mui/material/Modal';
import ChatMessages from './ChatMessages';

type ChatProps = {
	user_me: IUser;
	activeChan: IChannel;
	messages: IChannelMessage[];
	addPassword: (passWord: string, chan_id: number) => void;
	togglePrivateChan: (activeChan: IChannel) => void;
};

export default function Chat(props: ChatProps) {
	const socket = useContext(SocketContext);

	const [passWord, setPassWord] = useState<string>('');
	const [message, setMessage] = useState<string>('');

	const [OpenSettingsChanModal, setOpenSettingsChanModal] = useState(false);
	const handleOpenSettingsChanModal = () => setOpenSettingsChanModal(true);
	const handleCloseSettingsChanModal = () => setOpenSettingsChanModal(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'password-input')
			setPassWord(event.target.value);
		if (event.target.name === 'message-input')
			setMessage(event.target.value);
	};

	const submitMessage = async (
		event:
			| React.FormEvent<HTMLFormElement>
			| React.MouseEvent<HTMLImageElement>,
	) => {
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
					else {
						setMessage('');
						props.messages.unshift(data as IChannelMessage);
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

	const toggleHidden = () => {
		setOpenSettingsChanModal(true);
		const active_elem =
			document.getElementsByClassName('wrapper-settings')[0];
		if (active_elem) active_elem.classList.toggle('hidden');
	};

	const isOwner = (): boolean => {
		if (props.user_me.id === props.activeChan?.owner.id) return true;
		return false;
	};

	return (
		<div className="chat-wrapper">
			<div className="chat-nav chat-nav-chan" id="chat-nav">
				{props.activeChan ? (
					<p className="chan-name">
						{props.activeChan.name}{' '}
						<span className="chan-code">
							#{props.activeChan.code}
						</span>
					</p>
				) : (
					<p>Unknown channel</p>
				)}
				{isOwner() && (
					<div className="chat-nav-right">
						<Modal
							open={OpenSettingsChanModal}
							onClose={handleCloseSettingsChanModal}
							aria-labelledby="modal-modal-title"
							aria-describedby="modal-modal-description"
						>
							<div className="settings-modal modal">
								<h2 id="modal-modal-title">Settings</h2>
								<div className="divider"></div>
								<label>
									<input
										type="checkbox"
										className="nes-checkbox is-dark"
										onChange={isChecked}
										checked={
											props.activeChan?.visibility ===
												'public' ||
											props.activeChan?.visibility ===
												'password-protected'
												? false
												: true
										}
									/>
									<span>Private</span>
								</label>
								<form
									className="mpd-form"
									onSubmit={addPassWord}
								>
									<input
										className="nes-input is-dark"
										placeholder="Password"
										name="password-input"
										type="text"
										id="mdp"
										value={passWord}
										onChange={handleChange}
									/>
								</form>
							</div>
						</Modal>
						<img
							onClick={toggleHidden}
							src="https://static.thenounproject.com/png/2758640-200.png"
							className="settings-icon"
						/>
					</div>
				)}
			</div>
			<ChatMessages
				user_me={props.user_me}
				chan_id={props.activeChan.id}
				messages={props.messages}
			/>
			<form className="write-message" onSubmit={submitMessage}>
				<input
					value={message}
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
