import React, { ChangeEvent, useEffect, useContext } from 'react';
import Chat from '../components/Chat';
import FriendConv from '../components/FriendConv';
import InfosConv from '../components/InfosConv';
import FriendsList from '../components/FriendsList';
import ChanList from '../components/ChanList';
import AllChan from '../components/AllChan';
import { useState } from 'react';
import { IConvList } from '../interface';

import {
	IChannel,
	IUser,
	IUserFriend,
	IChannelMessage,
	IUserMessage,
	IChannelInvitedUser,
	IChannelBannedUser,
} from '../interfaces';

// modal
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

type FriendsProps = {
	user_me: IUser;
};

export default function Friends(props: FriendsProps) {
	const socket = useContext(SocketContext);

	const [user, setUser] = useState<IUser>();
	const [chanList, setChanList] = useState<IChannel[]>([]);
	const [chanMessages, setChanMessages] = useState<IChannelMessage[] | null>(
		[],
	);
	const [allChanMessages, setAllChanMessages] = useState<IChannelMessage[]>(
		[],
	);
	const [allPrivateConvMessages, setAllPrivateConvMessages] = useState<
		IUserMessage[]
	>([]);

	// FriendsList
	const [friendOf, setFriendOf] = useState<IUserFriend[]>([]);
	const [friends, setFriends] = useState<IUser[]>([]);

	const [activeConvId, setActivConvId] = useState<number>(-1);
	const [activeChan, setActiveChan] = useState<IChannel | null>(null);
	const [chanConv, setChanConv] = useState<number>(-1);

	//modal
	const [openCModal, setOpenCModal] = React.useState(false);
	const OpenCreateChanModal = () => setOpenCModal(true);
	const CloseCreateChanModal = () => setOpenCModal(false);

	const [openJChanModal, setOpenJModal] = React.useState(false);
	const OpenJoinChanModal = () => setOpenJModal(true);
	const CloseJoinChanModal = () => setOpenJModal(false);

	const [openLChanModal, setOpenListChanModal] = React.useState(false);
	const OpenListChanModal = () => setOpenListChanModal(true);
	const CloseListChanModal = () => setOpenListChanModal(false);

	// form create chan
	const [chanName, setChanName] = useState<string>('');
	const [chanMdp, setChanMdp] = useState<string>('');

	// form join chan
	const [joinChanName, setJoinChanName] = useState<string>('');
	const [joinChanMdp, setJoinChanMdp] = useState<string>('');

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'create-chan-name')
			setChanName(event.target.value);
		if (event.target.name === 'create-chan-mdp')
			setChanMdp(event.target.value);

		if (event.target.name === 'join-chan-name')
			setJoinChanName(event.target.value);
		if (event.target.name === 'join-chan-mdp')
			setJoinChanMdp(event.target.value);
	};

	useEffect(() => {
		socket.emit('users_get', { id: props.user_me.id }, (data: any) => {
			console.log(data);
			setUser(data);
		});
	}, []);

	const createChan = (event: any): void => {
		event?.preventDefault();
		if (event.target.name === 'button-create-chan') {
			socket.emit(
				'channels_create',
				{
					name: chanName,
					password: chanMdp,
					visibility:
						chanMdp === '' ? 'public' : 'password-protected',
				},
				(data: any) => {
					if (data.messages) alert(data.messages);
					else setChanList((prevChanList) => [...prevChanList, data]);
				},
			);
			setChanName('');
			setChanMdp('');
			CloseCreateChanModal();
		}
		if (event.target.name === 'button-join-chan') {
			socket.emit(
				'channels_join',
				{
					code: joinChanName,
					password: joinChanMdp,
				},
				(data: any) => {
					if (data.messages) alert(data.messages);
					else setChanList((prevChanList) => [...prevChanList, data]);
				},
			);
			setJoinChanName('');
			setJoinChanMdp('');
			CloseJoinChanModal();
		}
	};

	const leaveChan = (chan_id: number): void => {
		socket.emit(
			'channels_leave',
			{
				id: chan_id,
			},
			(data: any) => {
				if (data.messages) {
					alert(data.messages);
				} else {
					// Remove the channel with the given chan_id from the chanList array
					setChanList((prevList) =>
						prevList.filter((chan) => chan.id !== chan_id),
					);
					setActivConvId(-1);
					setActiveChan(null);
				}
			},
		);
	};

	const chanListJoin = (chan_code: string | undefined): void => {
		socket.emit(
			'channels_join',
			{
				code: chan_code,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else setChanList((prevChanList) => [...prevChanList, data]);
			},
		);
	};

	const chanListJoinPassWord = (
		chan_code: string | undefined,
		psswrd: string,
	): Promise<any> => {
		return new Promise((resolve, reject) => {
			socket.emit(
				'channels_join',
				{
					code: chan_code,
					password: psswrd,
				},
				(data: any) => {
					if (data.messages) {
						alert(data.messages);
						reject(new Error(data.messages));
					} else {
						setChanList((prevChanList) => [...prevChanList, data]);
						resolve(data);
					}
				},
			);
		});
	};

	const addPassword = (passWord: string, chan_id: number): void => {
		if (passWord === '') {
			socket.emit(
				'channels_update',
				{
					id: chan_id,
					visibility: 'public',
				},
				(data: any) => {
					if (data.message) alert(data.errors);
					else {
						const index = chanList.findIndex(
							(channel) => channel.id === chan_id,
						);

						if (index !== -1) {
							let updatedChanList: IChannel[];
							// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
							updatedChanList = [...chanList];
							updatedChanList[index] = data;
							setChanList(updatedChanList);
							setActiveChan(data);
						}
					}
				},
			);
		} else {
			socket.emit(
				'channels_update',
				{
					id: chan_id,
					visibility: 'password-protected',
					password: passWord,
				},
				(data: any) => {
					if (data.message) alert(data.errors);
					else {
						const index = chanList.findIndex(
							(channel) => channel.id === chan_id,
						);

						if (index !== -1) {
							let updatedChanList: IChannel[];
							// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
							updatedChanList = [...chanList];
							updatedChanList[index] = data;
							setChanList(updatedChanList);
							setActiveChan(data);
						}
					}
				},
			);
		}
	};

	const banUser = (
		banTime: string,
		chan_id: number,
		member_id: number,
	): void => {
		let now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(banTime));
		socket.emit(
			'channels_banUser',
			{
				id: chan_id,
				user_id: member_id,
				until: now,
			},
			(data: any) => {
				if (data.messages) {
					alert(data.messages);
				} else {
					if (activeChan) {
						const newMembers = activeChan.members.filter(
							(member) => member.id !== member_id,
						);
						const newActiveChan = {
							...activeChan,
							members: newMembers,
						};
						setActiveChan(newActiveChan);
					}
				}
			},
		);
	};

	const togglePrivateChan = (activeChan: IChannel): void => {
		if (
			(activeChan && activeChan.visibility === 'public') ||
			activeChan?.visibility === 'password-protected'
		) {
			socket.emit(
				'channels_update',
				{
					id: activeChan.id,
					visibility: 'private',
				},
				(data: any) => {
					if (data.message) alert(data.errors);
					else {
						const index = chanList.findIndex(
							(channel) => channel.id === activeChan.id,
						);

						if (index !== -1) {
							let updatedChanList: IChannel[];
							// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
							updatedChanList = [...chanList];
							updatedChanList[index] = data;
							setChanList(updatedChanList);
							setActiveChan(data);
						}
					}
				},
			);
		} else {
			socket.emit(
				'channels_update',
				{
					id: activeChan.id,
					visibility: 'public',
				},
				(data: any) => {
					if (data.message) alert(data.errors);
					else {
						const index = chanList.findIndex(
							(channel) => channel.id === activeChan.id,
						);

						if (index !== -1) {
							let updatedChanList: IChannel[];
							// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
							updatedChanList = [...chanList];
							updatedChanList[index] = data;
							setChanList(updatedChanList);
							setActiveChan(data);
						}
					}
				},
			);
		}
	};

	const AddFriend = (username: string) => {
		socket.emit(
			'users_inviteFriend',
			{
				username: username,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
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
				if (data.messages) alert(data.messages);
				else {
					setFriends((prevFriends) => [...prevFriends, data.inviter]);
					friendOf.forEach((item) => {
						console.log(item);
						if (
							item.inviteeId == data.inviteeId &&
							item.inviterId == data.inviterId
						)
							console.log('buzz');
					});
					setFriendOf((prevList) =>
						prevList.filter(
							(item) => item.inviteeId !== data.inviteeId,
						),
					);
				}
			},
		);
	};

	const removeFriend = (user_id: number): void => {
		socket.emit(
			'users_removeFriend',
			{
				id: user_id,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else
					setFriends((prevList) =>
						prevList.filter((user) => user.id !== user_id),
					);
			},
		);
	};

	const banFriend = (banTime: string, friend_id: number): void => {
		let now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(banTime));
		socket.emit(
			'users_ban',
			{
				id: friend_id,
				until: now,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else
					setFriends((prevList) =>
						prevList.filter((user) => user.id !== friend_id),
					);
			},
		);
	};

	const activeConv = (event: any) => {
		let newId;
		let element;

		if (
			event.target.classList != 'wrapper-active-conv list-item' &&
			event.target.classList != 'wrapper-active-conv-span'
		)
			return;
		let active_elem = document.getElementById('active-conv-bg');
		if (active_elem) active_elem.removeAttribute('id');
		if (event.target.classList == 'wrapper-active-conv-span')
			element = event.target.parentElement;
		else element = event.target;
		element.setAttribute('id', 'active-conv-bg');
		active_elem = element;
		const newActivConv = document.getElementById('active-conv-bg');
		if (newActivConv) newId = newActivConv.getAttribute('data-id');
		if (newId) {
			socket.emit(
				'channels_get',
				{
					id: parseInt(newId),
				},
				(data: any) => {
					setActiveChan(data);
				},
			);
			setActivConvId(parseInt(newId));
		}
		if (newActivConv?.getAttribute('data-conv-type') == 'chan-conv')
			setChanConv(1);
		else setChanConv(2);
	};

	const OpenConvs = (event: any): void => {
		if (event.target.name === 'open-chan-joined-button') {
			var sidenav = document.getElementById('chan-list');
			sidenav?.classList.add('active-chan-list');
		}
		if (event.target.name === 'open-friend-list-button') {
			var sidenav = document.getElementById('priv-conv-list');
			sidenav?.classList.add('active-friend-list');
		}
		const button1 = document.getElementById('open-chan-joined-button');
		const button2 = document.getElementById('open-friend-list-button');

		button1?.classList.add('hidden-button');
		button2?.classList.add('hidden-button');
	};

	// start socket.on channel

	socket.off('channels_join'); // Unbind previous event
	socket.on('channels_join', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);
		const index = chanList.findIndex((channel) => channel.id === data.id);

		if (index !== -1) {
			let updatedChanList: IChannel[];
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			updatedChanList = [...chanList];
			updatedChanList[index] = data;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_leave'); // Unbind previous event
	socket.on('channels_leave', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);
		const index = chanList.findIndex((channel) => channel.id === data.id);

		if (index !== -1) {
			let updatedChanList: IChannel[];
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			updatedChanList = [...chanList];
			updatedChanList[index] = data;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_addAdmin'); // Unbind previous event
	socket.on('channels_addAdmin', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);
	});

	socket.off('channels_removeAdmin'); // Unbind previous event
	socket.on('channels_removeAdmin', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);
	});

	socket.off('channels_banUser'); // Unbind previous event
	socket.on('channels_banUser', (data: any) => {
		if (activeChan && activeChan.id == data.channelId) {
			const newMembers = activeChan.members.filter(
				(member) => member.id !== data.userId,
			);
			const newActiveChan = { ...activeChan, members: newMembers };
			setActiveChan(newActiveChan);
		}
		const index = chanList.findIndex(
			(channel) => channel.id === data.channelId,
		);

		if (data.userId === user?.id) {
			setChanList((prevList) =>
				prevList.filter((chan) => chan.id !== data.channelId),
			);
		}
		if (index !== -1 && data.userId !== user?.id) {
			let updatedChanList: IChannel[];
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			updatedChanList = [...chanList];
			const newMembers = updatedChanList[index].members.filter(
				(member) => member.id !== data.userId,
			);
			updatedChanList[index].members = newMembers;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_update'); // Unbind previous event
	socket.on('channels_update', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);
		const index = chanList.findIndex((channel) => channel.id === data.id);

		if (index !== -1) {
			let updatedChanList: IChannel[];
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			updatedChanList = [...chanList];
			updatedChanList[index] = data;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_message'); // Unbind previous event
	socket.on('channels_message', (data: any) => {
		setAllChanMessages((prevMessages) => [data, ...prevMessages]);
	});

	// end socket.on channel

	// start socket.on user

	socket.off('users_profilePictureUpdate'); // Unbind previous event
	socket.on('users_profilePictureUpdate', (data: any) => {
		const index = friends.findIndex((friend) => friend.id === data.id);

		if (index !== -1) {
			let updatedFriendList: IUser[];

			updatedFriendList = [...friends];
			updatedFriendList[index].profile_picture = data.profile_picture;
			setFriends(updatedFriendList);
		}
	});

	socket.off('users_friendshipInvitation'); // Unbind previous event
	socket.on('users_friendshipInvitation', (data: any) => {
		setFriendOf((prevList) => [...prevList, data]);
	});

	socket.off('users_friendshipAccepted'); // Unbind previous event
	socket.on('users_friendshipAccepted', (data: any) => {
		setFriends((prevList) => [...prevList, data.invitee]);
	});

	socket.off('users_friendshipRemoved'); // Unbind previous event
	socket.on('users_friendshipRemoved', (data: any) => {
		// console.log("hello 42");
		// console.log(data);
		// let updatedFriendList : IUser[];
		// updatedFriendList = [...friends];
		setFriends((prevList) =>
			prevList.filter(
				(friend) =>
					friend.id !== data.invitee.id ||
					friend.id !== data.inviter.id,
			),
		);
	});

	socket.off('users_banned'); // Unbind previous event
	socket.on('users_banned', (data: any) => {
		console.log('user banned socketon');
		console.log(data);
		setFriends((prevList) =>
			prevList.filter((user) => user.id !== data.userId),
		);
	});

	// end socket.on user

	useEffect(() => {
		setAllChanMessages([]);
		console.log('setAllChanMessages UseEffect');
		// Récupérer la liste des channels joints
		socket.emit('channels_listJoined', {}, (data: any) => {
			const messagesFromAllChannels: any[] = []; // variable temporaire pour stocker les messages
			// Pour chaque channel joint, récupérer les messages du channel et les ajouter à "messagesFromAllChannels"
			data.forEach((channel: any) => {
				socket.emit(
					'channels_messages',
					{ id: channel.id, before: new Date().toISOString() },
					(messages: any) => {
						if (messages.message) {
							alert(messages.errors);
						} else {
							// Ajouter les messages du channel à "messagesFromAllChannels"
							messages.forEach((message: any) => {
								messagesFromAllChannels.push(message);
							});
						}
					},
				);
			});
			// Ajouter tous les messages récupérés à "allChanMessages"
			setAllChanMessages(messagesFromAllChannels);
		});
	}, [chanList]);

	socket.off('users_message'); // Unbind previous event
	socket.on('users_message', (data: any) => {
		console.log('Socket users_message:');
		console.log(data.message);
		setAllPrivateConvMessages((prevMessages) => [
			data.message,
			...prevMessages,
		]);
	});

	useEffect(() => {
		console.log('AllPrivateConvMessages UseEffect');
		// Récupérer la liste des channels joints
		socket.emit('users_get', { id: props.user_me.id }, (data: any) => {
			const messagesFromAllConversations: any[] = []; // variable temporaire pour stocker les messages
			// Pour chaque conversation privée, récupérer les messages et les ajouter à "messagesFromAllConversations"
			data.friends?.forEach((friend: any) => {
				// console.log(channel);
				socket.emit(
					'users_getMessages',
					{ id: friend.id, before: new Date().toISOString() },
					(messages: any) => {
						if (messages.message) {
							alert(messages.errors);
						} else {
							// Ajouter les messages de la conversation à "messagesFromAllConversations"
							if (messages) {
								messages.forEach((message: any) => {
									messagesFromAllConversations.push(message);
								});
							}
						}
					},
				);
			});
			// Ajouter tous les messages récupérés à "allPrivateConvMessages"
			setAllPrivateConvMessages(messagesFromAllConversations);
		});
	}, [friends]);

	useEffect(() => {
		console.log('ChansList UseEffect');
		socket.emit('channels_listJoined', {}, (data: any) => {
			console.log('hello42');
			console.log(data);
			setChanList(data);
		});
	}, []);

	// useEffect(() => {
	// 	console.log('ChansList UseEffect');
	// 	socket.emit('channels_list', {}, (data: IChannel[]) => {
	// 			let chanJoined : IChannel[];
	// 			chanJoined = data.filter(channel =>
	// 			channel.members.some(member => member.id === props.user_me.id)
	// 		);
	// 		// props.chanList.map(chan => (console.log(chan)));
	// 		// Mettez à jour l'état de votre composant avec la liste des canaux privés non rejoint par l'utilisateur donné.
	// 		setChanList(chanJoined);
	// 	});
	// 	// Filtrez tous les canaux privés auxquels l'utilisateur n'a pas encore rejoint.
	// }, []);

	useEffect(() => {
		console.log('FriendsList useEffect');
		socket.emit(
			'users_get',
			{
				id: props.user_me.id,
			},
			(data: any) => {
				if (data.messages) alert(data.messages);
				else {
					setFriendOf(data.friendOf);
					setFriends(data.friends);
				}
			},
		);
	}, []);

	return (
		<div className="friends-wrapper">
			<div className="burger-menu">
				<button
					className="open-chan-joined-button"
					id="open-chan-joined-button"
					name="open-chan-joined-button"
					onClick={OpenConvs}
				>
					Channels
				</button>
				<button
					className="open-friend-list-button"
					id="open-friend-list-button"
					name="open-friend-list-button"
					onClick={OpenConvs}
				>
					Friends
				</button>
			</div>
			<div className="chan-list" id="chan-list">
				<ChanList
					activeConv={activeConv}
					chanList={chanList}
					leaveChan={leaveChan}
				/>
				<div className="chan-list-buttons">
					<button
						className="nes-btn is-primary"
						onClick={OpenCreateChanModal}
					>
						Create chan
					</button>
					<button
						className="nes-btn is-primary"
						onClick={OpenJoinChanModal}
					>
						Join chan
					</button>
					<button
						className="nes-btn is-primary"
						onClick={OpenListChanModal}
					>
						List chan
					</button>
					<Modal
						open={openLChanModal}
						onClose={CloseListChanModal}
						aria-labelledby="modal-modal-title"
						aria-describedby="modal-modal-description"
					>
						<Box className="list-chan-modal modal background-modal pixel-font">
							{user && (
								<AllChan
									user_me={user}
									chanList={chanList}
									chanListJoin={chanListJoin}
									chanListJoinPassWord={chanListJoinPassWord}
								/>
							)}
						</Box>
					</Modal>
					<Modal
						open={openCModal}
						onClose={CloseCreateChanModal}
						aria-labelledby="modal-modal-title"
						aria-describedby="modal-modal-description"
					>
						<Box className="create-chan-modal modal background-modal">
							<form className="create-channel-form">
								<label>
									<input
										className="nes-input is-dark"
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
										className="nes-input is-dark"
										onChange={handleChange}
									/>
								</label>
								<button
									name="button-create-chan"
									type="submit"
									className="nes-btn is-primary"
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
						<Box className="join-chan-modal modal background-modal">
							<form className="join-channel-form">
								<label>
									<input
										className="nes-input is-dark"
										type="text"
										name="join-chan-name"
										placeholder="Code"
										id="join-channel-form-label"
										onChange={handleChange}
									/>
								</label>
								<label>
									<input
										className="nes-input is-dark"
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
									className="nes-btn is-primary"
									onClick={createChan}
								>
									Join
								</button>
							</form>
						</Box>
					</Modal>
				</div>
			</div>
			{user && (
				<FriendsList
					user_me={user}
					chanList={chanList}
					friends={friends}
					friendOf={friendOf}
					activeConv={activeConv}
					AddFriend={AddFriend}
					accept_friend_request={accept_friend_request}
					removeFriend={removeFriend}
					banFriend={banFriend}
					gameInfo={undefined}
				/>
			)}
			<div className="chat">
				{activeChan && activeConvId != -1 && user && chanConv == 1 ? (
					<Chat
						user_me={user}
						activeChan={activeChan}
						messages={allChanMessages}
						addPassword={addPassword}
						togglePrivateChan={togglePrivateChan}
					/>
				) : null}
				{activeConvId != -1 && user && chanConv == 2 ? (
					<FriendConv
						user_me={user}
						allPrivateConvMessages={allPrivateConvMessages}
						activeConvId={activeConvId}
					/>
				) : null}
			</div>
			<div className="infos-conv">
				{activeChan && activeConvId != -1 && user && chanConv == 1 ? (
					<InfosConv
						user_me={user}
						activeChan={activeChan}
						banUser={banUser}
					/>
				) : null}
			</div>
		</div>
	);
}
