import React, { useState } from 'react';
import { Select } from 'antd';

type SearchSettingsProps = {
	setMode: React.Dispatch<React.SetStateAction<string>>;
	setTime: React.Dispatch<React.SetStateAction<string>>;
	setPoints: React.Dispatch<React.SetStateAction<string>>;
};

export const SearchSettings = ({ setMode, setTime, setPoints }: SearchSettingsProps) => {
	const modeOptions = [
		{ value: 'classic', label: 'Classic' },
		{ value: 'hardcore', label: 'Hardcore' },
	];
	const timeOptions = [
		{ value: '1', label: '1 min' },
		{ value: '2', label: '2 min' },
		{ value: '3', label: '3 min' },
	];
	const pointsOptions = [
		{ value: '5', label: '5 points' },
		{ value: '10', label: '10 points' },
		{ value: '30', label: '30 points' },
		{ value: null, label: 'No limit' },
	];
	return (
		<div className="searchGame-settings">
			<p>Mode</p>
			<Select defaultValue="Classic" onChange={(value: string) => setMode(value)} options={modeOptions} />
			<p>Time</p>
			<Select defaultValue="Hardcore" onChange={(value: string) => setTime(value)} options={timeOptions} />
			<p>Points</p>
			<Select defaultValue="5 points" onChange={(value: string) => setPoints(value)} options={pointsOptions} />
		</div>
	);
};
