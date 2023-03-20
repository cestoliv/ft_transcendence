import React, { useEffect, useRef } from 'react';

type SearchSettingsProps = {
	// setVisibility: React.Dispatch<React.SetStateAction<string>>;
	setMode: React.Dispatch<React.SetStateAction<string>>;
	setTime: React.Dispatch<React.SetStateAction<string>>;
	setPoints: React.Dispatch<React.SetStateAction<string>>;
	createGame: () => void;
};

export const SearchSettings = ({ setMode, setTime, setPoints, createGame }: SearchSettingsProps) => {
	// const visibilityOptions = [
	// 	{ value: 'public', label: 'Public' },
	// 	{ value: 'private', label: 'Private' },
	// ];
	const searchSettingsRef = useRef<HTMLDivElement>(null);
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

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				searchSettingsRef.current &&
				searchSettingsRef.current.classList.contains('active-searchGame-settings') &&
				!searchSettingsRef.current.contains(event.target as Node)
			) {
				searchSettingsRef.current.classList.remove('active-searchGame-settings');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [searchSettingsRef]);

	return (
		<div className="searchGame-settings slide-left" ref={searchSettingsRef}>
			<p className="create-title">Create a game</p>
			{/* <label htmlFor="visibility_select">Visibility</label>
			<div className="nes-select is-dark">
				<select
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVisibility(e.target.value)}
					required
					id="visibility_select"
				>
					{visibilityOptions.map((option) => {
						return (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						);
					})}
				</select>
			</div> */}
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
			<button className="searchButton nes-btn is-primary" onClick={createGame}>
				GO
			</button>
		</div>
	);
};
