import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import ChanBanItem from './ChanBanItem'

type ChansOtherProps = {
	chan: IChannel | null,
	user_me : IUser,
};

export const ChansOther = (props: ChansOtherProps) => {
    const socket = useContext(SocketContext);
    const [chanJoined, setChanJoined] = useState<IChannel[]>([]);

    const [openPassWordModal, setOpenPassWordModal] = React.useState(false);
	const openPassWordProtectedModal = () => setOpenPassWordModal(true);
	const closePassWordProtectedModal = () => setOpenPassWordModal(false);

    const joinChan = (event: any): void => {
        if (props.chan?.visibility != "password-protected")
        {
            socket.emit(
                'channels_join',
                {
                    code: props.chan?.code,
                    motdepasse: "",
                },
                (data: any) => {
                    if (data.messages)
                        alert(data.messages);
                },
            );
        }
        else if (props.chan?.visibility === "password-protected")
            openPassWordProtectedModal();
    }

	const display = (): boolean => {
        let i = 0;
        if (props.chan)
        {
            let x = 0;
            while (x < props.chan.invited.length)
            {
                if (props.chan.invited[x].userId === props.user_me.id)
                    i += 1;
                x++;
            }
            x = 0;
            while (x < props.chan.banned.length)
            {
                if (props.chan.banned[x].userId === props.user_me.id)
                    i += 1;
                x++;
            }
            x = 0;
            while (x < chanJoined.length)
            {
                if (props.chan.id === chanJoined[x].id)
                    i += 1;
                x++;
            }
        }
        if (props.chan?.name === '')
            return false
        if (i > 0)
            return false;
        else
            return true;
    }

    useEffect(() => {
		socket.emit('channels_listJoined', {}, (data: any) => {
			setChanJoined(data);
		});
	}, [chanJoined]);

	return (
		<div className="ChansOther-item-wrapper">	
            <Modal
                open={openPassWordModal}
                onClose={closePassWordProtectedModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="password-chan-modal">
                    <form >
                        <input type="submit" id="name" name="name">edzedez</input>
                    </form>
                </Box>
            </Modal>		
            {display() && (
                <div className='chan-list-item'>
                    <span>{props.chan?.name}</span>
                    <span className="e-icons e-medium e-plus" onClick={joinChan}></span>
                </div>
            )}
		</div>
	);
};

export default ChansOther;
