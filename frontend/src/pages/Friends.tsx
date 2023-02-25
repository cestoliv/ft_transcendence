import React, { ChangeEvent, useEffect, useContext } from 'react';
import Chat from '../components/Chat';
import FriendConv from '../components/FriendConv';
import InfosConv from '../components/InfosConv';
import FriendsList from '../components/FriendsList';
import ChanList from '../components/ChanList';
import AllChan from '../components/AllChan';
import { useState } from 'react';
import { IConvList } from '../interface';

import { IChannel, IUser, IUserFriend, IChannelMessage, IUserMessage } from '../interfaces';

// modal
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

  type FriendsProps = {
	user_me : IUser,
};

export default function Friends(props: FriendsProps) {
	const socket = useContext(SocketContext);

	const [user, setUser] = useState<IUser>();
	const [chanList, setChanList] = useState<IChannel[]>([]);
	const [chanMessages, setChanMessages] = useState<IChannelMessage[] | null>([]);
	const [allChanMessages, setAllChanMessages] = useState<IChannelMessage[]>([]);
	const [allPrivateConvMessages, setAllPrivateConvMessages] = useState<IUserMessage[]>([]);

	// FriendsList
	const[friendOf, setFriendOf] = useState<IUserFriend[]>([]);
	const[friends, setFriends] = useState<IUser[]>([]);

	const [activeConvId, setActivConvId] = useState<number>(-1);
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
		socket.emit('users_get', { id: props.user_me.id }, (data: any) => {
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
					visibility: chanMdp === '' ? 'public' : 'password-protected',
				},
				(data: any) => {
					if (data.messages)
						alert(data.messages);
					else
						setChanList((prevChanList) => [...prevChanList, data]);
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
					if (data.messages)
						alert(data.messages);
					else
						setChanList((prevChanList) => [...prevChanList, data]);
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
			  setChanList(prevList => prevList.filter(chan => chan.id !== chan_id));
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
				if (data.messages)
					alert(data.messages);
				else
					setChanList((prevChanList) => [...prevChanList, data]);
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

	const activeConv = (event: any) => {
		let newId;
		let element;

		if (event.target.classList != 'wrapper-active-conv' && event.target.classList != 'wrapper-active-conv-span')
			return;
		let active_elem = document.getElementById('active-conv-bg');
		if (active_elem) active_elem.removeAttribute('id');
		if (event.target.classList == 'wrapper-active-conv-span') element = event.target.parentElement;
		else element = event.target;
		element.setAttribute('id', 'active-conv-bg');
		active_elem = element;
		const newActivConv = document.getElementById('active-conv-bg');
		if (newActivConv) newId = newActivConv.getAttribute('data-id');
		if (newId) setActivConvId(parseInt(newId));
		if (newActivConv?.getAttribute('data-conv-type') == 'chan-conv') setChanConv(1);
		else setChanConv(2);
	};

	const OpenConvs = (event: any): void => {
		if (event.target.name === 'open-chan-joined-button') {
			var sidenav = document.getElementById("chan-list");
			sidenav?.classList.add("active-chan-list");
		}
		if (event.target.name === 'open-friend-list-button') {
			var sidenav = document.getElementById("priv-conv-list");
			sidenav?.classList.add("active-friend-list");
		}
		var button1 = document.getElementById("open-chan-joined-button");
		var button2 = document.getElementById("open-friend-list-button");

		button1?.classList.add("hidden-button");
		button2?.classList.add("hidden-button");
	};

	socket.off('channels_message'); // Unbind previous event
	socket.on('channels_message', (data: any) => {
		console.log('Socket channels_message:');
		console.log(data);
		setAllChanMessages((prevMessages) => [data, ...prevMessages]);
	});

	  useEffect(() => {
		console.log("channels_listJoined UseEffect");
		// Récupérer la liste des channels joints
		socket.emit('channels_listJoined', {}, (data: any) => {
		  // Pour chaque channel joint, récupérer les messages du channel et les ajouter à "allChanMessages"
		  data.forEach((channel: any) => {
			// console.log(channel);
			socket.emit('channels_messages', { id: channel.id, before: new Date().toISOString() }, (messages: any) => {
			  if (messages.message) {
				alert(messages.errors);
			  } else {
				// Ajouter les messages du channel à "allChanMessages"
				messages.forEach((message: any) => {
					// console.log(message);
					setAllChanMessages((prevMessages) => [...prevMessages, message]);
				})
				// setAllChanMessages((prevMessages) => [...prevMessages, ...messages]);
			  }
			});
		  });
		});
	  }, [chanList]);

	  	socket.off('users_message'); // Unbind previous event
		socket.on('users_message', (data: any) => {
			console.log('Socket users_message:');
			console.log(data.message);
			setAllPrivateConvMessages((prevMessages) => [data.message, ...prevMessages]);
		});

	  useEffect(() => {
		console.log("AllPrivateConvMessages UseEffect");
		// Récupérer la liste des channels joints
		socket.emit('users_get', { id: props.user_me.id }, (data: any) => {
		  // Pour chaque channel joint, récupérer les messages du channel et les ajouter à "allChanMessages"
		  data.friends.forEach((friend: any) => {
			// console.log(channel);
			socket.emit('users_getMessages', { id: friend.id, before: new Date().toISOString() }, (messages: any) => {
			  if (messages.message) {
				alert(messages.errors);
			  } else {
				// Ajouter les messages du channel à "allChanMessages"
				messages.forEach((message: any) => {
					setAllPrivateConvMessages((prevMessages) => [...prevMessages, message]);
				})
			  }
			});
		  });
		});
	  }, [friends]);

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
		<div className="friends-wrapper">
			<div className="burger-menu">
				<button className='open-chan-joined-button' id='open-chan-joined-button' name='open-chan-joined-button' onClick={OpenConvs}>Channels</button>
				<button className='open-friend-list-button' id='open-friend-list-button' name='open-friend-list-button' onClick={OpenConvs}>Friends</button>
			</div>
			<div className="chan-list" id='chan-list'>
				<ChanList activeConv={activeConv} chanList={chanList} leaveChan={leaveChan}/>
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
						<Box className="list-chan-modal background-modal pixel-font">
							{ user && <AllChan user_me={user} chanList={chanList} chanListJoin={chanListJoin} chanListJoinPassWord={chanListJoinPassWord}/> }
						</Box>
					</Modal>
					<Modal
						open={openCModal}
						onClose={CloseCreateChanModal}
						aria-labelledby="modal-modal-title"
						aria-describedby="modal-modal-description"
					>
						<Box className="create-chan-modal background-modal">
							<form className="create-channel-form">
								<label>
									<input
										className='pixel-font'
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
											className="mdp-channel-form-label pixel-font"
										onChange={handleChange}
									/>
								</label>
								<button
									name="button-create-chan"
									type="submit"
									className="pixel-font"
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
						<Box className="join-chan-modal background-modal">
							<form className="join-channel-form">
								<label>
									<input
										className='pixel-font'
										type="text"
										name="join-chan-name"
										placeholder="Code"
										id="join-channel-form-label"
										onChange={handleChange}
									/>
								</label>
								<label>
									<input
										className='pixel-font'
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
									className="pixe-font"
									onClick={createChan}
								>
									Join
								</button>
							</form>
						</Box>
					</Modal>
				</div>
			</div>
			{user && <FriendsList user_me={user} chanList={chanList} friends={friends} friendOf={friendOf} activeConv={activeConv} AddFriend={AddFriend} accept_friend_request={accept_friend_request} removeFriend={removeFriend}/>}
			<div className="chat">
				{activeConvId != -1 && user && chanConv == 1 ? (
					<Chat user_me={user} activeConvId={activeConvId} messages={allChanMessages}/>
				) : null}
				{activeConvId != -1 && user && chanConv == 2 ? (
					<FriendConv user_me={user} allPrivateConvMessages={allPrivateConvMessages} activeConvId={activeConvId}/>
				) : null}
			</div>
			<div className="infos-conv">
				{activeConvId != -1 && user && chanConv == 1 ? (
						<InfosConv user_me={user} activeConvId={activeConvId} />
					) : null}
			</div>
		</div>
	);
}
