import React from 'react';

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
		{ value: 'null', label: 'No limit' },
	];
	return (
		<div className="searchGame-settings">
			<label htmlFor="mode_select">Mode</label>
			<div className="nes-select is-dark">
				<select
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMode(e.target.value)}
					required
					id="mode_select"
				>
					{modeOptions.map((option) => {
						return (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						);
					})}
				</select>
			</div>
			{/* <Select defaultValue="Classic" onChange={(value: string) => setMode(value)} options={modeOptions} /> */}
			<label htmlFor="time-select">Time</label>
			<div className="nes-select is-dark">
				<select
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTime(e.target.value)}
					required
					id="time_select"
				>
					{timeOptions.map((option) => {
						return (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						);
					})}
				</select>
			</div>
			{/* <Select defaultValue="Hardcore" onChange={(value: string) => setTime(value)} options={timeOptions} /> */}
			<label htmlFor="points_select">Points</label>
			<div className="nes-select is-dark">
				<select
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPoints(e.target.value)}
					required
					id="points_select"
				>
					{pointsOptions.map((option) => {
						return (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						);
					})}
				</select>
			</div>
			{/* <Select defaultValue="5 points" onChange={(value: string) => setPoints(value)} options={pointsOptions} /> */}
		</div>
	);
};