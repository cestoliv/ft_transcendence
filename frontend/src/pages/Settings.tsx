import React, { ChangeEvent, useEffect, useContext } from 'react';
import { useState } from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import { message } from 'antd';

import { IChannel, IUser, IUserFriend } from '../interfaces';

import { SocketContext } from '../context/socket';

import Checkbox from '@mui/material/Checkbox';

type SettingsProps = {
	user_me: IUser;
	auth : Record<string, unknown>;
};

export const Settings = (props: SettingsProps) => {
	const socket = useContext(SocketContext);

	const [username, setUsername] = useState<string>('');

	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState<string>('');

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
			setFileName(selectedFile.name)
		}
	};

	const submitProfilPicture = async (event: any) => {
        event.preventDefault();
        const formData = new FormData();
		console.log(file);
		if (file)
			formData.append("profil_picture", file);
		fetch('http://api.transcendence.local/api/v1/users/profile-picture', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${props.auth.bearer}`,
			},
			body: formData,
		})
		.then((response) => response.json())
		.then((result) => {
			message.success('Profil Picture uploaded');
		})
		.catch((error) => {
			console.error("Error:", error);
		});
    };

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'name') setUsername(event.target.value);
	};

	const submit42ProfilPicture = async (event: any) => {
		const response = await fetch('http://api.transcendence.local/api/v1/users/profile-picture/fetch42', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${props.auth.bearer}`,
			},
		});
		if (response.ok) {
			message.success('Profil Picture uploaded');
	  };
	  };

	  const submitRandomProfilPicture = async (event: any) => {
		event.preventDefault();
		const response = await fetch('http://api.transcendence.local/api/v1/users/profile-picture/generate', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${props.auth.bearer}`,
			},
		});
		if (response.ok) {
			message.success('Profil Picture uploaded');
	  };
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
				if (data.messages)
					alert(data.messages);
				else
				{
					message.success('Username uploaded');
					setUsername("");
				}
			},
		);
	};

	return (
		<div className="settings-wrapper">
			<div className="settings">
				<h3>Profil Picture</h3>
				<button className='profilPicture-button' onClick={submit42ProfilPicture}>42 Profil Picture</button>
				<button className='profilPicture-button' onClick={submitRandomProfilPicture}>Random Profil Picture</button>
				<form className="form-file-profil-picture" onSubmit={submitProfilPicture}>
						<input type="file" name="file" id="file" className="inputfile" onChange={handleFileChange}/>
						<label htmlFor="file">{fileName || "Choose a file"}</label>
						<input type="submit" className='form-file-profil-picture-submit-button'/>
				</form>
				<h3>Name</h3>
				<form className="form-change-name" onSubmit={changeSettings}>
							<input
								type="text"
								name="name"
								placeholder="changeName"
								value={username}
								className="input-change-name"
								onChange={handleChange}
							/>
				</form>
			</div>
		</div>
	);
};

export default Settings;

