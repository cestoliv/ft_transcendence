import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import { SocketContext } from '../context/socket';

import { IChannel, IUser, IChannelBannedUser, IChannelInvitedUser, IChannelMessage } from '../interfaces';

import ChansBan from './ChansBan'
import ChansInv from './ChansInv'
import ChansOther from './ChansOther'

type AllChanProps = {
	user_me : IUser,
  chanList : IChannel[],
  chanListJoin: (chan_code: string | undefined) => void;
  chanListJoinPassWord: (chan_code: string | undefined, psswrd : string) => Promise<any>;
};

export const AllChan = (props: AllChanProps) => {
    const socket = useContext(SocketContext);

    const [chans, setChans] = useState<IChannel[]>([]);
    const [chansInv, setChansInv] = useState<IChannel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
      console.log("AllChan UseEffect");
        socket.emit(
            'channels_list',
            {},
             (data: IChannel[]) => {
                console.log(data);
                setChans(data);
                setChansInv(data.filter(channel => channel.invited.some(invitedUser => invitedUser.userId === props.user_me.id)));
                setLoading(false);
		    });
	},[props.chanList]);

	return (
		<div className="AllChan-wrapper">
            {loading &&
              <div className="spinner-container">
                <div className="loading-spinner">
                </div>
              </div>
            }
            {!loading && <h3 className='display-chan-title pixel-font'>All Chan</h3>}
            <div className='ChansOther-wrapper'>
              {chans?.filter(chan => {
                  if (chan.visibility === 'public' ||chan.visibility == 'password-protected')
                    return true;
                  return false
                })
                .map(chan => (
                  <ChansOther chan={chan} chanList={props.chanList} user_me={props.user_me} chanListJoin={props.chanListJoin} chanListJoinPassWord={props.chanListJoinPassWord}/>
                ))
              }
            </div>
            {!loading && <h3 className='display-chan-title pixel-font'>ban Chan</h3>}
            {chans?.map(chan => (
						  <ChansBan chan={chan} user_me={props.user_me}/>
					  ))}
            {/* <h3 className='display-chan-title pixel-font'>invit chan</h3>
            {chans?.map((channel: IChannel) => {
                channel.invited.map((invitedUser : IChannelInvitedUser) => {
                    if (invitedUser.user === props.user_me)
                      <ChansInv chan={channel} user_me={props.user_me} chanListJoin={props.chanListJoin}/>
                });
            })} */}
            {!loading && <h3 className='display-chan-title pixel-font'>invit chan</h3>}
            {chansInv?.map(chan => (
						    <ChansInv key={chan.id} chan={chan} chanList={props.chanList} user_me={props.user_me} chanListJoin={props.chanListJoin}/>
					  ))}
            {/* <h3 className='display-chan-title pixel-font'>invit chan</h3>
            {chans?.map(chan => (
						  <ChansInv chan={chan} user_me={props.user_me} chanListJoin={props.chanListJoin}/>
					  ))} */}
		</div>
	);
};

export default AllChan;
