import React from 'react';
import {useState} from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import userChans from '../mock-data/userchans';

type ChanListProps = {
    // chans : {
    //     name :string,
    //     id : number,
    // }[],
    activeConv : (even: React.MouseEvent<HTMLDivElement>) => void,
}

export const ChanList = (props: ChanListProps) => {

    return (
        <div className="ChanList-wrapper">
            {userChans.map((chan) => (
                        <div className='wrapper-active-conv' onClick={props.activeConv}>{chan.name}</div>
                    ))}
        </div>
    );
}

export default ChanList;