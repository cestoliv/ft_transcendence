import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

type ChansOtherProps = {
	chan: IChannel | null;
	user_me: IUser;
	chanList: IChannel[];
	chanListJoin: (chan_code: string | undefined) => void;
	chanListJoinPassWord: (chan_code: string | undefined, psswrd: string) => Promise<any>;
};

export const ChansOther = (props: ChansOtherProps) => {
	const socket = useContext(SocketContext);

	const [passwordValue, setPasswordValue] = useState<string>('');
	const [chanJoined, setChanJoined] = useState<IChannel[]>([]);

	const [openPassWordModal, setOpenPassWordModal] = React.useState(false);
	const openPassWordProtectedModal = () => setOpenPassWordModal(true);
	const closePassWordProtectedModal = () => setOpenPassWordModal(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'chan-password-input') setPasswordValue(event.target.value);
	};

	const handleJoinClick = () => {
		if (props.chan?.visibility != 'password-protected') {
			props.chanListJoin(props.chan?.code);
		} else if (props.chan?.visibility === 'password-protected') openPassWordProtectedModal();
	};

	const handleJoinPassWordSubmit = async (event: any) => {
		event.preventDefault();
		try {
			const data = await props.chanListJoinPassWord(props.chan?.code, passwordValue);
			if (data) {
				closePassWordProtectedModal();
				setPasswordValue('');
			}
		} catch (error) {
			console.error('Join channel error:');
		}
	};

	const display = (): boolean => {
		let i = 0;
		if (props.chan) {
			let x = 0;
			while (x < props.chan.invited.length) {
				if (props.chan.invited[x].userId === props.user_me.id) i += 1;
				x++;
			}
			x = 0;
			while (x < props.chan.banned.length) {
				const now = Date.now();
				const isoDate = new Date(props.chan.banned[x].until);
				if (props.chan.banned[x].userId === props.user_me.id && isoDate.getTime() > now) i += 1;
				x++;
			}
			x = 0;
			while (x < chanJoined.length) {
				if (props.chan.id === chanJoined[x].id) i += 1;
				x++;
			}
		}
		if (props.chan?.name === '') return false;
		if (i > 0) return false;
		else return true;
	};

	useEffect(() => {
		socket.emit('channels_listJoined', {}, (data: any) => {
			setChanJoined(data as IChannel[]);
		});
	}, [props.chanList]);

	return (
		<div className="ChansOther-item-wrapper">
			<Modal
				open={openPassWordModal}
				onClose={closePassWordProtectedModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box className="password-chan-modal modal background-modal">
					<form className="chan-password-form" onSubmit={handleJoinPassWordSubmit}>
						<input
							value={passwordValue}
							name="chan-password-input"
							type="message"
							placeholder="password"
							onChange={handleChange}
							required
							className="nes-input is-dark"
						/>
					</form>
				</Box>
			</Modal>
			{display() && (
				<div className="chan-list-item pixel-font">
					<span className="pixel-font">{props.chan?.name}</span>
					<span className="e-icons e-medium e-plus modal-e-plus" onClick={handleJoinClick}></span>
				</div>
			)}
		</div>
	);
};

export default ChansOther;
