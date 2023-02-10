import React, { ChangeEvent, useEffect, useContext } from 'react';
import Chat from '../components/Chat';
import InfosConv from '../components/InfosConv';
import FriendsList from '../components/FriendsList';
import ChanList from '../components/ChanList';
import AllChan from '../components/AllChan';
import { useState } from 'react';
import { IConvList } from '../interface';

import { IChannel, IUser } from '../interfaces';

// modal
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import users from '../mock-data/users';
import userChans from '../mock-data/userchans';
import chansList from '../mock-data/chansList';

import { SocketContext } from '../context/socket';

import * as io from 'socket.io-client';

// const socket = io.connect('http://api.transcendence.local');

  type FriendsProps = {
	user_me : IUser,
};

export default function Friends(props: FriendsProps) {
	const socket = useContext(SocketContext);

	const [firstName, setFirstName] = useState<string>('');
	let [convList] = useState<IConvList[]>([]);

	let [activeConvId, setActivConvId] = useState<number | undefined>(1);

	//modal
	const [openCModal, setOpenCModal] = React.useState(false);
	const OpenCreateChanModal = () => setOpenCModal(true);
	const CloseCreateChanModal = () => setOpenCModal(false);

	const [openJChanModal, setOpenJModal] = React.useState(false);
	const OpenJoinChanModal = () => setOpenJModal(true);
	const CloseJoinChanModal = () => setOpenJModal(false);

	const [openLChanModal, setOpenListChanModal] = React.useState(true);
	const OpenListChanModal = () => setOpenListChanModal(true);
	const CloseListChanModal = () => setOpenListChanModal(false);

	// form create chan
	const [chanName, setChanName] = useState<string>('');
	const [chanMdp, setChanMdp] = useState<string>('');

	// form join chan
	const [joinChanName, setJoinChanName] = useState<string>('');
	const [joinChanMdp, setJoinChanMdp] = useState<string>('');

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'name') setFirstName(event.target.value);

		if (event.target.name === 'create-chan-name')
			setChanName(event.target.value);
		if (event.target.name === 'create-chan-mdp')
			setChanMdp(event.target.value);

		if (event.target.name === 'join-chan-name')
			setJoinChanName(event.target.value);
		if (event.target.name === 'join-chan-mdp')
			setJoinChanMdp(event.target.value);
	};

	const createChan = (event: any): void => {
		event?.preventDefault();
		if (event.target.name === 'button-create-chan') {
			try {
				socket.emit(
					'channels_create',
					{
						name: chanName,
						password: chanMdp,
						visibility: chanMdp === '' ? 'public' : 'password-protected',
					},
					(data: any) => {
					},
				);
			} catch (error) {
				alert(error);
			}
			setChanName('');
			setChanMdp('');
			CloseCreateChanModal();
		}
		if (event.target.name === 'button-join-chan') {
			socket.emit(
				'channels_join',
				{
					code: joinChanName,
					motdepasse: joinChanMdp,
				},
				(data: any) => {
					if (data.message)
						alert(data.errors);
				},
			);
			setJoinChanName('');
			setJoinChanMdp('');
			CloseJoinChanModal();
		}
	};

	const addFriend = (event: any): void => {
		event?.preventDefault();
		const newFriend = {
			pseudo: firstName,
			avatar: 'wayne',
			idd: 4,
			states: 'connected',
		};
		users.push(newFriend);
		setFirstName('');
	};

	// const newTask = {taskName: 'buzz', deadline: 3};
	// setTodolist([...friends, newTask]);
	convList = [
		{ name: 'had', id: 1 },
		{ name: 'don', id: 2 },
	];

	const [isActive, setIsActive] = useState(false);

	const activeConv = (event: any) => {
		let newId;
		let x;
		if (event.target.classList != 'wrapper-active-conv') return;
		//let active_elem = document.getElementsByClassName('active-conv-bg')[0];
		let active_elem = document.getElementById('active-conv-bg');
		if (active_elem) active_elem.removeAttribute('id');
		const element = event.target;
		element.setAttribute('id', 'active-conv-bg');
		active_elem = element;
		//console.log("hello " + document.getElementsByClassName('active-conv-bg')[0]);
		const newActivConv = document.getElementById('active-conv-bg');
		if (newActivConv)
			newId = newActivConv.getAttribute('data-id');
		// if (newId)
		// 	console.log("data id : " + newId);
		if (newId)
			x = +newId;
		// if (x)
		// 	console.log("data id to int: " + x);
		if (newId)
			setActivConvId(x);
		// console.log("hello : " + activeConvId);
	};

	useEffect(() => {
		// console.log("buzz");
		socket.emit('channels_list', {}, (data: any) => {
			console.log("hello15 : ");
			console.log(data);
		});
	},);

	return (
		<div className="friends-wrapper">
			<div className="chan-list">
				<ChanList activeConv={activeConv} />
				<div className="chan-list-buttons">
					<button onClick={OpenCreateChanModal}>Create chan</button>
					<button onClick={OpenJoinChanModal}>Join chan</button>
					<button onClick={OpenListChanModal}>List chan</button>
					<Modal
						open={openLChanModal}
						onClose={CloseListChanModal}
						aria-labelledby="modal-modal-title"
						aria-describedby="modal-modal-description"
					>
						<Box className="list-chan-modal">
							<AllChan user_me={props.user_me}/>
						</Box>
					</Modal>
					<Modal
						open={openCModal}
						onClose={CloseCreateChanModal}
						aria-labelledby="modal-modal-title"
						aria-describedby="modal-modal-description"
					>
						<Box className="create-chan-modal">
							<form className="create-channel-form">
								<label>
									<input
										type="text"
										name="create-chan-name"
										placeholder="Name"
										id="create-channel-form-label"
										onChange={handleChange}
									/>
								</label>
								<label>
									<input
										type="text"
										name="create-chan-mdp"
										placeholder="Mot de passe"
										className="mdp-channel-form-label"
										onChange={handleChange}
									/>
								</label>
								<button
									name="button-create-chan"
									type="submit"
									className="redirect-button"
									onClick={createChan}
								>
									Create
								</button>
							</form>
						</Box>
					</Modal>
					<Modal
						open={openJChanModal}
						onClose={CloseJoinChanModal}
						aria-labelledby="modal-modal-title"
						aria-describedby="modal-modal-description"
					>
						<Box className="join-chan-modal">
							<form className="join-channel-form">
								<label>
									<input
										type="text"
										name="join-chan-name"
										placeholder="Code"
										id="join-channel-form-label"
										onChange={handleChange}
									/>
								</label>
								<label>
									<input
										type="text"
										name="join-chan-mdp"
										placeholder="Mot de passe"
										id="join-channel-mdp-input"
										onChange={handleChange}
									/>
								</label>
								<button
									name="button-join-chan"
									type="submit"
									className="redirect-button"
									onClick={createChan}
								>
									Join
								</button>
							</form>
						</Box>
					</Modal>
				</div>
			</div>
			<div className="priv-conv-list">
				<FriendsList activeConv={activeConv} />
				<form className="add-friend-form">
					<label>
						<input
							type="text"
							name="name"
							placeholder="Add Friend"
							value={firstName}
							className="add-friend-form-label"
							onChange={handleChange}
						/>
					</label>
					<button
						type="submit"
						value="Add"
						className="add-friend-form-submit-button"
						onClick={addFriend}
					>
						Add
					</button>
				</form>
			</div>
			<div className="chat">
				<Chat user_me={props.user_me} activeConvId={activeConvId}/>
			</div>
			<div className="infos-conv">
				<InfosConv user_me={props.user_me} activeConvId={activeConvId} />
			</div>
		</div>
	);
};