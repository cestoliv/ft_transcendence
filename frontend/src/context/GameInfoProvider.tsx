import React, { createContext, useState, ReactNode } from 'react';
import { ILocalGameInfo } from '../interfaces';

interface IGameInfoContext {
	gameInfo: ILocalGameInfo | null;
	setGameInfo: (gameInfo: ILocalGameInfo | null) => void;
}

const GameInfoContext = createContext<IGameInfoContext>({} as IGameInfoContext);

interface GameInfoProviderProps {
	children: ReactNode;
}

export const GameInfoProvider = ({ children }: GameInfoProviderProps) => {
	const [gameInfo, setGameInfo] = useState<ILocalGameInfo | null>(null);
	return <GameInfoContext.Provider value={{ gameInfo, setGameInfo }}>{children}</GameInfoContext.Provider>;
};

export default GameInfoContext;
