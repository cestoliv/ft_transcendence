import React, { useState, useRef, useEffect } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined, CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';
import { BsFillVolumeMuteFill } from 'react-icons/bs';
import { GoUnmute } from 'react-icons/go';
import { IMusic } from '../components/IMusic';
import qala from '../assets/boop.mp3';
import what_you_love from '../assets/what_you_love.mp3';

export default function MusicPlayer() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(0.2);
	const [activeMusic, setActiveMusic] = useState<number>(0);
	const [alreadyStarted, setAlreadyStarted] = useState<boolean>(false);
	const [muted, setMuted] = useState<boolean>(false);

	const musicList: IMusic[] = [
		{ id: 1, title: 'qala', url: qala },
		{ id: 2, title: 'c4c - What you love', url: what_you_love },
	];

	const togglePlay = () => {
		const audio = document.getElementById('audio') as HTMLAudioElement;

		if (isPlaying) {
			audio.pause();
		} else {
			audio.play();
		}

		setIsPlaying(!isPlaying);
	};

	const toggleMute = () => {
		if (muted) {
			const audio = document.getElementById('audio') as HTMLAudioElement;
			audio.volume = 0.2;
			setVolume(volume);
			setMuted(false);
		} else {
			const audio = document.getElementById('audio') as HTMLAudioElement;
			audio.volume = 0;
			setVolume(volume);
			setMuted(true);
		}
	};

	const lastMusic = () => {
		if (activeMusic - 1 < 0) setActiveMusic(musicList.length - 1);
		else setActiveMusic(activeMusic - 1);
		setIsPlaying(false); // Arrête la lecture
	};

	const nextMusic = () => {
		if (activeMusic + 1 >= musicList.length) setActiveMusic(0);
		else setActiveMusic(activeMusic + 1);
		setIsPlaying(false); // Arrête la lecture
	};

	const handleEnded = () => {
		if (activeMusic === musicList.length - 1) {
			setActiveMusic(0);
		} else {
			setActiveMusic(activeMusic + 1);
		}
		setIsPlaying(false);
	};

	const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const audio = document.getElementById('audio') as HTMLAudioElement;
		const volume = parseFloat(event.target.value);
		if (volume === 0) setMuted(true);
		else if (muted) setMuted(false);

		audio.volume = volume;
		setVolume(volume);
	};

	useEffect(() => {
		setTimeout(() => {
			const audio = document.getElementById('audio') as HTMLAudioElement;
			audio.play();
			setIsPlaying(!isPlaying);
			setAlreadyStarted(true);
		}, 2000);
	}, []);

	useEffect(() => {
		if (alreadyStarted) {
			const audio = document.getElementById('audio') as HTMLAudioElement;
			audio.volume = volume;
			audio.src = musicList[activeMusic].url;
			audio.load();
			audio.play();
			setIsPlaying(true);
		}
	}, [activeMusic]);

	return (
		<div className="music-modal-hidden music-player" id="music-player">
			<span>{musicList[activeMusic].title}</span>
			<div className="sound">
				{muted ? (
					<BsFillVolumeMuteFill
						style={{ fontSize: '30px', color: '#209cee', marginRight: '2px' }}
						onClick={toggleMute}
					/>
				) : (
					<GoUnmute style={{ fontSize: '30px', color: '#209cee', marginRight: '2px' }} onClick={toggleMute} />
				)}
				<input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} />
			</div>
			<audio id="audio" autoPlay loop onEnded={handleEnded}>
				<source src={musicList[activeMusic].url} type="audio/mpeg" />
			</audio>
			<div className="music-player-settings">
				<CaretLeftOutlined style={{ fontSize: '30px', color: '#209cee' }} onClick={lastMusic} />
				{isPlaying ? (
					<PauseCircleOutlined style={{ fontSize: '30px', color: '#209cee' }} onClick={togglePlay} />
				) : (
					<PlayCircleOutlined style={{ fontSize: '30px', color: '#209cee' }} onClick={togglePlay} />
				)}
				<CaretRightOutlined style={{ fontSize: '30px', color: '#209cee' }} onClick={nextMusic} />
			</div>
		</div>
	);
}
