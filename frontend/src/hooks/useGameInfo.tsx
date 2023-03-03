import { useContext } from 'react';
import GameInfoContext from '../context/GameInfoProvider';

const useGameInfo = () => {
    const { gameInfo } = useContext(GameInfoContext);
    return useContext(GameInfoContext);
}

export default useGameInfo;