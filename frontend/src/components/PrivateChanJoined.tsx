import React from 'react';
import 'reactjs-popup/dist/index.css';

import { IChannel } from '../interfaces';

type PrivateChanJoinedProps = {
	chan: IChannel;
	userToInviteId: number;
	chanInvit: (chan_id: number, invited_user_id: number) => void;
};

export const PrivateChanJoined = (props: PrivateChanJoinedProps) => {
	const chanInvit = (): void => {
		props.chanInvit(props.chan.id, props.userToInviteId);
	};

	return (
		<div className="wrapper-private-chan-joined-item">
			<div className="private-chan-joined-item nes-btn is-primary" onClick={chanInvit}>
				{props.chan.name}
			</div>
		</div>
	);
};

export default PrivateChanJoined;
