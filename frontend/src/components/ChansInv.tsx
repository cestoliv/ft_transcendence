import React from 'react';
import 'reactjs-popup/dist/index.css';

import { IChannel, IUser } from '../interfaces';

type ChansInvProps = {
	chan: IChannel;
	chanList: IChannel[];
	user_me: IUser;
	chanListJoin: (chan_code: string | undefined) => void;
};

export const ChansInv = (props: ChansInvProps) => {
	const handleJoinClick = () => {
		props.chanListJoin(props.chan?.code);
	};

	return (
		<div className="ChansInv-wrapper">
			<div className="">
				<div className="chan-list-item pixel-font">
					<span className="pixel-font">{props.chan?.name}</span>
					<span className="e-icons e-medium e-plus modal-e-plus" onClick={handleJoinClick}></span>
				</div>
			</div>
		</div>
	);
};

export default ChansInv;
