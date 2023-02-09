import React, { ChangeEvent, useEffect, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Checkbox from './Checkbox';

import { SocketContext } from '../context/socket';

import { IChannel, IUser } from '../interfaces';

const defaultFormData = {
	mdp: '',
	body: '',
};

type ChatProps = {
	user_me : IUser,
	activeConvId : number | undefined,
};

export default function Chat(props: ChatProps) {

	const socket = useContext(SocketContext);

	const [isCheckedA, setIsCheckedA] = useState(false);
	const [visibility, setVisibility] = useState<string>("public");
	const [formData, SetFormData] = useState(defaultFormData);
	// const { mdp, body } = formData;
	const [chan, setChan] = useState<IChannel | null>(null);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		SetFormData((prevState) => ({
			...prevState,
			[e.target.id]: e.target.value,
		}));
	};

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		SetFormData(defaultFormData);
	};

	const changeData = () => {
		try {
			socket.emit(
				'channels_findOne',
				{
					id: props.activeConvId,
				},
				(data: any) => {
					// console.log("fdeda");
					setChan(data);
				},
			);
		} catch (error) {
			alert(error);
		}	
	}

	const isChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
		// setIsCheckedA(e.target.checked);
		if (chan && chan.visibility === "public")
		{
			console.log("buzz2 : " + chan.id);
			// console.log("dezdze : " + props.activeConvId);
			socket.emit(
				'channels_setVisibility',
				{
					id: chan.id,
					visibility: 'private',
				},
				(data: any) => {
					if (data.message)
							alert(data.errors);
					else
					{
						console.log("set chan dzfdzf : ");
						setChan(data);
					}
				},
			);
		}
		else {
			console.log("buzz3");
			socket.emit(
				'channels_setVisibility',
				{
					id: chan?.id,
					visibility: 'public',
				},
				(data: any) => {
					if (data.message)
							alert(data.errors);
					else
						setChan(data);
				},
			);
		}
		console.log("bueeeee : " + chan?.visibility);
		// changeData();
	};

	const toggleHidden = (event: any) => {
		const active_elem =
			document.getElementsByClassName('wrapper-settings')[0];
		if (active_elem) active_elem.classList.toggle('hidden');
	};

	const isOwner = (): boolean => {
        if (props.user_me.id === chan?.owner.id)
			return true;
		return false;
    }

	useEffect(() => {
		// socket.emit(
		// 	'channels_setVisibility',
		// 	{
		// 		id: props.activeConvId,
		// 		visibility: 'private',
		// 	},
		// 	(data: any) => {
		// 		// console.log("pooipo");
		// 	},
		// );
		socket.emit(
			'channels_findOne',
			{
				id: props.activeConvId,
			},
			(data: any) => {
				if (data.message)
					alert(data.errors);
				else
					setChan(data);
			},
		);
		// console.log("bueeeee : " + chan?.visibility);
	}, [chan]);

	return (
		<div className="chat-wrapper">
			<div className="chat-nav">
				<span>{chan ? `${chan.name} #${chan.code}` : 'Unknown channel'}</span>
				{isOwner() && (
					<div className="chat-nav-right">
						<div className="wrapper-settings hidden">
							<Checkbox
								handleChange={isChecked}
								isChecked={chan ? (chan.visibility === 'public' ? false : true) : false}
								label="Private"
							/>
							<form className="mpd-form" onSubmit={(e) => onSubmit(e)}>
								<label htmlFor="mdp" id="mdp-label">
									mdp
								</label>
								<input
									type="text"
									id="mdp"
									value={""}
									onChange={(e) => onChange(e)}
								/>
								<button type="submit" id="mdp-submit-button">
									Change
								</button>
							</form>
						</div>
						<span
							onClick={toggleHidden}
							className="e-icons e-large e-settings"
						></span>
					</div>
				)}
			</div>
			<div className="chat-messages"></div>
			<div className="write-message"></div>
		</div>
	);
}
