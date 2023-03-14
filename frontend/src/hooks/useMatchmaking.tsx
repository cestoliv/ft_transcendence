import { useContext } from 'react';
import MatchmakingContext from '../context/MatchmakingProvider';

const useMatchmaking = () => {
	const { matchmaking } = useContext(MatchmakingContext);
	return useContext(MatchmakingContext);
};

export default useMatchmaking;
