import React from 'react';
import '../../css/app.css';
import { Link } from 'react-router-dom';

export default function Login() {
  return(
    <div className="login-wrapper">
      <h1>Please Log In</h1>
      <Link to="//http://api.transcendence.local/api/v1/auth/login">
        <button className='login-button'>Log in with intra42</button>
      </Link>
    </div>
  )
}