import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { AuthProvider } from './context/AuthProvider';
import { GameInfoProvider } from './context/GameInfoProvider';
import { MatchmakingProvider } from './context/MatchmakingProvider';

declare global {
	interface Window {
		socket?: Socket<DefaultEventsMap, DefaultEventsMap>;
	}
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<BrowserRouter>
		<AuthProvider>
			<MatchmakingProvider>
				<GameInfoProvider>
					<App />
				</GameInfoProvider>
			</MatchmakingProvider>
		</AuthProvider>
	</BrowserRouter>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
