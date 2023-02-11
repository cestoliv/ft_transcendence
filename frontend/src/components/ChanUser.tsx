import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

type ChanUserProps = {
	username : string,
    member_id : number,
    chan_id : number,
    chan_admins : IUser[],
};

export const ChanUser = (props: ChanUserProps) => {
    const socket = useContext(SocketContext);

    const [openChanUserModal, setOpenChanUserModal] = React.useState(false);
	const OpenChanUserModal = () => setOpenChanUserModal(true);
	const CloseChanUserModal = () => setOpenChanUserModal(false);


    // add amin or remove admin
    const setAdmin = (event: any): void => {

        // add amin
		if (event.target.name === 'button-add-admin') {
            socket.emit(
                'channels_addAdmin',
                {
                    id: props.chan_id,
                    user_id: props.member_id,
                },
                (data: any) => {
                    if (data.message)
							alert(data.errors);
                    else
                        CloseChanUserModal();
                },
            );
		}

        // remove admin
        if (event.target.name === 'button-remove-admin') {
            socket.emit(
                'channels_removeAdmin',
                {
                    id: props.chan_id,
                    user_id: props.member_id,
                },
                (data: any) => {
                    if (data.message)
							alert(data.errors);
                    else
                        CloseChanUserModal();
                },
            );
		}
        // console.log("chan admins : ");
        // if (props.chan_admins)
        // {
        //     {props.chan_admins.map(user => (
        //         console.log(user.username)
        //     ))};
        // }
	};

    const banUser = (event: any): void => {
        socket.emit(
            'channels_banUser',
            {
                id: props.chan_id,
                user_id: props.member_id,
                until : "2023-02-10T01:00:00-01:00",
            },
            (data: any) => {
                if (data.message)
                        alert(data.errors);
                else
                    CloseChanUserModal();
            },
        );
    }

    const muteUser = (event: any): void => {
        socket.emit(
            'channels_muteUser',
            {
                id: props.chan_id,
                user_id: props.member_id,
                until : "2023-02-11T03:00:00-01:00",
            },
            (data: any) => {
                if (data.message)
                        alert(data.errors);
                else
                    CloseChanUserModal();
            },
        );
    }

    const isAdmin = (): boolean => {
        if (props.chan_admins)
        {
            let x = 0;
            while (x < props.chan_admins.length)
            {
                if (props.chan_admins[x].id === props.member_id)
                    return true;
                x++;
            }
            return false;
        }
        return false;
    }

    useEffect(() => {
        // console.log("hello 26 : ");
        // console.log(props.chan_id);
        // if (props.chan_admins)
        // {
        //     {props.chan_admins.map(user => (
        //         console.log(user.username)
        //     ))};
        // }
	},);

	return (
		<div className="ChanUser-wrapper">
			<h3 onClick={OpenChanUserModal}>{props.username}</h3>
            <Modal
                open={openChanUserModal}
                onClose={CloseChanUserModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="chan-user-modal">
                    {!isAdmin() && (
                        <button name='button-add-admin' onClick={setAdmin}>Set Admin</button>
                    )}
                    {isAdmin() && (
                        <button name='button-remove-admin' onClick={setAdmin}>Remove Admin</button>
                    )}
                    <button name='button-ban_user' onClick={banUser}>Ban</button>
                    <button>Kick</button>
                    <button name='button-mute_user' onClick={muteUser}>Mute</button>
                </Box>
            </Modal>
		</div>
	);
};

export default ChanUser;
