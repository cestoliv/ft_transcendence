import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

// import { InfosConvProps } from '../interface';
import { SocketContext } from '../context/socket';

import ChanUser from './ChanUser'

type InfosConvProps = {
	activeConvId : number | undefined,
};

interface Channel {
	id: number;
	code: string;
	owner: User;
	name: string;
	visibility: 'public' | 'private' | 'password-protected';
	admins: User[];
	members: User[];
	banned: User[];
	muted: User[];
	invited: User[];
  }

  interface User {
	id: number,
	id42: number, // -1 for non-42 users
	username: string,
  }

export default function InfosConv(props: InfosConvProps) {

	const socket = useContext(SocketContext);

	const [channel, setChannel] = useState<Channel | null>(null);

	useEffect(() => {
		try {
			socket.emit(
				'channels_findOne',
				{
					id: props.activeConvId,
				},
				(data: any) => {
					setChannel(data);
				},
			);
		} catch (error) {
			alert(error);
		}
	}, [channel]);

	return (
		<div className="i-conv-wrapper">
			{channel && (
			<div className="chan_user_wrapper">
			{channel.members.map(member => (
				<ChanUser username={member.username} user_id={member.id}/>
			))}
			</div>
      	)}
		</div>
	);
}
