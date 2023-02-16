import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Chan from './Chan';

import userChans from '../mock-data/userchans';
import { SocketContext } from '../context/socket';

type ChanListProps = {
	// chans : {
	//     name :string,
	//     id : number,
	// }[],
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
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

	useEffect(() => {
		//console.log("buzz");
		socket.emit('channels_listJoined', {}, (data: any) => {
			// console.log("hello10 : ");
			// console.log(data);
			setChanList(data);
		});
	}, [chanList]);

	return (
		<div className="ChanList-wrapper">
			<span className='close-chan-list' id='close-chan-list' onClick={closeChanList}>close</span>
			{chanList.map((chan: any) => (
				<Chan chan_id={chan.id} activeConv={props.activeConv} chan_name={chan.name}/>
			))}
		</div>
	);
};

export default ChanList;
