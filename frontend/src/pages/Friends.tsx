import React, { ChangeEvent, useEffect } from 'react';
import Chat from '../components/Chat';
import InfosConv from '../components/InfosConv';
import FriendsList from '../components/FriendsList';
import ChanList from '../components/ChanList';
import { useState } from 'react';
import { IConvList } from '../interface';

// modal
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import users from '../mock-data/users';
import userChans from '../mock-data/userchans';
import chansList from '../mock-data/chansList';

const Friends: React.FC = ({}) => {
	// export default function Friends() {

	const [firstName, setFirstName] = useState<string>('');
	let [convList] = useState<IConvList[]>([]);

	//modal
	const [openCModal, setOpenCModal] = React.useState(false);
	const OpenCreateChanModal = () => setOpenCModal(true);
	const CloseCreateChanModal = () => setOpenCModal(false);

	const [openJChanModal, setOpenJModal] = React.useState(false);
	const OpenJoinChanModal = () => setOpenJModal(true);
	const CloseJoinChanModal = () => setOpenJModal(false);

	const [chanName, setChanName] = useState<string>('');
	const [chanMdp, setChanMdp] = useState<string>('');

	const [joinChanName, setJoinChanName] = useState<string>('');
	const [joinChanMdp, setJoinChanMdp] = useState<string>('');

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'name') setFirstName(event.target.value);

		if (event.target.name === 'create-chan-name') {
			const elements = document.getElementById(
				'create-channel-form-label',
			);
			if (elements && elements.style.border === '1px solid red')
				elements.style.border = '1px solid green';
			else if (
				elements &&
				event.target.value === '' &&
				elements.style.border === '1px solid green'
			)
				elements.style.border = '1px solid red';
			setChanName(event.target.value);
		}
		if (event.target.name === 'create-chan-mdp')
			setChanMdp(event.target.value);

		if (event.target.name === 'join-chan-name') {
			const elements = document.getElementById('join-channel-form-label');
			if (elements && elements.style.border === '1px solid red')
				elements.style.border = '1px solid green';
			else if (
				elements &&
				event.target.value === '' &&
				elements.style.border === '1px solid green'
			)
				elements.style.border = '1px solid red';
			setJoinChanName(event.target.value);
		}
		if (event.target.name === 'join-chan-mdp')
			setJoinChanMdp(event.target.value);
	};

	const createChan = (event: any): void => {
		event?.preventDefault();
		if (event.target.name === 'button-create-chan') {
			let x = 0;
			while (chansList[x]) {
				if (chansList[x].name === chanName) break;
				x++;
			}
			if (chanName === '' || x != chansList.length) {
				const elements = document.getElementById(
					'create-channel-form-label',
				);
				if (elements) elements.style.border = '1px solid red';
				return;
			}
			const newChan = { name: chanName, mdp: chanMdp, id: x };
			userChans.push(newChan);
			setChanName('');
			setChanMdp('');
			CloseCreateChanModal();
		}
		if (event.target.name === 'button-join-chan') {
			let x = 0;
			while (chansList[x]) {
				if (chansList[x].name === joinChanName) break;
				x++;
			}
			if (joinChanName === '' || x === chansList.length) {
				const elements = document.getElementById(
					'join-channel-form-label',
				);
				if (elements) elements.style.border = '1px solid red';
				return;
			}
			if (joinChanMdp != chansList[x].mdp) {
				const elements = document.getElementById(
					'join-channel-mdp-input',
				);
				if (elements) elements.style.border = '1px solid red';
				return;
			}
			const newChan = { name: joinChanName, mdp: joinChanMdp, id: x };
			userChans.push(newChan);
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
		if (event.target.classList != 'wrapper-active-conv') return;
		let active_elem = document.getElementsByClassName('active-conv-bg')[0];
		if (active_elem) active_elem.classList.toggle('active-conv-bg');
		const element = event.target;
		element.classList.toggle('active-conv-bg');
		active_elem = element;
	};

	// const buzz = () => {
	//     console.log(chansList[0]);
	// };

	// buzz();

	//modal

	return (
		<div className="friends-wrapper">
			<div className="chan-list">
				<ChanList activeConv={activeConv} />
				<div className="chan-list-buttons">
					{/* <form className='add-channel-form'>
                        <label>
                            <input type="text" name="name" placeholder='New channel' className='add-channel-form-label'/>
                        </label>
                        <input type="submit" value="Add" className='add-channel-form-submit-button'/>
                    </form>
                    <form className='join-channel-form'>
                        <label>
                            <input type="text" name="name" placeholder='Join channel' className='join-channel-form-label'/>
                        </label>
                        <input type="submit" value="Join" className='join-channel-form-submit-button' />
                    </form> */}
					<button onClick={OpenCreateChanModal}>Create chan</button>
					<button onClick={OpenJoinChanModal}>Join chan</button>
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
								{/* <input type="submit" value="Add" className='add-channel-form-submit-button'/> */}
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
										placeholder="Name"
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
									Create
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
				<Chat />
			</div>
			<div className="infos-conv">
				<InfosConv convList={convList} />
			</div>
		</div>
	);
};

export default Friends;
