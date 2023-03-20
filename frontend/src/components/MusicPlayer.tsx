import React, { useState, useEffect } from 'react';

import '../css/music-player.scss';

export default function MusicPlayer() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(0.2);
	const [activePlayList, setActivePlayList] = useState<number>(0);
	const [activeMusic, setActiveMusic] = useState<number>(0);
	const [alreadyStarted, setAlreadyStarted] = useState<boolean>(false);
	const [muted, setMuted] = useState<boolean>(false);

	interface IMusic {
		id: number;
		title: string;
		url: string;
	}

	interface IPlayList {
		id: number;
		title: string;
		music_list: IMusic[];
	}

	const musicList: IMusic[] = [
		{ id: 1, title: 'Enzalla - Rose', url: `${process.env.REACT_APP_FRONTEND_URL}/sounds/boop.mp3` },
		{ id: 2, title: 'c4c - What you love', url: `${process.env.REACT_APP_FRONTEND_URL}/sounds/what_you_love.mp3` },
		{ id: 3, title: 'Mr Hong & Pastels - Sparks', url: `${process.env.REACT_APP_FRONTEND_URL}/sounds/sparks.mp3` },
		{
			id: 4,
			title: 'Pastels - Life is a game',
			url: `${process.env.REACT_APP_FRONTEND_URL}/sounds/life_is_a_game.mp3`,
		},
	];

	const arcadeMusicList: IMusic[] = [
		{
			id: 1,
			title: 'Street Fighter 2 - Ryu stage',
			url: `${process.env.REACT_APP_FRONTEND_URL}/sounds/Ryu_stage.mp3`,
		},
		{ id: 2, title: 'Bomb Jack - Level Theme', url: `${process.env.REACT_APP_FRONTEND_URL}/sounds/Bomb_Jack.mp3` },
	];

	const playList: IPlayList[] = [
		{ id: 1, title: 'Chill', music_list: musicList },
		{ id: 2, title: 'Arcade', music_list: arcadeMusicList },
	];

	const togglePlay = () => {
		const audio = document.getElementById('audio') as HTMLAudioElement;
		if (!alreadyStarted) {
			audio.play();
			setIsPlaying(!isPlaying);
			setAlreadyStarted(true);
		} else {
			if (isPlaying) {
				audio.pause();
			} else {
				audio.play();
			}
			setIsPlaying(!isPlaying);
		}
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
		if (id == playList[activePlayList].id) return;
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

	const closeMusicPlayer = () => {
		const modal = document.getElementById('music-modal');
		modal?.classList.add('hidden');
	};

	const stopPropagation = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		event.stopPropagation();
	};

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
		<div className="music-modal-overlay hidden" id="music-modal" onClick={closeMusicPlayer}>
			<div className="music-player modal" id="music-player" onClick={stopPropagation}>
				<h2>{playList[activePlayList].title}</h2>
				<span>{playList[activePlayList].music_list[activeMusic].title}</span>
				<audio id="audio" onEnded={handleEnded}>
					<source src={playList[activePlayList].music_list[activeMusic].url} type="audio/mpeg" />
				</audio>
				<div className="music-player-settings">
					<button onClick={lastMusic}>
						<img src="/icons/next.png" alt="previous" />
					</button>
					{isPlaying ? (
						<button onClick={togglePlay}>
							<img src="/icons/pause.png" alt="pause" />
						</button>
					) : (
						<button onClick={togglePlay}>
							<img src="/icons/play.png" alt="play" />
						</button>
					)}
					<button onClick={nextMusic}>
						<img src="/icons/next.png" alt="next" />
					</button>
				</div>
				<div className="playlists">
					<button
						className="playList-btn nes-btn is-primary"
						onClick={switchPlaylist}
						data-id={playList[0].id}
					>
						{playList[0].title}
					</button>
					<button
						className="playList-btn nes-btn is-primary"
						onClick={switchPlaylist}
						data-id={playList[1].id}
					>
						{playList[1].title}
					</button>
				</div>
				<div className="sound">
					{muted ? (
						<button onClick={toggleMute}>
							<img src="/icons/mute.png" alt="mute" />
						</button>
					) : (
						<button onClick={toggleMute}>
							<img src="/icons/speaker.png" alt="volume" />
						</button>
					)}
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={volume}
						onChange={handleVolumeChange}
						className="volume-input slider nes-btn"
					/>
				</div>
			</div>
		</div>
	);
}
