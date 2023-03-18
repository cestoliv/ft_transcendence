import React from 'react';
import 'reactjs-popup/dist/index.css';

import { IChannel, IUser } from '../interfaces';

type ChansBanProps = {
	chan: IChannel | null;
	user_me: IUser;
};

export const ChansBan = (props: ChansBanProps) => {
	const isBan = (): boolean => {
		if (props.chan) {
			let x = 0;
			while (x < props.chan.banned.length) {
				const now = Date.now();
				const isoDate = new Date(props.chan.banned[x].until);
				if (props.chan.banned[x].userId === props.user_me.id && isoDate.getTime() > now) return true;
				x++;
			}
			return false;
		}
		return false;
	};

	return (
		<div className="ChansBan-item-wrapper">
			{isBan() && (
				<div className="chan-list-item modal-item">
					<span className="pixel-font">{props.chan?.name}</span>
				</div>
			)}
		</div>
	);
};

export default ChansBan;
