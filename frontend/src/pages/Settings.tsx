import React, { ChangeEvent, useEffect, useContext } from 'react';
import { useState } from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

import { IChannel, IUser, IUserFriend } from '../interfaces';

import { SocketContext } from '../context/socket';

import Checkbox from '@mui/material/Checkbox';

type SettingsProps = {
	user_me : IUser,
};

export const Settings = (props: SettingsProps) => {

	const socket = useContext(SocketContext);

	const [username, setUsername] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [isChecked, setisChecked] = useState<boolean>(true);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'name') setUsername(event.target.value);
		if (event.target.name === 'lastname') setLastName(event.target.value);
	};

	const handleChangeCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
		setisChecked(event.target.checked);
	};

	const changeSettings = (event: any): void => {
		console.log("buzz");
		console.log(username);
		event?.preventDefault();
		socket.emit(
			'users_update',
			{
				id: props.user_me.id,
				username: username,
			},
			(data: any) => {
				if (data.messages)
					alert(data.messages);
			},
		);
	};

	return (
		<div className="settings-wrapper">
			<div className="settings">
				<form className="change-settings-form">
					<div className="form-name">
						<label>Name : </label>
						<input
							type="text"
							name="name"
							placeholder="changeName"
							value={username}
							className="add-friend-form-label"
							onChange={handleChange}
						/>
					</div>

					<div className="form-lastname">
						<label>Lastname : </label>
						<input
							type="text"
							name="lastname"
							placeholder="changeName"
							value={lastName}
							className="add-friend-form-label"
							onChange={handleChange}
						/>
					</div>

					<div className="googl-auth-div">
						<label>Google auth : </label>
						<input type="checkbox" id="scales" name="scales" onChange={handleChangeCheckbox} />
					</div>

					<input
						type="submit"
						value="Add"
						className="change-settings-form-submit-button"
						onClick={changeSettings}
					/>
				</form>
			</div>
		</div>
	);
};

export default Settings;
