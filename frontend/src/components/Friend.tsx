import { render } from '@testing-library/react';
import React from 'react';
import {useState} from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

// interface IState {
//     isLogin : string;
// }

type FriendProps = {
    name : string,
    states : string,
    activeConv : (even: React.MouseEvent<HTMLDivElement>) => void,
}

export const Friend = (props: FriendProps) => {

    // let x = props.status;
    // const [state, setState] = useState<IState>({
    //     isLogin : x,
    // })

    return (
        <div className='wrapper-active-conv' onClick={props.activeConv}>
            <span className={props.states}>{props.name}</span>
            <div className="friendsList-settings">
                {props.states === 'connected' && <span className="e-icons e-medium e-play"></span>}
                {props.states === 'ingame' && <span className="e-icons e-medium e-radio-button"></span>}
                <span className="e-icons e-medium e-close"></span>
            </div>
        </div>
    );
}

export default Friend;