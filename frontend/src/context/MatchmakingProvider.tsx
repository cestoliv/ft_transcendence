import React, { createContext, useState, ReactNode } from 'react';

interface IMatchmakingContext {
	inMatchmaking: boolean;
	setInMatchmaking: (inMatchmaking: boolean) => void;
}

const MatchmakingContext = createContext<IMatchmakingContext>({} as IMatchmakingContext);

interface MatchmakingProviderProps {
	children: ReactNode;
}

export const MatchmakingProvider = ({ children }: MatchmakingProviderProps) => {
	const [inMatchmaking, setInMatchmaking] = useState<boolean>(false);
	return (
		<MatchmakingContext.Provider value={{ inMatchmaking, setInMatchmaking }}>
			{children}
		</MatchmakingContext.Provider>
	);
};

export default MatchmakingContext;
