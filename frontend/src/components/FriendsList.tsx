import React, { ChangeEvent, useEffect, useContext, useState } from 'react';
import 'reactjs-popup/dist/index.css';
import Friend from './Friend';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

import users from '../mock-data/users';

type PersonListProps = {
	activeConv: (even: React.MouseEvent<HTMLDivElement>) => void;
};

export const FriendsList = (props: PersonListProps) => {
	const socket = useContext(SocketContext);

	let [user1, setUser1] = useState<IUser>();
	let [user2, setUser2] = useState<IUser>();

	useEffect(() => {
        socket.emit(
            'users_get',
            {
                id: 12,
            },
            (data: any) => {
                if (data.messages)
						alert(data.messages);
                else
                    setUser1(data);
            },
        );
		socket.emit(
            'users_get',
            {
                id: 13,
            },
            (data: any) => {
                if (data.messages)
						alert(data.messages);
                else
                    setUser2(data);
            },
        );
	},[user1, user2]);

	return (
		<div className="friendsList-wrapper">
			{/* {users.map((user) => (
				<Friend
					key={user.idd}
					name={user.pseudo}
					states={user.states}
					idd={user.idd}
					activeConv={props.activeConv}
				/>
			))} */}
			{user1 ? (
					<Friend key={user1.id} user={user1} activeConv={props.activeConv}
				/>
				) : null}
			{user2 ? (
					<Friend key={user2.id} user={user2} activeConv={props.activeConv}
				/>
				) : null}
		</div>
	);
};

export default FriendsList;
