import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';


type ChanUserProps = {
	username : string,
    user_id : number,
};

export const ChanUser = (props: ChanUserProps) => {
    const [openCModal, setOpenCModal] = React.useState(false);
	const OpenCreateChanModal = () => setOpenCModal(true);
	const CloseCreateChanModal = () => setOpenCModal(false);

	return (
		<div className="ChanUser-wrapper">
			<h3 onClick={OpenCreateChanModal}>{props.username}</h3>
            <Modal
                open={openCModal}
                onClose={CloseCreateChanModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box className="chan-user-modal">
                    <button>Set Admin</button>
                    <button>Ban</button>
                    <button>Kick</button>
                    <button>Mute</button>
                </Box>
            </Modal>
		</div>
	);
};

export default ChanUser;
