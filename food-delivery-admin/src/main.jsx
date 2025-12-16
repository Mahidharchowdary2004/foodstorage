import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import Login from './Login.jsx';

function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (in a real app, you would check for a valid token)
    // const token = localStorage.getItem('adminToken');
    // if (token) {
    //   setIsLoggedIn(true);
    // }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Remove token from localStorage (in a real app)
    // localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
  };

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <App onLogout={handleLogout} />
        </div>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <Main />
);