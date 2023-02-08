import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';

import { SocketContext } from '../context/socket';


type ChanProps = {
	chan_name: string;
	chan_id: string;
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
};

export const Chan = (props: ChanProps) => {
	const socket = useContext(SocketContext);
    let [chanId, setchanId] = useState<number | undefined>(1);

    const leaveChan = (event: any): void => {
        console.log(chanId);
        try {
            socket.emit(
                'channels_leave',
                {
                    id: chanId,
                },
                (data: any) => {
                },
            );
        } catch (error) {
            alert(error);
        }
    };

    useEffect(() => {
		let x;

        let idchan = props.chan_id;
        x = +idchan;
        setchanId(x);
	}, [chanId]);

	return (
        <div id={props.chan_id} data-id={props.chan_id} className="wrapper-active-conv" onClick={props.activeConv}>
            <span>{props.chan_name}{props.chan_id}</span>
            <span className="e-icons e-medium e-close" onClick={leaveChan}></span>
        </div>
	);
};

export default Chan;
