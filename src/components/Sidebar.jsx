import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Image as ImageIcon, Users, MessageSquare, X } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function Sidebar({ isOpen, onClose }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUid = auth.currentUser?.uid;

  // Palette de couleurs Premium Sage
  const colors = {
    sage: 'var(--sage-main)',
    sageLight: 'var(--sage-light)',
    sageDark: 'var(--sage-dark)',
    gray: 'var(--gray)',
    white: 'var(--white)',
    border: 'var(--border)'
  };

  // Récupérer le nombre de messages non lus
  useEffect(() => {
    if (!currentUid) return;
    
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUid));
    const unsub = onSnapshot(q, (snap) => {
      let totalUnread = 0;
      snap.docs.forEach(chatDoc => {
        const chatData = chatDoc.data();
        if (chatData.unreadCount && chatData.unreadCount[currentUid]) {
          totalUnread += chatData.unreadCount[currentUid];
        }
      });
      setUnreadCount(totalUnread);
    });
    
    return unsub;
  }, [currentUid]);

  const menuItems = [
    { id: '', label: 'Accueil', icon: <Home size={22} /> },
    { id: 'create', label: 'Créer un mème', icon: <PlusCircle size={22} /> },
    { id: 'gallery', label: 'Ma galerie', icon: <ImageIcon size={22} /> },
    { id: 'community', label: 'Communauté', icon: <Users size={22} /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={22} />, badge: unreadCount },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay flouté (Mobile) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000
            }}
          />
          
          <motion.aside 
            initial={{ x: -300 }} 
            animate={{ x: 0 }} 
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: '280px',
              backgroundColor: colors.white,
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '10px 0 30px rgba(0,0,0,0.05)',
              borderRight: `1px solid ${colors.border}`
            }}
          >
            {/* --- HEADER --- */}
            <div style={{
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', backgroundColor: colors.sage,
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ImageIcon size={20} color="white" />
                </div>
                <span style={{
                  fontSize: '1.2rem', fontWeight: '800', color: colors.sageDark,
                  letterSpacing: '-0.5px'
                }}>
                  Meme<span style={{ color: colors.sage }}>Gen</span>
                </span>
              </div>
              
              <button onClick={onClose} style={{
                background: 'var(--border)', border: 'none', borderRadius: '8px', 
                padding: '6px', cursor: 'pointer', color: colors.gray,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <X size={18} />
              </button>
            </div>

            {/* --- NAVIGATION --- */}
            <nav style={{ padding: '20px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {menuItems.map((item) => (
                <NavLink 
                  key={item.id} 
                  to={`/${item.id}`}
                  onClick={() => { if (window.innerWidth <= 768) onClose(); }}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 20px',
                    margin: '4px 16px',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '0.95rem',
                    fontWeight: isActive ? '700' : '500',
                    backgroundColor: isActive ? colors.sageLight : 'transparent',
                    color: isActive ? colors.sage : colors.gray,
                    borderLeft: isActive ? `4px solid ${colors.sage}` : '4px solid transparent',
                    position: 'relative'
                  })}
                >
                  <span style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    {React.cloneElement(item.icon, { size: 22 })}
                    {item.badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'var(--danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        border: `2px solid ${colors.white}`
                      }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* --- FOOTER --- */}
            <div style={{ 
              padding: '24px', 
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: '#fcfdfc'
            }}>
              <div style={{
                fontSize: '0.75rem', 
                color: colors.gray, 
                textAlign: 'center',
                fontWeight: '600'
              }}>
                © 2026 MemeGen Studio
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;
