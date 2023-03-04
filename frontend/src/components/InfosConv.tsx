import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

// import { InfosConvProps } from '../interface';
import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import ChanUser from './ChanUser';

type InfosConvProps = {
	user_me: IUser;
	activeChan : IChannel;
	banUser : (banTime : string, chan_id : number, member_id : number) => void;
};

export default function InfosConv(props: InfosConvProps) {
	const socket = useContext(SocketContext);

    const muteUser = (muteTime : string, chan_id : number, member_id : number): Promise<any> => {
        let now = new Date();
        now.setMinutes(now.getMinutes() + parseInt(muteTime));
		return new Promise((resolve, reject) => {
			socket.emit(
				'channels_muteUser',
				{
					id: chan_id,
					user_id: member_id,
					until : now,
				},
				(data: any) => {
					if (data.messages)
					{
						alert(data.messages);
						reject(new Error(data.messages));
					}
					else
					{
						resolve(data);
					}
				},
			);
		});
    }

	return (
		<div className="i-conv-wrapper discord-background-three">
			{props.activeChan && (
				<div className="chan_user_wrapper discord-background-three">
					{props.activeChan.members.map(member => (
						<ChanUser key={member.id} username={member.username} member_id={member.id} chan_id={props.activeChan.id} chan_owner={props.activeChan.owner} chan_admins={props.activeChan.admins} user_me_id={props.user_me.id} banUser={props.banUser} muteUser={muteUser} />
					))}
				</div>
			)}
		</div>
	);
}
