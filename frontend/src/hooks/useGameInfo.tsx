import { useContext } from 'react';
import GameInfoContext from '../context/GameInfoProvider';

const useGameInfo = () => {
	return useContext(GameInfoContext);
};

export default useGameInfo;
