import React, { ChangeEvent, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

import { SocketContext } from '../context/socket';
import { message } from 'antd';
import { IChannel, IUser, IChannelMessage } from '../interfaces';
import Modal from '@mui/material/Modal';
import ChatMessages from './ChatMessages';

type ChatProps = {
	user_me: IUser;
	activeChan: IChannel;
	messages: IChannelMessage[];
	addPassword: (passWord: string, chan_id: number) => void;
	setChanVisibility: (
		activeChan: IChannel,
		oldVisibility: string,
		newVisibility: string,
		passWord: string | null,
	) => void;
};

export default function Chat(props: ChatProps) {
	const socket = useContext(SocketContext);

	const [passWord, setPassWord] = useState<string>('');
	const [messageValue, setMessage] = useState<string>('');

	const [OpenSettingsChanModal, setOpenSettingsChanModal] = useState(false);
	const handleCloseSettingsChanModal = () => setOpenSettingsChanModal(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'password-input') setPassWord(event.target.value);
		if (event.target.name === 'message-input') setMessage(event.target.value);
	};

	const submitMessage = async (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLImageElement>) => {
		event.preventDefault();
		if (messageValue != '') {
			socket.emit(
				'channels_sendMessage',
				{
					id: props.activeChan?.id,
					message: messageValue,
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
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
		if (e.target.name === 'public')
			props.setChanVisibility(props.activeChan, props.activeChan.visibility, 'public', null);
		if (e.target.name === 'private')
			props.setChanVisibility(props.activeChan, props.activeChan.visibility, 'private', null);
		if (e.target.name === 'password-protected')
			props.setChanVisibility(props.activeChan, props.activeChan.visibility, 'password-protected', '');
	};

	const toggleHidden = () => {
		setOpenSettingsChanModal(true);
		const active_elem = document.getElementsByClassName('wrapper-settings')[0];
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
						{props.activeChan.name} <span className="chan-code">#{props.activeChan.code}</span>
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
										name="private"
										className="nes-checkbox is-dark"
										onChange={isChecked}
										checked={props.activeChan?.visibility === 'private' ? true : false}
									/>
									<span>Private</span>
								</label>
								<label>
									<input
										type="checkbox"
										name="public"
										className="nes-checkbox is-dark"
										onChange={isChecked}
										checked={props.activeChan?.visibility === 'public' ? true : false}
									/>
									<span>Public</span>
								</label>
								<label>
									<input
										type="checkbox"
										name="password-protected"
										className="nes-checkbox is-dark"
										checked={props.activeChan?.visibility === 'password-protected' ? true : false}
										disabled
									/>
									<span>Password-protected</span>
								</label>
								<form className="mpd-form" onSubmit={addPassWord}>
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
			<ChatMessages user_me={props.user_me} chan_id={props.activeChan.id} messages={props.messages} />
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
