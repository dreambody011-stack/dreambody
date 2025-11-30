import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PublicHome from './components/PublicHome';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import * as Storage from './services/storage';
import { ViewState, User } from './types';

function App() {
  const [view, setView] = useState<ViewState>('PUBLIC');
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    // Initialize storage defaults
    Storage.initStorage();

    // Check session
    const session = Storage.getSession();
    if (session) {
      if (session.type === 'ADMIN') {
        setView('ADMIN');
      } else if (session.type === 'CLIENT' && session.userId) {
        const user = Storage.getUser(session.userId);
        if (user) {
          setCurrentUser(user);
          setView('CLIENT');
        } else {
          Storage.clearSession(); // Invalid user in session
        }
      }
    }
  }, []);

  const handleLogin = (role: 'ADMIN' | 'CLIENT', userId?: string) => {
    Storage.setSession(role, userId);
    if (role === 'ADMIN') {
      setView('ADMIN');
    } else if (role === 'CLIENT' && userId) {
      const user = Storage.getUser(userId);
      setCurrentUser(user);
      setView('CLIENT');
    }
  };

  const handleLogout = () => {
    Storage.clearSession();
    setCurrentUser(undefined);
    setView('PUBLIC');
  };

  const refreshClientData = () => {
    if (currentUser) {
      const updated = Storage.getUser(currentUser.id);
      setCurrentUser(updated);
    }
  };

  return (
    <Layout view={view} setView={setView} onLogout={handleLogout}>
      {view === 'PUBLIC' && <PublicHome setView={setView} />}
      
      {view === 'LOGIN' && <Login onLogin={handleLogin} />}
      
      {view === 'ADMIN' && <AdminDashboard />}
      
      {view === 'CLIENT' && currentUser && (
        <ClientDashboard 
          user={currentUser} 
          refreshUser={refreshClientData} 
        />
      )}
    </Layout>
  );
}

export default App;
