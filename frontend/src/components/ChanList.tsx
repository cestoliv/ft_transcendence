import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Chan from './Chan';

import { IChannel, IUser, IUserFriend, IChannelMessage } from '../interfaces';

import { SocketContext } from '../context/socket';

type ChanListProps = {
	chanList: IChannel[];
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	leaveChan: (chan_id: number) => void;
};

export const ChanList = (props: ChanListProps) => {
	const socket = useContext(SocketContext);

	const [chanList, setChanList] = useState<any>([]);

	const closeChanList = (event: any): void => {
		const sidenav = document.getElementById('chan-list');
		sidenav?.classList.remove('active-chan-list');

		const button1 = document.getElementById('open-chan-joined-button');
		const button2 = document.getElementById('open-friend-list-button');

		button1?.classList.remove('hidden-button');
		button2?.classList.remove('hidden-button');
	};

	return (
		<div className="ChanList-wrapper">
			<span className="close-chan-list" id="close-chan-list" onClick={closeChanList}>
				close
			</span>
			{props.chanList.map((chan: any) => (
				<Chan
					key={chan.id}
					chan_id={chan.id}
					activeConv={props.activeConv}
					leaveChan={props.leaveChan}
					chan_name={chan.name}
					chanList={props.chanList}
				/>
			))}
		</div>
	);
};

export default ChanList;
