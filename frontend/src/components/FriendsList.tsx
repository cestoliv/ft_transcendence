import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';
import Friend from './Friend';
import FriendRequests from './FriendRequests';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IUserFriend } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

type PersonListProps = {
	user_me : IUser,
	chanList : IChannel[],
	friends : IUser[],
	friendOf : IUserFriend[],
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	AddFriend: (username : string) => void;
	accept_friend_request : (inviter_id : number) => void;
	removeFriend : (user_id : number) => void;
};

export const FriendsList = (props: PersonListProps) => {
	const socket = useContext(SocketContext);

	const [addFriendValue, setAddFriendValue] = useState<string>('');

	// const[friendOf, setFriendOf] = useState<IUserFriend[]>([]);
	// const[friends, setFriends] = useState<IUser[]>([]);

	const [OpenLFriendRequest, setOpenListFriendRequest] = React.useState(false);
	const OpenListFriendRequest = () => setOpenListFriendRequest(true);
	const CloseListFriendRequest = () => setOpenListFriendRequest(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'add-friend-input') setAddFriendValue(event.target.value);
	};

	const handleAddFriendSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
		props.AddFriend(addFriendValue);
		setAddFriendValue('');
    };

	const closeFriendList = (event: any): void => {
		var sidenav = document.getElementById("priv-conv-list");
		sidenav?.classList.remove("active-friend-list");

		var button1 = document.getElementById("open-chan-joined-button");
		var button2 = document.getElementById("open-friend-list-button");

		button1?.classList.remove("hidden-button");
		button2?.classList.remove("hidden-button");
	};

	useEffect(() => {
		console.log("FriendsList useEffect");
	},[props.friends]);

	return (
		<div className="priv-conv-list" id='priv-conv-list'>
			<span className='close-friend-list' id='close-friend-list' onClick={closeFriendList}>close</span>
			<div className="friendsList-wrapper">
				{props.friends && props.friends.map((user) => (
					<Friend key={user.id} user={user} chanList={props.chanList} activeConv={props.activeConv} removeFriend={props.removeFriend} />
				))}
			</div>
			<div className="add-accept-friend">
				<button className="en-attente-button" onClick={OpenListFriendRequest}>En attente</button>
				<Modal open={OpenLFriendRequest} onClose={CloseListFriendRequest} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
					<Box className="friend-request-modal background-modal">
						{props.friendOf?.filter(friend => {
							if (friend.accepted === false)
								return true;
							return false
							})
							.map(friend_request => (
								<FriendRequests key={friend_request.inviterId} friend_request={friend_request} accept_friend_request={props.accept_friend_request}/>
							))
						}
					</Box>
				</Modal>
				<form className="add-friend-form" onSubmit={handleAddFriendSubmit}>
						<input value={addFriendValue} name='add-friend-input' id='message-input' type='message' placeholder='Add a friend' onChange={handleChange} required className="add-friend-form-input"/>
				</form>
			</div>
		</div>
	);
};

export default FriendsList;
