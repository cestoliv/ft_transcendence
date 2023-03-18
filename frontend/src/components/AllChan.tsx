import React, { useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';
import { message } from 'antd';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelInvitedUser } from '../interfaces';

import ChansBan from './ChansBan';
import ChansInv from './ChansInv';
import ChansOther from './ChansOther';

type AllChanProps = {
	user_me: IUser;
	chanList: IChannel[];
	chanListJoin: (chan_code: string | undefined) => void;
	chanListJoinPassWord: (chan_code: string | undefined, psswrd: string) => Promise<any>;
};

export const AllChan = (props: AllChanProps) => {
	const socket = useContext(SocketContext);

	const [chans, setChans] = useState<IChannel[]>([]);
	const [chansInv, setChansInv] = useState<IChannel[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	socket.off('channels_inviteUser'); // Unbind previous event
	socket.on('channels_inviteUser', (data: IChannelInvitedUser) => {
		socket.emit(
			'channels_get',
			{
				id: data.channelId,
			},
			(data: any) => {
				if (data.messages) message.error(data.messages);
				else setChansInv((prev) => [data as IChannel, ...prev]);
			},
		);
	});

	useEffect(() => {
		console.log('AllChan UseEffect');
		socket.emit('channels_list', {}, (data: IChannel[]) => {
			setChans(data);
			setChansInv(
				data.filter((channel) =>
					channel.invited.some((invitedUser) => invitedUser.userId === props.user_me.id),
				),
			);
			setLoading(false);
		});
	}, [props.chanList]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			// Appel de l'API ou mise à jour de l'état
			console.log('AllChan UseEffect every 60s');
			socket.emit('channels_list', {}, (data: IChannel[]) => {
				setChans(data);
				setChansInv(
					data.filter((channel) =>
						channel.invited.some((invitedUser) => invitedUser.userId === props.user_me.id),
					),
				);
				setLoading(false);
			});
		}, 60000); // 60000 ms = 1 minute

		return () => clearInterval(intervalId);
	}, []);

	return (
		<div className="AllChan-wrapper">
			{loading && (
				<div className="spinner-container">
					<div className="loading-spinner"></div>
				</div>
			)}
			{!loading && <h3 className="display-chan-title pixel-font">All Chan</h3>}
			<div className="ChansOther-wrapper">
				{chans
					?.filter((chan) => {
						if (chan.visibility === 'public' || chan.visibility == 'password-protected') return true;
						return false;
					})
					.map((chan) => (
						<ChansOther
							key={chan.id}
							chan={chan}
							chanList={props.chanList}
							user_me={props.user_me}
							chanListJoin={props.chanListJoin}
							chanListJoinPassWord={props.chanListJoinPassWord}
						/>
					))}
			</div>
			{!loading && <h3 className="display-chan-title pixel-font">ban Chan</h3>}
			{chans?.map((chan) => (
				<ChansBan key={chan.id} chan={chan} user_me={props.user_me} />
			))}
			{!loading && <h3 className="display-chan-title pixel-font">invit chan</h3>}
			{chansInv?.map((chan) => (
				<ChansInv
					key={chan.id}
					chan={chan}
					chanList={props.chanList}
					user_me={props.user_me}
					chanListJoin={props.chanListJoin}
				/>
			))}
		</div>
	);
};

export default AllChan;
