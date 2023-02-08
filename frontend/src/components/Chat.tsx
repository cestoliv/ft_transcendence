import React, { ChangeEvent, useEffect, useContext, useState } from 'react';

import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Checkbox from './Checkbox';

import { SocketContext } from '../context/socket';

const defaultFormData = {
	mdp: '',
	body: '',
};

type ChatProps = {
	activeConvId : number | undefined,
};

export default function Chat(props: ChatProps) {

	const socket = useContext(SocketContext);

	const [isCheckedA, setIsCheckedA] = useState(false);
	const [visibility, setVisibility] = useState<string>("public");
	const [formData, SetFormData] = useState(defaultFormData);
	// const { mdp, body } = formData;
	const [chan, setChan] = useState<any>([]);

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
		console.log(chan.visibility);
	}

	const isChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
		// setIsCheckedA(e.target.checked);
		if (chan.visibility === "public")
		{
			// console.log("buzz2 : " + chan.id);
			socket.emit(
				'channels_setVisibility',
				{
					id: props.activeConvId,
					visibility: 'private',
				},
				(data: any) => {
					console.log("pooipo");
				},
			);
		}
		else {
			// console.log("buzz3");
			socket.emit(
				'channels_setVisibility',
				{
					id: props.activeConvId,
					visibility: 'public',
				},
				(data: any) => {
					
				},
			);
		}
		changeData();
	};

	const toggleHidden = (event: any) => {
		const active_elem =
			document.getElementsByClassName('wrapper-settings')[0];
		if (active_elem) active_elem.classList.toggle('hidden');
	};

	useEffect(() => {
		socket.emit(
			'channels_setVisibility',
			{
				id: props.activeConvId,
				visibility: 'private',
			},
			(data: any) => {
				// console.log("pooipo");
			},
		);
		try {
			socket.emit(
				'channels_findOne',
				{
					id: props.activeConvId,
				},
				(data: any) => {
					setChan(data);
				},
			);
		} catch (error) {
			alert(error);
		}
	}, [chan]);

	return (
		<div className="chat-nav">
			<span>{chan.name}</span>
			<div className="chat-nav-right">
				<div className="wrapper-settings hidden">
					<Checkbox
						handleChange={isChecked}
						isChecked={chan.visibility === 'public' ? false : true}
						label="Private"
					/>
					<form className="mpd-form" onSubmit={(e) => onSubmit(e)}>
						<label htmlFor="mdp" id="mdp-label">
							mdp
						</label>
						<input
							type="text"
							id="mdp"
							value={chan.password}
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
		</div>
	);
}
