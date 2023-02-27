import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IUserFriend, IChannelMessage } from '../interfaces';

type ChanProps = {
	chan_name: string;
	chan_id: string;
    chanList : IChannel[],
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
    leaveChan: (chan_id: number) => void;
};

export const Chan = (props: ChanProps) => {
    let [chanId, setchanId] = useState<number>(1);

    const handleLeaveClick = () => {
        props.leaveChan(parseInt(props.chan_id)); // ici, nous supposons que l'ID du canal est 'myChannelId'
    };

    useEffect(() => {
        let x;

        let idchan = props.chan_id;
        x = +idchan;
        setchanId(x);
	}, []);

	return (
        <div id={props.chan_id} data-id={props.chan_id} data-conv-type='chan-conv' className="wrapper-active-conv list-item" onClick={props.activeConv}>
            <span className="wrapper-active-conv-span pixel-font" onClick={props.activeConv}>{props.chan_name}</span>
            <span className="e-icons e-medium e-close modal-e-close" onClick={handleLeaveClick}></span>
        </div>
	);
};

export default Chan;