import '../src/css/app.css';
import React from 'react';

import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Preferences from './components/Preferences/Preferences';
import Login from './components/Login/Login';
import Menu from './components/Menu/Menu';
import Home from './pages/Home';
import Friends from './pages/Friends';
import SearchGame from './pages/SearchGame';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Pong from './pages/Pong';
import { OtherUserProfile } from './pages/OtherUserProfile';
import NoUserFound from './pages/404';

function App() {
  // const [token, setToken] = useState();

  // if(!token) {
  //   return <Login setToken={setToken} />
  // }

  return (      
    <>
      <Menu />
      <Routes>
        <Route path="/" element={<Home /> } />
        <Route path="/friends" element={<Friends /> } />
        <Route path="/searchGame" element={<SearchGame /> } />
        <Route path="/stats" element={<Stats /> } />
        <Route path="/profile/:userId" element={<OtherUserProfile /> } />
        <Route path="/404" element={<NoUserFound /> } />
        <Route path="/settings" element={<Settings /> } />
        <Route path="/pong" element={<Pong /> } />
      </Routes>
    </>
  );
}

export default App;
