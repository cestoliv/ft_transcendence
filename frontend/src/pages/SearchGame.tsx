import * as React from 'react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';

import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { IChannel, IUser, IUserFriend } from '../interfaces';

import Modal from '@mui/material/Modal';

import FriendsList from '../components/FriendsList';

const style = {
	position: 'absolute' as const,
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
};

type FriendsProps = {
	user_me : IUser,
};

export const SearchGame = (props: FriendsProps) => {

	const [redirect, setRedirect] = useState<boolean>(false);

	const [mode, setMode] = React.useState('');
	const [time, setTime] = React.useState('');
	const [points, setPoints] = React.useState('');

	const [open, setOpen] = React.useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	const handleChangeMode = (event: SelectChangeEvent) => {
		setMode(event.target.value as string);
	};

	const handleChangeTime = (event: SelectChangeEvent) => {
		setTime(event.target.value as string);
	};

	const handleChangePoints = (event: SelectChangeEvent) => {
		setPoints(event.target.value as string);
	};

	const activeConv = (event: any) => {
		let active_elem = document.getElementsByClassName('active-conv-bg')[0];
		if (active_elem) active_elem.classList.toggle('active-conv-bg');
		const element = event.target;
		element.classList.toggle('active-conv-bg');
		active_elem = element;
	};

	const handleRedirect = (event: any): void => {
		setRedirect(true);
	};

	const renderRedirect = () => {
		if (redirect) {
			return <Navigate to="/pong" />;
		}
	};

	return (
		<div className="searchGame-wrapper">
			<div className="searchGame-friendsList">
				<FriendsList activeConv={activeConv} user_me={props.user_me}/>
			</div>
			<div className="searchRandomPlayer">
				<button
					className="searchRandomPlayer-button"
					onClick={handleOpen}
				>
					Search a game
				</button>
				{renderRedirect()}
				<Modal
					open={open}
					onClose={handleClose}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box sx={style}>
						<button
							className="redirect-button"
							onClick={handleRedirect}
						>
							redirect
						</button>
					</Box>
				</Modal>
			</div>
			<div className="searchGame-settings">
				<div className="formControl formControl-mode-wrapper">
					<Box sx={{ minWidth: 120 }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">
								Mode
							</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={mode}
								label="Mode"
								onChange={handleChangeMode}
							>
								<MenuItem value={'Normal'}>Normal</MenuItem>
								<MenuItem value={'hard'}>Hard</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</div>
				<div className="formControl formControl-time-wrapper">
					<Box sx={{ minWidth: 120 }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">
								Time
							</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={time}
								label="Mode"
								onChange={handleChangeTime}
							>
								<MenuItem value={2}>2 min</MenuItem>
								<MenuItem value={5}>5 min</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</div>
				<div className="formControl formControl-points-wrapper">
					<Box sx={{ minWidth: 120 }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">
								Points
							</InputLabel>
							<Select
								labelId="demo-simple-select-label"
								id="demo-simple-select"
								value={points}
								label="Mode"
								onChange={handleChangePoints}
							>
								<MenuItem value={0}>Any</MenuItem>
								<MenuItem value={5}>5</MenuItem>
								<MenuItem value={10}>10</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</div>
			</div>
		</div>
	);
};

export default SearchGame;
