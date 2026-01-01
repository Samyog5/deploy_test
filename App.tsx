import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import Background from './components/Background';
import SpinWheelPage from './components/SpinWheelPage';
import AdminPanel from './components/AdminPanel';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : '';

// Session Constants
const ADMIN_SESSION_LIMIT = 20 * 60 * 1000; // 20 minutes
const PLAYER_SESSION_LIMIT = 24 * 60 * 60 * 1000; // 24 hours

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('emerald_user');
  }, []);

  const handleUpdateUser = useCallback((userData: User) => {
    // If we're updating user data but they don't have a loginTimestamp, 
    // it's a new login or a legacy account sync.
    const updatedData = {
      ...userData,
      loginTimestamp: userData.loginTimestamp || Date.now()
    };
    setUser(updatedData);
    localStorage.setItem('emerald_user', JSON.stringify(updatedData));
  }, []);

  // SESSION MONITORING LOGIC
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const now = Date.now();
      const sessionAge = now - (user.loginTimestamp || 0);
      const limit = user.isAdmin ? ADMIN_SESSION_LIMIT : PLAYER_SESSION_LIMIT;

      if (sessionAge > limit) {
        console.warn(`[SECURITY] Session expired for ${user.isAdmin ? 'Admin' : 'Player'}`);
        setSessionError(`Your ${user.isAdmin ? 'Admin' : 'Player'} session has expired for security.`);
        handleLogout();
      }
    };

    // Initial check
    checkSession();

    // Background monitor (runs every 30 seconds)
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [user, handleLogout]);

  const refreshUser = useCallback(async (email: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/profile/${email}`);
      if (response.ok) {
        const serverData = await response.json();

        // When refreshing, we MUST preserve the original loginTimestamp to honor session limits
        const existingUser = JSON.parse(localStorage.getItem('emerald_user') || '{}');
        const updatedUser = {
          ...serverData,
          isLoggedIn: true,
          loginTimestamp: existingUser.loginTimestamp || Date.now()
        };
        handleUpdateUser(updatedUser);
      }
    } catch (err) {
      console.warn("Sync failed, using offline vault data.");
    }
  }, [handleUpdateUser]);

  useEffect(() => {
    const savedUser = localStorage.getItem('emerald_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        // Immediate expiration check on load
        const now = Date.now();
        const limit = parsedUser.isAdmin ? ADMIN_SESSION_LIMIT : PLAYER_SESSION_LIMIT;
        if (now - (parsedUser.loginTimestamp || 0) > limit) {
          localStorage.removeItem('emerald_user');
          setSessionError("Previous session expired.");
          return;
        }

        setUser(parsedUser);
        if (parsedUser.email) {
          refreshUser(parsedUser.email);
        }
      } catch (e) {
        localStorage.removeItem('emerald_user');
      }
    }
  }, [refreshUser]);

  return (
    <div className="min-h-screen w-full relative font-sans text-slate-800">
      <Background />
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                user.isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />
              ) : (
                <LoginForm
                  onLogin={handleUpdateUser}
                // Pass session error to login form if you want to display it there
                />
              )
            }
          />
          <Route
            path="/dashboard"
            element={user ? (user.isAdmin ? <Navigate to="/admin" /> : <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onRefresh={() => refreshUser(user.email)} />) : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={user?.isAdmin ? <AdminPanel admin={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/lucky-spin"
            element={user ? <SpinWheelPage user={user} onUpdateUser={handleUpdateUser} onRefresh={() => refreshUser(user.email)} /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </HashRouter>
    </div>
  );
};

export default App;