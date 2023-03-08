import React, { createContext, useState, ReactNode } from 'react';
import { ILocalGameInfo } from '../interfaces';

const GameInfoContext = createContext({
	// Local game info + isWatching
	gameInfo: {} as (ILocalGameInfo & { isWatching: boolean }) | null,
	setGameInfo: (gameInfo: (ILocalGameInfo & { isWatching: boolean }) | null) => {
		// Empty
	},
});

interface GameInfoProviderProps {
	children: ReactNode;
}

export const GameInfoProvider = ({ children }: GameInfoProviderProps) => {
	const [gameInfo, setGameInfo] = useState(null as ILocalGameInfo);
	return <GameInfoContext.Provider value={{ gameInfo, setGameInfo }}>{children}</GameInfoContext.Provider>;
};

export default GameInfoContext;
