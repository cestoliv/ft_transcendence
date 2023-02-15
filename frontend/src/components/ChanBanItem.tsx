import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';


type ChanBanItemProps = {
	chan: IChannel,
    user_me : IUser,
};

export const ChanBanItem = (props: ChanBanItemProps) => {
    const socket = useContext(SocketContext);

    const [chans, setChans] = useState<IChannel[] | null>(null);
    const [chansBan, setChansBan] = useState<IUser | null>(null);
    const [chansInvited, setChansInvited] = useState<IUser | null>(null);
    const [openCModal, setOpenCModal] = React.useState(false);
	const OpenCreateChanModal = () => setOpenCModal(true);
	const CloseCreateChanModal = () => setOpenCModal(false);

    const isBan = (): boolean => {
        if (props.chan)
        {
            let x = 0;
            while (x < props.chan.banned.length)
            {
                if (props.chan.banned[x].userId === props.user_me.id)
                    return true;
                x++;
            }
            return false;
        }
        return false;
    }

    useEffect(() => {
        socket.emit(
            'channels_list', 
            {},
             (data: any) => {
                setChans(data);
                setChansBan(data.banned);
                setChansInvited(data.invited);
		});
	},);

	return (
        <div>
            {isBan() && (
                <div>{props.chan.name}</div>
        )}
        </div>
	);
};

export default ChanBanItem;
