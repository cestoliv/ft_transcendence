import React from 'react';
import 'reactjs-popup/dist/index.css';

import { IUserFriend } from '../interfaces';

type FriendRequestsProps = {
	friend_request: IUserFriend;
	accept_friend_request: (inviter_id: number) => void;
	refuse_friend_request: (inviter_id: number) => void;
};

export const FriendRequests = (props: FriendRequestsProps) => {
	const accept_friend_requestClick = (): void => {
		props.accept_friend_request(props.friend_request.inviter.id);
	};

	const refuse_friend_request = (): void => {
		props.refuse_friend_request(props.friend_request.inviter.id);
	};

	return (
		<div className="FriendRequests-wrapper modal-item">
			<span className="pixel-font">{props.friend_request.inviter.username}</span>
			<div className="accept-refuse-friend-request">
				<span className="e-icons e-medium e-plus modal-e-plus" onClick={accept_friend_requestClick}></span>
				<span className="e-icons e-medium e-close modal-e-close" onClick={refuse_friend_request}></span>
			</div>
		</div>
	);
};

export default FriendRequests;
