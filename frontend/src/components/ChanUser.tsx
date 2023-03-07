import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

type ChanUserProps = {
	user_me_id: number;
	username: string;
	member_id: number;
	chan_id: number;
	chan_admins: IUser[];
	chan_owner: IUser;
	banUser: (banTime: string, chan_id: number, member_id: number) => void;
	muteUser: (
		banTime: string,
		chan_id: number,
		member_id: number,
	) => Promise<any>;
};

export const ChanUser = (props: ChanUserProps) => {
	const socket = useContext(SocketContext);

	const [banTimeValue, setBanTimeValue] = useState<string>('');
	const [muteTimeValue, setMuteTimeValue] = useState<string>('');

	const [openChanUserModal, setOpenChanUserModal] = React.useState(false);
	const OpenChanUserModal = () => setOpenChanUserModal(true);
	const CloseChanUserModal = () => setOpenChanUserModal(false);

	const [openBanTimeModal, setOpenBanTimeModal] = React.useState(false);
	const OpenBanTimeModal = () => setOpenBanTimeModal(true);
	const closeBanTimeModal = () => setOpenBanTimeModal(false);

	const [openMuteTimeModal, setOpenMuteTimeModal] = React.useState(false);
	const OpenMuteTimeModal = () => setOpenMuteTimeModal(true);
	const closeMuteTimeModal = () => setOpenMuteTimeModal(false);

	const handleChangeBantime = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'ban-time-input')
			setBanTimeValue(event.target.value);
	};

	const handleChangeMutetime = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'mute-time-input')
			setMuteTimeValue(event.target.value);
	};

	const amIAdmin = (): boolean => {
		if (props.chan_admins) {
			let x = 0;
			while (x < props.chan_admins.length) {
				if (props.chan_admins[x].id === props.user_me_id) return true;
				x++;
			}
		}
		if (props.chan_owner.id === props.user_me_id) return true;
		return false;
	};

	// add amin or remove admin
	const setAdmin = (event: any): void => {
		// add amin
		if (event.target.name === 'button-add-admin') {
			socket.emit(
				'channels_addAdmin',
				{
					id: props.chan_id,
					user_id: props.member_id,
				},
				(data: any) => {
					if (data.messages) alert(data.messages);
					else {
						socket.emit(
							'users_get',
							{ id: props.member_id },
							(data: any) => {
								props.chan_admins.push(data);
							},
						);
						CloseChanUserModal();
					}
				},
			);
		}

		// remove admin
		if (event.target.name === 'button-remove-admin') {
			socket.emit(
				'channels_removeAdmin',
				{
					id: props.chan_id,
					user_id: props.member_id,
				},
				(data: any) => {
					if (data.messages) alert(data.messages);
					else {
						const index = props.chan_admins.findIndex(
							(admin) => admin.id === props.member_id,
						);
						if (index !== -1) {
							props.chan_admins.splice(index, 1);
						}
						CloseChanUserModal();
					}
				},
			);
		}
	};

	const banUser = async (event: any) => {
		event.preventDefault();
		props.banUser(banTimeValue, props.chan_id, props.member_id);
		CloseChanUserModal();
		closeBanTimeModal();
	};

	const muteUser = async (event: any) => {
		event.preventDefault();
		try {
			const data = await props.muteUser(
				muteTimeValue,
				props.chan_id,
				props.member_id,
			);
			if (data) {
				closeMuteTimeModal();
				CloseChanUserModal();
			}
		} catch (error) {
			console.error('muteUser error:');
		}
	};

	const isAdmin = (): boolean => {
		if (props.chan_admins) {
			let x = 0;
			while (x < props.chan_admins.length) {
				if (props.chan_admins[x].id === props.member_id) return true;
				x++;
			}
			return false;
		}
		return false;
	};

	return (
		<div className="ChanUser-wrapper list-item discord-background-three">
			{/* {amIAdmin() && (
                <h3 onClick={OpenChanUserModal}>{props.username}</h3>
            )}
            {!amIAdmin() && (
                <h3>{props.username}</h3>
            )} */}
			<div
				className="user-info"
				onClick={amIAdmin() ? OpenChanUserModal : null}
			>
				<h3>{props.username}</h3>
			</div>
			<Modal
				open={openChanUserModal}
				onClose={CloseChanUserModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="chan-user-modal modal background-modal">
					{!isAdmin() && (
						<button
							name="button-add-admin"
							className="nes-btn is-primary"
							onClick={setAdmin}
						>
							Set Admin
						</button>
					)}
					{isAdmin() && (
						<button
							name="button-remove-admin"
							className="nes-btn is-primary"
							onClick={setAdmin}
						>
							Remove Admin
						</button>
					)}
					<button
						name="button-ban_user"
						className="nes-btn is-primary"
						onClick={OpenBanTimeModal}
					>
						Ban
					</button>
					<button className="nes-btn is-primary">Kick</button>
					<button
						name="button-mute_user"
						className="nes-btn is-primary"
						onClick={OpenMuteTimeModal}
					>
						Mute
					</button>
				</Box>
			</Modal>
			<Modal
				open={openBanTimeModal}
				onClose={closeBanTimeModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="ban-time-modal background-modal">
					<form className="ban-time-form" onSubmit={banUser}>
						<input
							value={banTimeValue}
							name="ban-time-input"
							type="message"
							placeholder="Ban time in mintues"
							onChange={handleChangeBantime}
							required
							className="ban-time-input"
						/>
					</form>
				</Box>
			</Modal>

			<Modal
				open={openMuteTimeModal}
				onClose={closeMuteTimeModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="mute-time-modal background-modal">
					<form className="mute-time-form" onSubmit={muteUser}>
						<input
							value={muteTimeValue}
							name="mute-time-input"
							type="message"
							placeholder="Mute time in minutes"
							onChange={handleChangeMutetime}
							required
							className="mute-time-input"
						/>
					</form>
				</Box>
			</Modal>
		</div>
	);
};

export default ChanUser;
