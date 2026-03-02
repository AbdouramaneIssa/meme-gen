import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Sparkles } from 'lucide-react';

import LoginPage from './pages/LoginPage';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import MemeEditor from './components/MemeEditor'; // L'import sera maintenant utilisé !
import Gallery from './pages/Gallery';
import Community from './pages/Community';
import Messages from './pages/Messages'; // Nouvelle page pour la messagerie privée


import './App.css';

export const ThemeContext = createContext();

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Préférence utilisateur ou système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // apply to html element so CSS var selectors match
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data());
            setShowProfileSetup(false);
          } else {
            setShowProfileSetup(true);
          }
        } catch (error) {
          console.error('Erreur:', error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setShowProfileSetup(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleProfileComplete = async () => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      setUserProfile(userDocSnap.data());
      setShowProfileSetup(false);
    }
  };

  // Loader Premium
  if (loading) {
    return (
      <div className="premium-loading-screen">
        <div className="loader-content">
          <div className="logo-loader">
            <Sparkles size={40} className="sparkle-icon" color="var(--sage-main)" />
            <div className="spinner-ring"></div>
          </div>
          <h2 className="loader-text">Meme<span>Gen</span></h2>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Router>
        <div className="App">
          <Routes>
          {/* 1. Page de Connexion */}
          <Route 
            path="/login" 
            element={!currentUser ? <LoginPage onLoginSuccess={() => {}} /> : <Navigate to="/" />} 
          />

          {/* 2. Configuration du Profil (si nouveau) */}
          <Route 
            path="/setup" 
            element={currentUser && showProfileSetup ? <ProfileSetup user={currentUser} onProfileComplete={handleProfileComplete} /> : <Navigate to="/" />} 
          />

          {/* 3. Dashboard et ses sous-pages (Le cœur de l'app) */}
          <Route
            path="/"
            element={
              !currentUser ? <Navigate to="/login" /> :
              showProfileSetup ? <Navigate to="/setup" /> :
              <Dashboard user={userProfile} onLogout={() => auth.signOut()} />
            }
          >
            {/* ICI : Les routes qui s'affichent DANS le Dashboard (via <Outlet />) */}
            <Route path="create" element={<MemeEditor user={userProfile} />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="community" element={<Community />} />
            <Route path="messages" element={<Messages />} />
          </Route>

          {/* Redirection automatique si l'URL n'existe pas */}
          <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;