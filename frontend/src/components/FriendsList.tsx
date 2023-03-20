import React, { ChangeEvent, useState, useEffect, useRef, useContext } from 'react';
import 'reactjs-popup/dist/index.css';
import Friend from './Friend';
import FriendRequests from './FriendRequests';

import { IChannel, IUser, IUserFriend } from '../interfaces';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { message } from 'antd';

import { SocketContext } from '../context/socket';

type PersonListProps = {
	user_me: IUser;
	chanList: IChannel[];
	friends: IUser[];
	friendOf: IUserFriend[];
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	AddFriend: (username: string) => void;
	accept_friend_request: (inviter_id: number, display_message: number) => void;
	refuse_friend_request: (inviter_id: number, display_message: number) => void;
	banFriend: (banTime: string, friend_id: number) => void;
	muteFriend: (muteTime: string, friend_id: number) => void;
	removeFriend: (user_id: number) => void;
	gameInfo: any;
};

export const FriendsList = (props: PersonListProps) => {
	const socket = useContext(SocketContext);

	const friendsListRef = useRef<HTMLDivElement>(null);
	const [addFriendValue, setAddFriendValue] = useState<string>('');

	const [OpenLFriendRequest, setOpenListFriendRequest] = React.useState(false);
	const OpenListFriendRequest = () => {
		if (props.friendOf.some((friend) => friend.accepted === false)) setOpenListFriendRequest(true);
		else message.error('No invitation pending');
	};
	const CloseListFriendRequest = () => setOpenListFriendRequest(false);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'add-friend-input') setAddFriendValue(event.target.value);
	};

	const handleAddFriendSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event?.preventDefault();
		props.AddFriend(addFriendValue);
		setAddFriendValue('');
	};

	const closeFriendList = (): void => {
		const sidenav = document.getElementById('priv-conv-list');
		sidenav?.classList.remove('active-friend-list');

		const button1 = document.getElementById('open-chan-joined-button');
		const button2 = document.getElementById('open-friend-list-button');
		const button3 = document.getElementById('open-infos-conv-button');

		button1?.classList.remove('hidden-button');
		button2?.classList.remove('hidden-button');
		button3?.classList.remove('hidden-button');
	};

	socket.off('users_friendshipInvitation'); // Unbind previous event
	socket.on('users_friendshipInvitation', (data: any) => {
		message.info(
			<div className="invite-notification">
				<p>You receive a friend invitation from {data.inviter.username}</p>
				<button className="nes-btn is-success" onClick={() => props.accept_friend_request(data.inviterId, 1)}>
					Accept
				</button>
				<button className="nes-btn is-error" onClick={() => props.refuse_friend_request(data.inviterId, 1)}>
					Refuse
				</button>
			</div>,
			10,
		);
		props.friendOf.push(data);
	});

	useEffect(() => {
		const hasFriendRequestPending = props.friendOf.some((friend) => !friend.accepted);
		if (!hasFriendRequestPending) CloseListFriendRequest();
	}, [props.friendOf]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				friendsListRef.current &&
				friendsListRef.current.classList.contains('active-friends-list') &&
				!friendsListRef.current.contains(event.target as Node)
			) {
				friendsListRef.current.classList.remove('active-friends-list');
			} else if (
				friendsListRef.current &&
				friendsListRef.current.classList.contains('active-friend-list') &&
				!friendsListRef.current.contains(event.target as Node)
			) {
				friendsListRef.current.classList.remove('active-friend-list');
				const button1 = document.getElementById('open-chan-joined-button');
				const button2 = document.getElementById('open-friend-list-button');
				const button3 = document.getElementById('open-infos-conv-button');

				button1?.classList.remove('hidden-button');
				button2?.classList.remove('hidden-button');
				button3?.classList.remove('hidden-button');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [friendsListRef]);

	return (
		<div className="priv-conv-list" id="priv-conv-list" ref={friendsListRef}>
			<span className="close-friend-list" id="close-friend-list" onClick={closeFriendList}>
				close
			</span>
			<div className="friendsList-wrapper">
				{props.friends.length > 0 ? (
					props.friends.map((user) => (
						<Friend
							key={user.id}
							user={user}
							chanList={props.chanList}
							activeConv={props.activeConv}
							removeFriend={props.removeFriend}
							banFriend={props.banFriend}
							muteFriend={props.muteFriend}
							gameInfo={props.gameInfo}
						/>
					))
				) : (
					<div className="no-friends">
						<img src="https://static.thenounproject.com/png/5174-200.png" alt="no-friend" />
						<p>No friends...</p>
					</div>
				)}
			</div>
			<div className="add-accept-friend">
				<button className="en-attente-button nes-btn is-primary" onClick={OpenListFriendRequest}>
					Pending
				</button>
				<Modal
					open={OpenLFriendRequest}
					onClose={CloseListFriendRequest}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box className="friend-request-modal modal background-modal">
						{props.friendOf
							?.filter((friend) => friend.accepted === false)
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
