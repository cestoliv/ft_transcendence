import { useContext } from 'react';
import MatchmakingContext from '../context/MatchmakingProvider';

const useMatchmaking = () => {
	return useContext(MatchmakingContext);
};

export default useMatchmaking;
