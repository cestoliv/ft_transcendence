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

	useEffect(() => {
		//console.log("buzz");
		socket.emit('channels_list', {}, (data: any) => {
			console.log("hello10 : ");
			console.log(data);
			setChanList(data);
		});
	}, [chanList]);

	return (
		<div className="ChanList-wrapper">
			{chanList.map((chan: any) => (
				<Chan chan_id={chan.id} activeConv={props.activeConv} chan_name={chan.name}/>
				// <div
				// 	id={chan.id}
				// 	data-id={chan.id}
				// 	className="wrapper-active-conv"
				// 	onClick={props.activeConv}
				// >
				// 	{chan.name}
				// </div>
			))}
		</div>
	);
};

export default ChanList;
