import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

// import { InfosConvProps } from '../interface';
import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import ChanUser from './ChanUser'

type InfosConvProps = {
	user_me : IUser,
	activeConvId : number | undefined,
};


export default function InfosConv(props: InfosConvProps) {

	const socket = useContext(SocketContext);

	const [channel, setChannel] = useState<IChannel | null>(null);

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
				<ChanUser username={member.username} member_id={member.id} chan_id={channel.id} chan_admins={channel.admins}/>
			))}
			</div>
      	)}
		</div>
	);
}
