import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Chan from './Chan';

import { IChannel, IUser, IUserFriend, IChannelMessage } from '../interfaces';

import { SocketContext } from '../context/socket';

type ChanListProps = {
	chanList : IChannel[],
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	leaveChan: (chan_id: number) => void;
};

export const ChanList = (props: ChanListProps) => {
	const socket = useContext(SocketContext);

	const [chanList, setChanList] = useState<any>([]);

	const closeChanList = (event: any): void => {
		var sidenav = document.getElementById("chan-list");
		sidenav?.classList.remove("active-chan-list");

		var button1 = document.getElementById("open-chan-joined-button");
		var button2 = document.getElementById("open-friend-list-button");

		button1?.classList.remove("hidden-button");
		button2?.classList.remove("hidden-button");
	};

	// useEffect(() => {
	// 	console.log("ChansList UseEffect");
	// 	socket.emit('channels_listJoined', {}, (data: any) => {
	// 		// console.log("hello10 : ");
	// 		// console.log(data);
	// 		setChanList(data);
	// 	});
	// }, [chanList]);

	return (
		<div className="ChanList-wrapper">
			<span className='close-chan-list' id='close-chan-list' onClick={closeChanList}>close</span>
			{props.chanList.map((chan: any) => (
				<Chan key={chan.id} chan_id={chan.id} activeConv={props.activeConv} leaveChan={props.leaveChan} chan_name={chan.name} chanList={props.chanList}/>
			))}
		</div>
	);
};

export default ChanList;
