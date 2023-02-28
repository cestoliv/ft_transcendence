import React, { ChangeEvent, useEffect, useContext } from 'react';
import { useState } from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

import { IChannel, IUser, IUserFriend } from '../interfaces';

import { SocketContext } from '../context/socket';

import Checkbox from '@mui/material/Checkbox';

type SettingsProps = {
	user_me: IUser;
};

export const Settings = (props: SettingsProps) => {
	const socket = useContext(SocketContext);
	const [user, setUser] = useState<IUser>();
	const [username, setUsername] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [isChecked, setisChecked] = useState<boolean>(true);
	const [rerender,setRerender] = useState(false);


	useEffect(() => {
		socket.emit(
			'users_get',
			{
				id: props.user_me.id,
			},
			(data: any) => {
				data.totp = false;
				setUser(data);
			}
		);
	}, [rerender]);
	if (!user) {
		setTimeout(() => {  setRerender(!rerender); }, 5000);
		return (
			<div className="loading-wapper">
				<div>Loading...</div>
			</div>
		);
	}
	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'name')
			setUsername(event.target.value);
		if (event.target.name === 'lastname')
			setLastName(event.target.value);
	};

	const handleChangeCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
		setisChecked(event.target.checked);
	};

	const changeSettings = (event: any): void => {
		console.log(username);
		event?.preventDefault();
		socket.emit(
			'users_update',
			{
				id: props.user_me.id,
				username: username,
			},
			(data: any) => {
				if (data.messages){
					alert(data.messages);
				}
			}
			);
		setRerender(!rerender);
	};

	return (
		<div className="settings-wrapper">
			<div className="settings">
				<form className="change-settings-form">
					<div className="form-name">
						<label>Username: {user.username}</label>
						<input
							type="text"
							name="name"
							placeholder="New Username"
							value={username}
							className="change-Username"
							onChange={handleChange}
						/>
					</div>

					<div className="form-lastname">
						<label>Displayname: {user.displayName? user.displayName: 'NaN'}</label>
						<input
							type="text"
							name="lastname"
							placeholder="New Displayname"
							value={lastName}
							className="change-Displayname"
							onChange={handleChange}
						/>
					</div>

					<div className="googl-auth-div">
						<label>Google auth : </label>
						<input type="checkbox" name="double_aut" onChange={handleChangeCheckbox} checked={user.twoFA}/>
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
