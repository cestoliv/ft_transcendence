import React, { useState, useEffect } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined, CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';
import { BsFillVolumeMuteFill } from 'react-icons/bs';
import { GoUnmute } from 'react-icons/go';
import { IMusic } from '../components/IMusic';
import { IPlayList } from '../components/IPlayList';

import qala from '../assets/boop.mp3';
import what_you_love from '../assets/what_you_love.mp3';
import sparks from '../assets/sparks.mp3';
import life_is_a_game from '../assets/life_is_a_game.mp3';
import Ryu_stage from '../assets/Ryu_stage.mp3';
import Bomb_Jack from '../assets/Bomb_Jack.mp3';

export default function MusicPlayer() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(0.2);
	const [activePlayList, setActivePlayList] = useState<number>(0);
	const [activeMusic, setActiveMusic] = useState<number>(0);
	const [alreadyStarted, setAlreadyStarted] = useState<boolean>(false);
	const [muted, setMuted] = useState<boolean>(false);

	const musicList: IMusic[] = [
		{ id: 1, title: 'Enzalla - Rose', url: qala },
		{ id: 2, title: 'c4c - What you love', url: what_you_love },
		{ id: 3, title: 'Mr Hong & Pastels - Sparks', url: sparks },
		{ id: 4, title: 'Pastels - Life is a game', url: life_is_a_game },
	];

	const arcadeMusicList: IMusic[] = [
		{ id: 1, title: 'Street Fighter 2 - Ryu stage', url: Ryu_stage },
		{ id: 2, title: 'Bomb Jack - Level Theme', url: Bomb_Jack },
	];

	const playList: IPlayList[] = [
		{ id: 1, title: 'Chill', music_list: musicList },
		{ id: 2, title: 'Arcade', music_list: arcadeMusicList },
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
		const audio = document.getElementById('audio') as HTMLAudioElement;
		if (muted) {
			const volume = parseFloat('0.2');
			audio.volume = volume;
			setVolume(volume);
		} else {
			const volume = parseFloat('0');
			audio.volume = volume;
			setVolume(volume);
		}
		setMuted(!muted);
	};

	const lastMusic = () => {
		if (activeMusic - 1 < 0) setActiveMusic(playList[activePlayList].music_list.length - 1);
		else setActiveMusic(activeMusic - 1);
		setIsPlaying(false); // Arrête la lecture
	};

	const nextMusic = () => {
		if (activeMusic + 1 >= playList[activePlayList].music_list.length) setActiveMusic(0);
		else setActiveMusic(activeMusic + 1);
		setIsPlaying(false); // Arrête la lecture
	};

	const handleEnded = () => {
		if (activeMusic === playList[activePlayList].music_list.length - 1) {
			setActiveMusic(0);
		} else {
			setActiveMusic(activeMusic + 1);
		}
		setIsPlaying(false);
	};

	const switchPlaylist = (event: any) => {
		const id = event.target.getAttribute('data-id');
		setActiveMusic(0); // Ajout de cette ligne pour définir la première musique de la nouvelle playlist
		setActivePlayList(id - 1);
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
			audio.src = playList[activePlayList].music_list[activeMusic].url;
			audio.load();
			audio.play();
			setIsPlaying(true);
		}
	}, [activeMusic, activePlayList]);

	useEffect(() => {
		if (alreadyStarted) {
			const audio = document.getElementById('audio') as HTMLAudioElement;
			audio.volume = volume;
		}
	}, [volume]);

	return (
		<div className="music-modal-hidden music-player" id="music-player">
			<h2>{playList[activePlayList].title}</h2>
			<span>{playList[activePlayList].music_list[activeMusic].title}</span>
			<div className="sound">
				{muted ? (
					<BsFillVolumeMuteFill
						style={{ fontSize: '30px', color: '#FDCA40', marginRight: '2px' }}
						onClick={toggleMute}
					/>
				) : (
					<GoUnmute style={{ fontSize: '30px', color: '#02C39A', marginRight: '2px' }} onClick={toggleMute} />
				)}
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={volume}
					onChange={handleVolumeChange}
					className="volume-input"
				/>
			</div>
			<audio id="audio" autoPlay onEnded={handleEnded}>
				<source src={playList[activePlayList].music_list[activeMusic].url} type="audio/mpeg" />
			</audio>
			<div className="music-player-settings">
				<CaretLeftOutlined style={{ fontSize: '30px', color: '#00A896' }} onClick={lastMusic} />
				{isPlaying ? (
					<PauseCircleOutlined style={{ fontSize: '30px', color: '#FDCA40' }} onClick={togglePlay} />
				) : (
					<PlayCircleOutlined style={{ fontSize: '30px', color: '#02C39A' }} onClick={togglePlay} />
				)}
				<CaretRightOutlined style={{ fontSize: '30px', color: '#00A896' }} onClick={nextMusic} />
			</div>
			<div className="playlists">
				<button className="playList-btn nes-btn is-primary" onClick={switchPlaylist} data-id={playList[0].id}>
					{playList[0].title}
				</button>
				<button className="playList-btn nes-btn is-primary" onClick={switchPlaylist} data-id={playList[1].id}>
					{playList[1].title}
				</button>
			</div>
		</div>
	);
}
