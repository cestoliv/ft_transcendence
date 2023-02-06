import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { Switch } from '@syncfusion/ej2-react-buttons';
import '../../node_modules/@syncfusion/ej2-icons/styles/bootstrap.css';
import Button from '@mui/material/Button';
import React from 'react';
import { useState } from 'react';
import Checkbox from './Checkbox';

const defaultFormData = {
	mdp: '',
	body: '',
};

export default function Chat() {
	const [isCheckedA, setIsCheckedA] = useState(false);
	const [formData, SetFormData] = useState(defaultFormData);
	const { mdp, body } = formData;

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		SetFormData((prevState) => ({
			...prevState,
			[e.target.id]: e.target.value,
		}));
	};

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log(formData);

		SetFormData(defaultFormData);
	};

	const handleChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIsCheckedA(e.target.checked);
	};

	const toggleHidden = (event: any) => {
		const active_elem =
			document.getElementsByClassName('wrapper-settings')[0];
		if (active_elem) active_elem.classList.toggle('hidden');
	};

	return (
		<div className="chat-nav">
			<span>nom de la conv</span>
			<div className="chat-nav-right">
				<div className="wrapper-settings hidden">
					<Checkbox
						handleChange={handleChangeA}
						isChecked={isCheckedA}
						label="Private"
					/>
					<form className="mpd-form" onSubmit={(e) => onSubmit(e)}>
						<label htmlFor="mdp" id="mdp-label">
							mdp
						</label>
						<input
							type="text"
							id="mdp"
							value={mdp}
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
