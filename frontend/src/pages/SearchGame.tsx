import React, { ChangeEvent, useEffect, useContext } from 'react';
import { Button } from 'antd';
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

import { SocketContext } from '../context/socket';
import { SearchSettings } from '../components/SearchGame/SearchSettings';

const style = {
	position: 'absolute' as const,
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	//bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
};

type FriendsProps = {
	user_me: IUser;
};

export const SearchGame = (props: FriendsProps) => {
	const socket = useContext(SocketContext);

	// for friendlist component
	const [chanList, setChanList] = useState<IChannel[]>([]);
	const[friendOf, setFriendOf] = useState<IUserFriend[]>([]);
	const[friends, setFriends] = useState<IUser[]>([]);

	// Search Filter
	const [mode, setMode] = useState('classic');
	const [time, setTime] = useState('1');
	const [points, setPoints] = useState('5');

	const [redirect, setRedirect] = useState<boolean>(false);

	const [user, setUser] = useState<IUser>();

	const [open, setOpen] = React.useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

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

	const createGame = () => {
		console.log('test');
		socket.emit(
			'games_create',
			{
				maxDuration: time,
				maxScore: points,
				mode: mode,
				visibility: 'public',
			},
			(data: any) => {
				console.log(data);
			},
		);
	};

	const AddFriend = (username : string) => {
		socket.emit(
			'users_inviteFriend',
			{
				username : username,
			},
			(data: any) => {
				if (data.messages)
					alert(data.messages);
			},
		);
    };

	const accept_friend_request = (inviter_id: number): void => {
        socket.emit(
            'users_acceptFriend',
            {
                id: inviter_id,
            },
            (data: any) => {
                if (data.messages)
						alert(data.messages);
                else
					setFriends((prevFriends) => [...prevFriends, data.inviter]);
            },
        );
		const indexToUpdate = friendOf.findIndex(friend => (friend.inviterId === inviter_id && friend.inviteeId === user?.id) || (friend.inviterId === user?.id && friend.inviteeId === inviter_id));
		if (indexToUpdate !== -1) {
			// Créer un nouvel objet ami avec les mêmes propriétés que l'objet original, mais avec la propriété `accepted` mise à jour
			const updatedFriend = { ...friendOf[indexToUpdate], accepted: true };
		  
			// Créer une nouvelle liste d'amis en copiant tous les éléments de la liste d'origine
			// mais en remplaçant l'élément à l'index `indexToUpdate` par le nouvel objet ami mis à jour
			const updatedFriendOf = [...friendOf];
			updatedFriendOf[indexToUpdate] = updatedFriend;
		  
			// Mettre à jour la liste d'amis en attente d'être acceptés avec la nouvelle liste mise à jour
			setFriendOf(updatedFriendOf);
		  }
    }

	const removeFriend = (user_id : number): void => {
		socket.emit(
			'users_removeFriend',
			{
				id: user_id,
			},
			(data: any) => {
				if (data.messages)
					alert(data.messages);
				else
					setFriends(prevList => prevList.filter(user => user.id !== user_id));
			},
		);
	}

	useEffect(() => {
		socket.emit(
			'users_get',
			{
				id: props.user_me.id,
			},
			(data: any) => {
				setUser(data);
			},
		);
	});

	useEffect(() => {
		console.log("ChansList UseEffect");
		socket.emit('channels_listJoined', {}, (data: any) => {
			setChanList(data);
		});
	}, []);

	useEffect(() => {
		console.log("FriendsList useEffect");
		socket.emit(
            'users_get',
            {
                id: props.user_me.id,
            },
            (data: any) => {
                if (data.messages)
						alert(data.messages);
                else
				{
					setFriendOf(data.friendOf);
					setFriends(data.friends);
				}
            },
        );
	}, []);

	return (
		<div className="searchGame-wrapper">
			{user && <FriendsList user_me={user} chanList={chanList} friends={friends} friendOf={friendOf} activeConv={activeConv} AddFriend={AddFriend} accept_friend_request={accept_friend_request} removeFriend={removeFriend} />}
			<div className="searchRandomPlayer">
				<button className="searchButton" onClick={createGame}>
					Search a game
				</button>
				<Modal
					open={open}
					onClose={handleClose}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box sx={style}>
						<button className="redirect-button" onClick={handleRedirect}>
							redirect
						</button>
					</Box>
				</Modal>
			</div>
			<SearchSettings setMode={setMode} setTime={setTime} setPoints={setPoints} />
			{/* <div className="searchGame-settings">
				<div className="formControl formControl-mode-wrapper">
					<Box sx={{ minWidth: 120 }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">Mode</InputLabel>
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
							<InputLabel id="demo-simple-select-label">Time</InputLabel>
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
							<InputLabel id="demo-simple-select-label">Points</InputLabel>
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
			</div> */}
		</div>
	);
};

export default SearchGame;
