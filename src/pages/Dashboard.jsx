// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Users, MessageSquare, Plus } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProfileEditor from '../components/ProfileEditor';
import Invitations from '../components/Invitations';
import '../styles/Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // On vérifie si on est exactement sur la racine "/"
  const isHomePage = location.pathname === '/';

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        <Navbar 
          user={user} 
          onLogout={onLogout} 
          onEditProfile={() => setShowProfileEditor(true)}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onInvitationsClick={() => setShowInvitations(true)}
        />

        <div className="content-container">
          {isHomePage ? (
            /* --- SI ON EST SUR L'ACCUEIL : ON AFFICHE LES STATS --- */
            <>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="welcome-banner"
              >
                <div className="welcome-text">
                  <h1>Salut, {user.displayName} <Sparkles className="inline-icon" /></h1>
                  <p>Qu'allez-vous créer aujourd'hui ?</p>
                </div>
                <button className="cta-create" onClick={() => navigate('/create')}>
                  <Plus size={20} /> Créer un mème
                </button>
              </motion.div>

              <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/create')} style={{ cursor: 'pointer' }}>
                  <div className="stat-icon green"><Plus /></div>
                  <div className="stat-info"><h3>Créer</h3><p>Nouveau projet</p></div>
                </div>
                <div className="stat-card" onClick={() => navigate('/gallery')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon blue"><ImageIcon /></div>
                <div className="stat-info"><h3>Galerie</h3><p>{/* tu peux mettre le nombre plus tard */}Mes mèmes</p></div>
               </div>
                <div className="stat-card" onClick={() => navigate('/community')} style={{ cursor: 'pointer' }}>
                  <div className="stat-icon purple"><Users /></div>
                  <div className="stat-info"><h3>Communauté</h3><p>Trouver les autres utilisateurs</p></div>
                </div>
                <div className="stat-card" onClick={() => navigate('/messages')} style={{ cursor: 'pointer' }}>
                  <div className="stat-icon red"><MessageSquare /></div>
                  <div className="stat-info"><h3>Messages</h3><p>Conversations actives</p></div>
                </div>
              </div>


            </>
          ) : (
            /* --- SI ON EST SUR /create (ou autre) : ON AFFICHE LE CONTENU DE LA ROUTE --- */
            <div className="route-outlet-wrapper">
               <Outlet />
            </div>
          )}
        </div>
      </main>

      {showProfileEditor && (
        <ProfileEditor user={user} onClose={() => setShowProfileEditor(false)} />
      )}

      <Invitations isOpen={showInvitations} onClose={() => setShowInvitations(false)} />
    </div>
  );
}

export default Dashboard;