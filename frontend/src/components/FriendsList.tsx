import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';
import Friend from './Friend';
import FriendRequests from './FriendRequests';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IUserFriend } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

type PersonListProps = {
	user_me: IUser;
	chanList: IChannel[];
	friends: IUser[];
	friendOf: IUserFriend[];
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	AddFriend: (username: string) => void;
	accept_friend_request: (inviter_id: number) => void;
	refuse_friend_request: (inviter_id: number) => void;
	banFriend: (banTime: string, friend_id: number) => void;
	removeFriend: (user_id: number) => void;
	gameInfo: any;
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
		const sidenav = document.getElementById('priv-conv-list');
		sidenav?.classList.remove('active-friend-list');

		const button1 = document.getElementById('open-chan-joined-button');
		const button2 = document.getElementById('open-friend-list-button');
		const button3 = document.getElementById('open-infos-conv-button');

		button1?.classList.remove('hidden-button');
		button2?.classList.remove('hidden-button');
		button3?.classList.remove('hidden-button');
	};

	// useEffect(() => {
	// 	console.log("hello56");
	// 	console.log(props.friends);
	// }, [props.friends]);

	return (
		<div className="priv-conv-list" id="priv-conv-list">
			<span className="close-friend-list" id="close-friend-list" onClick={closeFriendList}>
				close
			</span>
			<div className="friendsList-wrapper">
				{props.friends &&
					props.friends.map((user) => (
						<Friend
							key={user.id}
							user={user}
							chanList={props.chanList}
							activeConv={props.activeConv}
							removeFriend={props.removeFriend}
							banFriend={props.banFriend}
							gameInfo={props.gameInfo}
						/>
					))}
			</div>
			<div className="add-accept-friend">
				<button className="en-attente-button nes-btn is-primary" onClick={OpenListFriendRequest}>
					En attente
				</button>
				<Modal
					open={OpenLFriendRequest}
					onClose={CloseListFriendRequest}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box className="friend-request-modal modal background-modal">
						{props.friendOf
							?.filter((friend) => {
								if (friend.accepted === false) return true;
								return false;
							})
							.map((friend_request) => (
								<FriendRequests
									key={friend_request.inviterId}
									friend_request={friend_request}
									accept_friend_request={props.accept_friend_request}
									refuse_friend_request={props.refuse_friend_request}
								/>
							))}
					</Box>
				</Modal>
				<form className="add-friend-form" onSubmit={handleAddFriendSubmit}>
					<input
						value={addFriendValue}
						name="add-friend-input"
						id="message-input"
						type="message"
						placeholder="Add a friend"
						onChange={handleChange}
						required
						className="nes-input is-dark"
					/>
				</form>
			</div>
		</div>
	);
};

export default FriendsList;
