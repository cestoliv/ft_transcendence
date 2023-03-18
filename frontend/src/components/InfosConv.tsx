import React, { useContext } from 'react';
import 'reactjs-popup/dist/index.css';
import { message } from 'antd';
import { SocketContext } from '../context/socket';

import { IChannel, IChannelMutedUser, IUser } from '../interfaces';

import ChanUser from './ChanUser';

type InfosConvProps = {
	user_me: IUser;
	activeChan: IChannel;
	banUser: (banTime: string, chan_id: number, member_id: number) => void;
	setAdmin: (chan_id: number, member_id: number, x: number) => void;
};

export default function InfosConv(props: InfosConvProps) {
	const socket = useContext(SocketContext);

	const muteUser = (muteTime: string, chan_id: number, member_id: number): Promise<any> => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + parseInt(muteTime));
		return new Promise((resolve, reject) => {
			socket.emit(
				'channels_muteUser',
				{
					id: chan_id,
					user_id: member_id,
					until: now,
				},
				(data: any) => {
					if (data.messages) {
						message.error(data.messages);
						reject(new Error(data.messages));
					} else {
						resolve(data as IChannelMutedUser);
					}
				},
			);
		});
	};

	const closeInfosConv = (): void => {
		const sidenav = document.getElementById('infos-conv');
		sidenav?.classList.remove('active-infos-conv');

		const button1 = document.getElementById('open-chan-joined-button');
		const button2 = document.getElementById('open-friend-list-button');
		const button3 = document.getElementById('open-infos-conv-button');

		button1?.classList.remove('hidden-button');
		button2?.classList.remove('hidden-button');
		button3?.classList.remove('hidden-button');
	};

	return (
		<div className="i-conv-wrapper discord-background-three">
			<span className="close-infos-conv" id="close-infos-conv" onClick={closeInfosConv}>
				close
			</span>
			{props.activeChan && (
				<div className="chan_user_wrapper discord-background-three">
					{props.activeChan.members.map((member) => (
						<ChanUser
							key={member.id}
							username={member.username}
							member_id={member.id}
							chan_id={props.activeChan.id}
							chan_owner={props.activeChan.owner}
							chan_admins={props.activeChan.admins}
							user_me_id={props.user_me.id}
							banUser={props.banUser}
							muteUser={muteUser}
							setAdmin={props.setAdmin}
						/>
					))}
				</div>
			)}
		</div>
	);
}
