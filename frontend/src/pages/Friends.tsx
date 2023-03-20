import React, { ChangeEvent, useEffect, useContext, useRef } from 'react';
import Chat from '../components/Chat';
import FriendConv from '../components/FriendConv';
import InfosConv from '../components/InfosConv';
import FriendsList from '../components/FriendsList';
import ChanList from '../components/ChanList';
import AllChan from '../components/AllChan';
import { useState } from 'react';
import { message } from 'antd';

import { IChannel, IUser, IUserFriend, IChannelMessage, IUserMessage } from '../interfaces';

// modal
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

type FriendsProps = {
	user_me: IUser;
};

export default function Friends(props: FriendsProps) {
	const socket = useContext(SocketContext);

	const chanListRef = useRef<HTMLDivElement>(null);
	const infosConvRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				infosConvRef.current &&
				infosConvRef.current.classList.contains('active-infos-conv') &&
				!infosConvRef.current.contains(event.target as Node)
			) {
				infosConvRef.current.classList.remove('active-infos-conv');
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
	}, [infosConvRef]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				chanListRef.current &&
				chanListRef.current.classList.contains('active-chan-list') &&
				!chanListRef.current.contains(event.target as Node)
			) {
				chanListRef.current.classList.remove('active-chan-list');
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
	}, [chanListRef]);

	// const [isEnabled, setIsEnabled] = useState(false);
	// const [delai, setDelai] = useState<number>(0);

	const [user, setUser] = useState<IUser>();
	const [chanList, setChanList] = useState<IChannel[]>([]);
	const [allChan, setAllChan] = useState<IChannel[]>([]);
	const [allChanMessages, setAllChanMessages] = useState<IChannelMessage[]>([]);
	const [allPrivateConvMessages, setAllPrivateConvMessages] = useState<IUserMessage[]>([]);

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
		if (event.target.name === 'create-chan-name') setChanName(event.target.value);
		if (event.target.name === 'create-chan-mdp') setChanMdp(event.target.value);

		if (event.target.name === 'join-chan-name') setJoinChanName(event.target.value);
		if (event.target.name === 'join-chan-mdp') setJoinChanMdp(event.target.value);
	};

	useEffect(() => {
		socket.emit('users_get', { id: props.user_me.id }, (data: IUser) => {
			setUser(data as IUser);
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
					visibility: chanMdp === '' ? 'public' : 'password-protected',
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
					else {
						setChanList((prevChanList) => [...prevChanList, data as IChannel]);
						setAllChan((prevChanList) => [...prevChanList, data as IChannel]);
					}
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
					if (data.messages) message.error(data.messages);
					else setChanList((prevChanList) => [...prevChanList, data as IChannel]);
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
					message.error(data.messages);
				} else {
					// Remove the channel with the given chan_id from the chanList array
					setChanList((prevList) => prevList.filter((chan) => chan.id !== chan_id));
					if (activeChan?.id === data.id) {
						setActivConvId(-1);
						setActiveChan(null);
					}
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
				if (data.messages) message.error(data.messages);
				else setChanList((prevChanList) => [...prevChanList, data as IChannel]);
			},
		);
	};

	const chanListJoinPassWord = (chan_code: string | undefined, psswrd: string): Promise<any> => {
		return new Promise((resolve, reject) => {
			socket.emit(
				'channels_join',
				{
					code: chan_code,
					password: psswrd,
				},
				(data: any) => {
					if (data.messages) {
						message.error(data.messages);
						reject(new Error(data.messages));
					} else {
						setChanList((prevChanList) => [...prevChanList, data as IChannel]);
						resolve(data);
					}
				},
			);
		});
	};

	const setAdmin = (chan_id: number, member_id: number, x: number): void => {
		if (x == 1) {
			socket.emit(
				'channels_addAdmin',
				{
					id: chan_id,
					user_id: member_id,
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
					else {
						setActiveChan(data);
					}
				},
			);
		}
		if (x == 2) {
			socket.emit(
				'channels_removeAdmin',
				{
					id: chan_id,
					user_id: member_id,
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
					else {
						setActiveChan(data);
					}
				},
			);
		}
	};

	const banUser = (banTime: string, chan_id: number, member_id: number): void => {
		const now = new Date();
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
					message.error(data.messages);
				} else {
					if (activeChan) {
						const newMembers = activeChan.members.filter((member) => member.id !== member_id);
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

	const setChanVisibility = (
		activeChan: IChannel,
		oldVisibility: string,
		newVisibility: string,
		passWord: string | null,
	): void => {
		if ((activeChan && newVisibility === 'public') || oldVisibility === newVisibility) {
			socket.emit(
				'channels_update',
				{
					id: activeChan.id,
					visibility: 'public',
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
					else {
						const index = chanList.findIndex((channel) => channel.id === activeChan.id);

						if (index !== -1) {
							// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
							const updatedChanList: IChannel[] = [...chanList];
							updatedChanList[index] = data;
							setChanList(updatedChanList);
							setActiveChan(data as IChannel);
						}
					}
				},
			);
		} else if (activeChan && newVisibility === 'private') {
			socket.emit(
				'channels_update',
				{
					id: activeChan.id,
					visibility: 'private',
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
					else {
						const index = chanList.findIndex((channel) => channel.id === activeChan.id);

						if (index !== -1) {
							// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
							const updatedChanList: IChannel[] = [...chanList];
							updatedChanList[index] = data;
							setChanList(updatedChanList);
							setActiveChan(data as IChannel);
						}
					}
				},
			);
		}
	};

	const addPassword = (passWord: string, chan_id: number): void => {
		if (passWord === '') {
			message.error('Password cant be empty');
		} else {
			socket.emit(
				'channels_update',
				{
					id: chan_id,
					visibility: 'password-protected',
					password: passWord,
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
					else {
						const index = chanList.findIndex((channel) => channel.id === chan_id);

						if (index !== -1) {
							// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
							const updatedChanList: IChannel[] = [...chanList];
							updatedChanList[index] = data;
							setChanList(updatedChanList);
							setActiveChan(data as IChannel);
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
				if (data.messages) message.error(data.messages);
				else message.success('Friend request sent to ' + data.invitee.username);
			},
		);
	};

	const accept_friend_request = (inviter_id: number, display_message: number): void => {
		socket.emit(
			'users_acceptFriend',
			{
				id: inviter_id,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					setFriends((prevFriends) => [...prevFriends, data.inviter as IUser]);
					setFriendOf((prevList) => prevList.filter((item) => item.inviterId !== (data.inviterId as number)));
					if (display_message) message.destroy();
				}
			},
		);
	};

	const refuse_friend_request = (inviter_id: number, display_message: number): void => {
		socket.emit(
			'users_removeFriend',
			{
				id: inviter_id,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					setFriendOf((prevList) => prevList.filter((item) => item.inviterId !== (data.inviterId as number)));
					if (display_message) message.destroy();
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
				if (data.messages) message.error(data.messages);
				else setFriends((prevList) => prevList.filter((user) => user.id !== user_id));
			},
		);
	};

	const banFriend = (banTime: string, friend_id: number): void => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(banTime));
		socket.emit(
			'users_ban',
			{
				id: friend_id,
				until: now,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else setFriends((prevList) => prevList.filter((user) => user.id !== friend_id));
			},
		);
	};

	// const calcDelai = (): void => {
	// 	const now = new Date();
	// 	let timeDiffInSeconds : number;
	// 	let x = 0;
	// 	while (user?.muted[x])
	// 		x++;
	// 	if (x = 0)
	// 	{
	// 		setDelai(0);
	// 		setIsEnabled(false);
	// 		return ;
	// 	}
	// 	else
	// 	{
	// 		console.log("buzz");
	// 		user?.muted.forEach(element => {
	// 			const isoDate = new Date(element.until);
	// 			console.log("until : " + isoDate);
	// 			console.log('now : ' + now);
	// 			console.log(isoDate.getTime() > now.getTime());
	// 			if (isoDate.getTime() > now.getTime())
	// 			{
	// 				timeDiffInSeconds = (isoDate.getTime() - now.getTime()) / 1000;
	// 			}
	// 			if (delai == 0 || delai > timeDiffInSeconds)
	// 				setDelai(timeDiffInSeconds)
	// 		});
	// 	}
	// 	console.log(delai);
	// 	setIsEnabled(true);
	// };

	const muteFriend = (muteTime: string, friend_id: number) => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(muteTime));
		socket.emit(
			'users_mute',
			{
				id: friend_id,
				until: now,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					setAllChanMessages((prevList) => prevList.filter((message) => message.senderId != friend_id));
				}
			},
		);
	};

	const activeConv = (event: any) => {
		let newId;
		let element;

		if (
			event.target.classList != 'wrapper-active-conv list-item' &&
			event.target.classList != 'wrapper-active-conv-span' &&
			event.target.classList != 'avatar wrapper-active-conv-img'
		)
			return;
		let active_elem = document.getElementById('active-conv-bg');
		if (active_elem) active_elem.removeAttribute('id');
		if (
			event.target.classList == 'wrapper-active-conv-span' ||
			event.target.classList == 'avatar wrapper-active-conv-img'
		)
			element = event.target.parentElement;
		else element = event.target;
		element.setAttribute('id', 'active-conv-bg');
		active_elem = element;
		const newActivConv = document.getElementById('active-conv-bg');
		if (newActivConv) newId = newActivConv.getAttribute('data-id');
		if (newId && newActivConv?.getAttribute('data-conv-type') == 'chan-conv') {
			socket.emit(
				'channels_get',
				{
					id: parseInt(newId),
				},
				(data: any) => {
					if (data.messages) message.error(data.messages);
					else setActiveChan(data as IChannel);
				},
			);
			setActivConvId(parseInt(newId));
		} else if (newId && newActivConv?.getAttribute('data-conv-type') != 'chan-conv')
			setActivConvId(parseInt(newId));
		if (newActivConv?.getAttribute('data-conv-type') == 'chan-conv') setChanConv(1);
		else setChanConv(2);
	};

	const OpenConvs = (event: any): void => {
		console.log(event.target.name);
		if (event.target.name === 'open-chan-joined-button') {
			const sidenav = document.getElementById('chan-list');
			sidenav?.classList.add('active-chan-list');
		}
		if (event.target.name === 'open-friend-list-button') {
			const sidenav = document.getElementById('priv-conv-list');
			sidenav?.classList.add('active-friend-list');
		}
		if (event.target.name === 'open-infos-conv-button') {
			const sidenav = document.getElementById('infos-conv');
			sidenav?.classList.add('active-infos-conv');
		}
		const button1 = document.getElementById('open-chan-joined-button');
		const button2 = document.getElementById('open-friend-list-button');
		const button3 = document.getElementById('open-infos-conv-button');

		button1?.classList.add('hidden-button');
		button2?.classList.add('hidden-button');
		button3?.classList.add('hidden-button');
	};

	const isHidden = (): boolean => {
		const button1 = document.getElementById('open-chan-joined-button');

		if (button1?.className.includes('hidden-button')) {
			return true;
		} else {
			return false;
		}
	};

	// start socket.on channel

	socket.off('channels_join'); // Unbind previous event
	socket.on('channels_join', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);
		const index = chanList.findIndex((channel) => channel.id === (data.id as number));

		if (index !== -1) {
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			const updatedChanList: IChannel[] = [...chanList];
			updatedChanList[index] = data as IChannel;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_leave'); // Unbind previous event
	socket.on('channels_leave', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);
		const index = chanList.findIndex((channel) => channel.id === (data.id as number));

		if (index !== -1) {
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			const updatedChanList: IChannel[] = [...chanList];
			updatedChanList[index] = data as IChannel;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_addAdmin'); // Unbind previous event
	socket.on('channels_addAdmin', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data as IChannel);

		const index = chanList.findIndex((channel) => channel.id === (data.id as number));

		if (index !== -1) {
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			const updatedChanList: IChannel[] = [...chanList];
			updatedChanList[index] = data as IChannel;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_removeAdmin'); // Unbind previous event
	socket.on('channels_removeAdmin', (data: any) => {
		if (data.id === activeChan?.id) setActiveChan(data);

		const index = chanList.findIndex((channel) => channel.id === (data.id as number));

		if (index !== -1) {
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			const updatedChanList: IChannel[] = [...chanList];
			updatedChanList[index] = data as IChannel;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_banUser'); // Unbind previous event
	socket.on('channels_banUser', (data: any) => {
		if (activeChan && activeChan.id == data.channelId) {
			const newMembers = activeChan.members.filter((member) => member.id !== data.userId);
			const newActiveChan = { ...activeChan, members: newMembers };
			setActiveChan(newActiveChan);
		}
		const index = chanList.findIndex((channel) => channel.id === (data.channelId as number));

		if (data.userId === user?.id) {
			setChanList((prevList) => prevList.filter((chan) => chan.id !== (data.channelId as number)));
			if (activeChan?.id === data.channelId) {
				setActivConvId(-1);
				setActiveChan(null);
			}
		}
		if (index !== -1 && data.userId !== user?.id) {
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			const updatedChanList: IChannel[] = [...chanList];
			const newMembers = updatedChanList[index].members.filter((member) => member.id !== (data.userId as number));
			updatedChanList[index].members = newMembers;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_update'); // Unbind previous event
	socket.on('channels_update', (data: any) => {
		console.log('channels update');
		// if (data.id === activeChan?.id) setActiveChan(data);
		const index = chanList.findIndex((channel) => channel.id === (data.id as number));

		if (index !== -1) {
			// Si l'objet IChannel existe dans le tableau, remplacer l'objet à l'index par le nouvel objet
			const updatedChanList: IChannel[] = [...chanList];
			updatedChanList[index] = data as IChannel;
			setChanList(updatedChanList);
		}
	});

	socket.off('channels_message'); // Unbind previous event
	socket.on('channels_message', (data: any) => {
		setAllChanMessages((prevMessages) => [data as IChannelMessage, ...prevMessages]);
		if (chanConv === 2 || (chanConv === 1 && (data.channelId as number) !== activeConvId))
			message.info(`Message receive in ${data.channel.name as string}`);
	});

	// end socket.on channel

	// start socket.on user

	socket.off('users_update'); // Unbind previous event
	socket.on('users_update', (data: any) => {
		console.log('users_update', data);
		const index = friends.findIndex((friend) => friend.id === (data.id as number));

		if (index !== -1) {
			const updatedFriendList: IUser[] = [...friends];
			updatedFriendList[index] = data as IUser;
			setFriends(updatedFriendList);
		}
	});

	socket.off('users_friendshipInvitation'); // Unbind previous event
	socket.on('users_friendshipInvitation', (data: any) => {
		setFriendOf((prevList) => [...prevList, data as IUserFriend]);
	});

	socket.off('users_friendshipAccepted'); // Unbind previous event
	socket.on('users_friendshipAccepted', (data: any) => {
		setFriends((prevList) => [...prevList, data.invitee as IUser]);
	});

	socket.off('users_friendshipRemoved'); // Unbind previous event
	socket.on('users_friendshipRemoved', (data: any) => {
		setFriends((prevList) => prevList.filter((friend) => friend.id !== (data.invitee.id as number)));
		setFriends((prevList) => prevList.filter((friend) => friend.id !== (data.inviter.id as number)));
	});

	socket.off('users_banned'); // Unbind previous event
	socket.on('users_banned', (data: any) => {
		setFriends((prevList) => prevList.filter((user) => user.id !== (data.userId as number)));
	});

	// end socket.on user

	// useEffect(() => {
	// 	let intervalId: NodeJS.Timeout | null = null;

	// 	if (isEnabled) {
	// 		intervalId = setInterval(() => {
	// 			setAllChanMessages([]);
	// 			console.log('setAllChanMessages delai UseEffect');
	// 			// Récupérer la liste des channels joints
	// 			socket.emit('channels_listJoined', {}, (data: any) => {
	// 				const messagesFromAllChannels: IChannelMessage[] = []; // variable temporaire pour stocker les messages
	// 				// Pour chaque channel joint, récupérer les messages du channel et les ajouter à "messagesFromAllChannels"
	// 				data.forEach((channel: any) => {
	// 					socket.emit(
	// 						'channels_messages',
	// 						{ id: channel.id, before: new Date().toISOString() },
	// 						(messages: any) => {
	// 							if (messages.message) {
	// 								alert(messages.errors);
	// 							} else {
	// 								// Ajouter les messages du channel à "messagesFromAllChannels"
	// 								messages.forEach((message: IChannelMessage) => {
	// 									messagesFromAllChannels.push(message);
	// 								});
	// 							}
	// 						},
	// 					);
	// 				});
	// 				// Ajouter tous les messages récupérés à "allChanMessages"
	// 				setAllChanMessages(messagesFromAllChannels);
	// 			});
	// 			calcDelai();
	// 	  }, delai);
	// 	}

	// 	return () => {
	// 	  if (intervalId) {
	// 		clearInterval(intervalId);
	// 	  }
	// 	};
	//   }, [isEnabled]);

	useEffect(() => {
		console.log('setAllChanMessages UseEffect');
		// Récupérer la liste des channels joints
		setAllChanMessages([]);
		socket.emit('channels_listJoined', {}, (data: any) => {
			const messagesSet = new Set<IChannelMessage>(); // Ensemble pour stocker les messages uniques
			data.forEach((channel: any) => {
				socket.emit(
					'channels_messages',
					{ id: channel.id, before: new Date().toISOString() },
					(messages: any) => {
						if (messages.messages) {
							message.error(messages.messages);
						} else {
							messages.forEach((message: IChannelMessage) => {
								messagesSet.add(message); // Ajouter le message à l'ensemble
							});
							setAllChanMessages(Array.from(messagesSet)); // Convertir l'ensemble en tableau et l'ajouter à la liste
						}
					},
				);
			});
		});
	}, [chanList]);

	socket.off('users_message'); // Unbind previous event
	socket.on('users_message', (data: any) => {
		console.log('Socket users_message:');
		setAllPrivateConvMessages((prevMessages) => [data.message as IUserMessage, ...prevMessages]);
		if (chanConv != 2 || (chanConv === 2 && (data.message.senderId as number) !== activeConvId))
			message.info(`Message receive from ${data.message.sender.username as string}`);
	});

	useEffect(() => {
		console.log('AllPrivateConvMessages UseEffect');
		// Récupérer la liste des channels joints
		socket.emit('users_get', { id: props.user_me.id }, (data: any) => {
			const messagesFromAllConversations: IUserMessage[] = []; // variable temporaire pour stocker les messages
			// Pour chaque conversation privée, récupérer les messages et les ajouter à "messagesFromAllConversations"
			data.friends?.forEach((friend: any) => {
				// console.log(channel);
				socket.emit(
					'users_getMessages',
					{ id: friend.id, before: new Date().toISOString() },
					(messages: any) => {
						if (messages.messages) {
							message.error(messages.messages);
						} else {
							// Ajouter les messages de la conversation à "messagesFromAllConversations"
							if (messages) {
								messages.forEach((message: IUserMessage) => {
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

	// useEffect(() => {
	// 	console.log('ChansList UseEffect');
	// 	socket.emit('channels_listJoined', {}, (data: any) => {
	// 		setChanList(data);
	// 	});
	// }, []);

	useEffect(() => {
		console.log('AllChan UseEffect');
		socket.emit('channels_list', {}, (data: IChannel[]) => {
			setAllChan(data);
		});
	}, []);

	useEffect(() => {
		console.log('ChansList UseEffect');
		socket.emit('channels_list', {}, (data: IChannel[]) => {
			const chanJoined: IChannel[] = data.filter((channel) =>
				channel.members.some((member) => member.id === props.user_me.id),
			);
			// Mettez à jour l'état de votre composant avec la liste des canaux privés non rejoint par l'utilisateur donné.
			setChanList(chanJoined);
		});
	}, []);

	useEffect(() => {
		console.log('FriendsList useEffect');
		socket.emit(
			'users_get',
			{
				id: props.user_me.id,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else {
					setFriendOf(data.friendOf as IUserFriend[]);
					setFriends(data.friends as IUser[]);
				}
			},
		);
	}, []);

	return (
		<div className="friends-wrapper">
			<div className="burger-menu">
				<button
					className="open-chan-joined-button nes-btn is-primary"
					id="open-chan-joined-button"
					name="open-chan-joined-button"
					onClick={OpenConvs}
				>
					<span>C</span>
					<span>H</span>
					<span>A</span>
					<span>N</span>
					<span>N</span>
					<span>E</span>
					<span>L</span>
					<span>S</span>
				</button>
				<button
					className="open-friend-list-button nes-btn is-primary"
					id="open-friend-list-button"
					name="open-friend-list-button"
					onClick={OpenConvs}
				>
					<span>F</span>
					<span>R</span>
					<span>I</span>
					<span>E</span>
					<span>N</span>
					<span>D</span>
					<span>S</span>
				</button>
				{activeConvId != -1 && chanConv == 1 ? (
					<button
						className={`open-infos-conv-button nes-btn is-primary ${isHidden() ? 'hidden-button' : ''}`}
						id="open-infos-conv-button"
						name="open-infos-conv-button"
						onClick={OpenConvs}
					>
						<span>M</span>
						<span>E</span>
						<span>M</span>
						<span>B</span>
						<span>E</span>
						<span>R</span>
						<span>S</span>
					</button>
				) : null}
			</div>
			<div className="chan-list" id="chan-list" ref={chanListRef}>
				<ChanList activeConv={activeConv} chanList={chanList} leaveChan={leaveChan} />
				<div className="chan-list-buttons">
					<button className="nes-btn is-primary" onClick={OpenCreateChanModal}>
						Create chan
					</button>
					<button className="nes-btn is-primary" onClick={OpenJoinChanModal}>
						Join chan
					</button>
					<button className="nes-btn is-primary" onClick={OpenListChanModal}>
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
					refuse_friend_request={refuse_friend_request}
					removeFriend={removeFriend}
					banFriend={banFriend}
					muteFriend={muteFriend}
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
						setChanVisibility={setChanVisibility}
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
			<div className="infos-conv" id="infos-conv" ref={infosConvRef}>
				{activeChan && activeConvId != -1 && user && chanConv == 1 ? (
					<InfosConv user_me={user} activeChan={activeChan} banUser={banUser} setAdmin={setAdmin} />
				) : null}
			</div>
		</div>
	);
}
