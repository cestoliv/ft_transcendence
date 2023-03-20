import React from 'react';
import 'reactjs-popup/dist/index.css';

import Chan from './Chan';

import { IChannel } from '../interfaces';

type ChanListProps = {
	chanList: IChannel[];
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
	leaveChan: (chan_id: number) => void;
};

export const ChanList = (props: ChanListProps) => {
	const closeChanList = (): void => {
		const sidenav = document.getElementById('chan-list');
		sidenav?.classList.remove('active-chan-list');

		const button1 = document.getElementById('open-chan-joined-button');
		const button2 = document.getElementById('open-friend-list-button');
		const button3 = document.getElementById('open-infos-conv-button');

		button1?.classList.remove('hidden-button');
		button2?.classList.remove('hidden-button');
		button3?.classList.remove('hidden-button');
	};

	return (
		<div className="ChanList-wrapper">
			<span className="close-chan-list" id="close-chan-list" onClick={closeChanList}>
				close
			</span>
			{props.chanList.length > 0 ? (
				props.chanList.map((chan: any) => (
					<Chan
						key={chan.id}
						chan_id={chan.id}
						activeConv={props.activeConv}
						leaveChan={props.leaveChan}
						chan_name={chan.name}
						chanList={props.chanList}
					/>
				))
			) : (
				<div className="no-chans">
					<img
						src="https://cdn1.iconfinder.com/data/icons/pixel-art-essential/512/Bubble-512.png"
						alt="No chans"
					/>
					<p>No chans...</p>
				</div>
			)}
		</div>
	);
};

export default ChanList;
