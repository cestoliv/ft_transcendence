import React from 'react';
import {useState} from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import {InfosConvProps} from '../interface'


// interface PROPS {
//     friends: IConvList;
// }

export default function InfosConv({ convList }: InfosConvProps) {

    return (
        <div className="i-conv-wrapper">
            {convList.map(({ name, id}) => (
                <Popup trigger={<button className='i-conv-wrapper-button'> {name}</button>}>
                    <div className='i-conv-person-popup'>
                        <button className='i-conv-person-popup-button'>invite to game</button>
                        <button className='i-conv-person-popup-button'>Profile</button>
                        <button className='i-conv-person-popup-button'>Block</button>
                        <button className='i-conv-person-popup-button'>Mute</button>
                        <button className='i-conv-person-popup-button'>Kick</button>
                        <button className='i-conv-person-popup-button'>Ban</button>
                        <button className='i-conv-person-popup-button'>Setadmin</button>
                    </div>
                </Popup>
            ))}
        </div>
    );
}