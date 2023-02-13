import React, { ChangeEvent, useEffect, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Checkbox from './Checkbox';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import FriendConvMessages from './FriendConvMessages'

type FriendConvProps = {
	user_me : IUser,
	activeConvId : number,
};

export default function FriendConv(props: FriendConvProps) {

	const socket = useContext(SocketContext);

	const [passWord, setPassWord] = useState<string>('');
	const [message, setMessage] = useState<string>('');
	const [chan, setChan] = useState<IChannel | null>(null);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.name === 'password-input')
			setPassWord(event.target.value);
		if (event.target.name === 'message-input')
			setMessage(event.target.value);
	};
	  
	const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
        console.log("hello 78");
        console.log(message);
        console.log(props.activeConvId);
        event.preventDefault();
		if (message != '')
		{
            console.log("hello789");
			socket.emit(
				'users_sendMessage',
				{
					id : props.activeConvId,
					message : message,
				},
				(data: any) => {
                    if (data.messages)
						alert(data.messages);
                    else
                    {
                        console.log("hello 546");
                        console.log(data);
                        setMessage('');
                    }	
				},
			);
		}
    };

	useEffect(() => {

		socket.emit(
            'users_get',
            {
                id : props.activeConvId,
            },
            (data: any) => {
                if (data.messages)
                    alert(data.messages);
                else
                {
                    console.log('hello 555');
                    console.log(data);
                }	
            },
        );
	}, []);

	return (
		<div className="chat-wrapper">
			<FriendConvMessages user_me={props.user_me} chan_id={props.activeConvId}/>
			<form className="write-message" onSubmit={submitMessage}>
					<input
						value={message}
						name='message-input'
						id='message-input'
						type='message'
						placeholder='Message'
						onChange={handleChange}
						required
						/>
			</form>
		</div>
	);
}
