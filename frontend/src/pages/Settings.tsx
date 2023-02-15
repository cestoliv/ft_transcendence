import React, { ChangeEvent } from 'react';
import { useState } from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

import { IUser } from '../interface';

import Checkbox from '@mui/material/Checkbox';

export const Settings = () => {
	// export default function Settings({ Settings }: SettingsProps) {

	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [isChecked, setisChecked] = useState<boolean>(true);
	const [user, setUser] = useState<IUser[]>([]);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'name') setFirstName(event.target.value);
		if (event.target.name === 'lastname') setLastName(event.target.value);
	};

	const handleChangeCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
		setisChecked(event.target.checked);
	};

	const changeSettings = (event: any): void => {
		event?.preventDefault();
		const newSettings = {
			first: firstName,
			last: lastName,
			status: 'connected',
			googleAuth: isChecked,
		};
		setUser([newSettings]);
		//console.log(user);
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
							value={firstName}
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
						<input
							type="checkbox"
							id="scales"
							name="scales"
							onChange={handleChangeCheckbox}
						/>
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
