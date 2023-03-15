import { useContext } from 'react';
import MatchmakingContext from '../context/MatchmakingProvider';

const useMatchmaking = () => {
	const { inMatchmaking } = useContext(MatchmakingContext);
	return useContext(MatchmakingContext);
};

export default useMatchmaking;
