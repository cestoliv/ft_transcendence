import React from 'react';
import 'reactjs-popup/dist/index.css';

import { IChannel } from '../interfaces';

type ChanProps = {
	chan_name: string;
	chan_id: string;
	chanList: IChannel[];
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	leaveChan: (chan_id: number) => void;
};

export const Chan = (props: ChanProps) => {
	const handleLeaveClick = () => {
		props.leaveChan(parseInt(props.chan_id));
	};

	return (
		<div
			id={props.chan_id}
			data-id={props.chan_id}
			data-conv-type="chan-conv"
			className="wrapper-active-conv list-item"
			onClick={props.activeConv}
		>
			<span className="wrapper-active-conv-span">{props.chan_name}</span>
			<img src="https://cdn-icons-png.flaticon.com/128/391/391372.png" onClick={handleLeaveClick} />
		</div>
	);
};

export default Chan;
