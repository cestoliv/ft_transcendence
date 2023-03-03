import React, { createContext, useState, ReactNode } from 'react';
import { ILocalGameInfo } from '../interfaces';

const GameInfoContext = createContext({
    gameInfo: {} as ILocalGameInfo,
    setGameInfo: () => { },
})

interface GameInfoProviderProps {
    children: ReactNode;
}

export const GameInfoProvider = ({ children }: GameInfoProviderProps) => {
    const [gameInfo, setGameInfo] = useState({} as ILocalGameInfo);
    return <GameInfoContext.Provider value={{ gameInfo, setGameInfo }}>{children}</GameInfoContext.Provider>;
};

export default GameInfoContext;