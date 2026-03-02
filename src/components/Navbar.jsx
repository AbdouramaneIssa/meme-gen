// src/components/Navbar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Menu, LogOut, Settings, ChevronDown, Sparkles, Bell, Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import '../styles/Navbar.css';

function Navbar({ user, onLogout, onEditProfile, toggleSidebar, onInvitationsClick }) {
  const [invitationCount, setInvitationCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const currentUid = auth.currentUser?.uid;

  // Récupérer le nombre d'invitations en attente
  useEffect(() => {
    if (!currentUid) return;
    
    const q = query(
      collection(db, 'invitations'),
      where('recipientId', '==', currentUid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      setInvitationCount(snap.docs.length);
    });
    
    return unsub;
  }, [currentUid]);

  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <nav className="top-navbar">
      <div className="nav-left">
        <button onClick={toggleSidebar} className="hamburger-btn">
          <Menu size={24} />
        </button>
        <div className="nav-brand-wrapper">
          <Sparkles size={20} className="brand-sparkle" />
          <span className="nav-brand">Meme<span>Gen</span></span>
        </div>
      </div>

      <div className="nav-right">
        {/* Bouton thème */}
        <button
          className="theme-toggle-btn"
          onClick={() => {
            const next = theme === 'dark' ? 'light' : 'dark';
            console.log('theme toggle', next);
            setTheme(next);
          }}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          className="invitations-btn"
          onClick={onInvitationsClick}
          title="Demandes d'amitié"
        >
          <Bell size={20} />
          {invitationCount > 0 && (
            <span className="notification-badge">
              {invitationCount > 99 ? '99+' : invitationCount}
            </span>
          )}
        </button>

        <div className="profile-section">
          <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
            <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Avatar" className="nav-avatar" />
            <span className="nav-username">{user.displayName}</span>
            <ChevronDown size={16} className={`chevron-icon ${showDropdown ? 'rotate' : ''}`} />
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 10 }}
                className="profile-dropdown"
              >
                <button onClick={() => { onEditProfile(); setShowDropdown(false); }}>
                  <Settings size={18} /> Modifier le profil
                </button>
                <div className="divider"></div>
                <button onClick={onLogout} className="logout-btn">
                  <LogOut size={18} /> Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
