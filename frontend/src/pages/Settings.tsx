import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import { message, Badge } from 'antd';
import { QRCodeCanvas } from 'qrcode.react';
import { IChannel, IUser, IUserFriend } from '../interfaces';
import { SocketContext } from '../context/socket';
import Modal from '@mui/material/Modal';
import { useNavigate } from 'react-router-dom';

type SettingsProps = {
	user_me: IUser;
	auth: Record<string, unknown>;
};

export const Settings = (props: SettingsProps) => {
	const navigate = useNavigate();
	const socket = useContext(SocketContext);

	const [isOpenPictureModal, setIsOpenPictureModal] = useState(false);
	const openPictureModalHandler = () => setIsOpenPictureModal(true);
	const closePictureModalHandler = () => setIsOpenPictureModal(false);

	const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);
	const openTotpModal = () => setIsTotpModalOpen(true);
	const closeTotpModal = () => setIsTotpModalOpen(false);

	const [isOpen2FACheckModal, setIsOpen2FACheckModal] = useState(false);
	const open2FACheckModal = (e: ChangeEvent<HTMLInputElement>) => {
		setIsOpen2FACheckModal(true);
		setIsChecked2FA(e.target.checked);
	};
	const close2FACheckModal = () => {
		setIsOpen2FACheckModal(false);
		setIsChecked2FA((prev) => !prev);
	};
	const [totp, setTotp] = useState(null);

	const [isChecked2FA, setIsChecked2FA] = useState(false);

	const [displayname, setDisplayName] = useState<string>('');

	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState<string>('');

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
			setFileName(selectedFile.name);
		}
	};

	const submitProfilPicture = async (event: any) => {
		event.preventDefault();
		const formData = new FormData();
		console.log(file);
		if (file) formData.append('profil_picture', file);
		fetch('http://api.transcendence.local/api/v1/users/profile-picture', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${props.auth.bearer}`,
				'Content-Type': 'application/json',
			},
			body: formData,
		})
			.then(async (response) => {
				if (!response) return;
				return {
					response: response,
					data: await response.json(),
				};
			})
			.then((r) => {
				if (!r) return;
				if (r.response.ok) message.success('Profil Picture uploaded');
				else message.error(r.data.message || r.data.messages[0] || 'Error');
			})
			.catch((error) => {
				message.error(error.message || 'Network Error');
			});
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'name') setDisplayName(event.target.value);
	};

	const handle2FA = async () => {
		if (isChecked2FA) {
			const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/totp/enable`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${props.auth.bearer}`,
				},
			});
			const data = await response.json();
			setTotp(data);
			setIsOpen2FACheckModal(false);
			setIsTotpModalOpen(true);
		} else if (!isChecked2FA) {
			const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/totp/disable`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${props.auth.bearer}`,
				},
			});
			if (response.ok) {
				message.success('2FA disabled');
				setTotp(null);
				setIsOpen2FACheckModal(false);
			} else {
				message.error("You can't disable 2FA on not 42 account.");
			}
		}
	};

	const cancelCheck2FA = () => {
		setIsOpen2FACheckModal(false);
		setIsChecked2FA((prev) => !prev);
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
		}
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
		}
	};

	const changeSettings = (event: any): void => {
		event?.preventDefault();
		socket.emit(
			'users_update',
			{
				id: props.user_me.id,
				displayName: displayname,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					message.success('Username uploaded');
					setDisplayName('');
					navigate(0);
				}
			},
		);
	};

	const fetch2FA = async () => {
		const response = await fetch(`${process.env.REACT_APP_API_URL}/users/2fa`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${props.auth.bearer}`,
			},
		});
		if (response.ok) {
			const data = await response.json();
			data ? setIsChecked2FA(true) : setIsChecked2FA(false);
		}
	};

	useEffect(() => {
		fetch2FA();
	}, []);

	return (
		<div className="settings-wrapper">
			<div className="settings">
				<Badge
					onClick={openPictureModalHandler}
					count={<img className="edit-icon" src="https://static.thenounproject.com/png/2758640-200.png" />}
				>
					<img className="profile-picture" src={props.user_me.profile_picture} />
				</Badge>
				<div className="user-name">
					<p>{props.user_me.displayName}</p>
					<p>@{props.user_me.username}</p>
				</div>
				<Modal open={isOpenPictureModal} onClose={closePictureModalHandler}>
					<div className="modal-picture modal">
						<button className="profilPicture-button" onClick={submit42ProfilPicture}>
							42 Profil Picture
						</button>
						<button className="profilPicture-button" onClick={submitRandomProfilPicture}>
							Random Profil Picture
						</button>
						<form className="form-file-profil-picture" onSubmit={submitProfilPicture}>
							<input
								type="file"
								name="file"
								id="file"
								className="inputfile"
								onChange={handleFileChange}
							/>
							<label htmlFor="file">{fileName || 'Choose a file'}</label>
							<input type="submit" className="form-file-profil-picture-submit-button" />
						</form>
					</div>
				</Modal>
				<div className="divider"></div>
				{/* <h3>Name</h3> */}
				<form className="form-change-name" onSubmit={changeSettings}>
					<input
						type="text"
						name="name"
						placeholder="change display name"
						value={displayname}
						className="nes-input is-dark"
						onChange={handleChange}
					/>
				</form>
				<div className="divider"></div>
				<label>
					<input
						checked={isChecked2FA}
						onChange={open2FACheckModal}
						type="checkbox"
						className="nes-checkbox is-dark"
					/>
					<span>2FA</span>
				</label>
				<Modal open={isOpen2FACheckModal} onClose={close2FACheckModal}>
					<div className="modal-2fa-check modal">
						{isChecked2FA ? (
							<h3>Are you sure to activate 2FA ?</h3>
						) : (
							<h3>Are you sure to deactivate 2FA ?</h3>
						)}
						<div className="button-wrapper">
							<button onClick={close2FACheckModal} className="nes-btn is-error">
								No
							</button>
							<button onClick={handle2FA} className="nes-btn is-success">
								Yes
							</button>
						</div>
					</div>
				</Modal>
				{totp && (
					<Modal open={isTotpModalOpen} onClose={closeTotpModal}>
						<div className="info-2fa modal">
							<p className="title">Scan this QR Code : </p>
							<QRCodeCanvas value={totp.url} />
							<p>Or enter this code in your 2FA App :</p>
							<p className="code">{totp.secret}</p>
						</div>
					</Modal>
				)}
			</div>
		</div>
	);
};

export default Settings;
