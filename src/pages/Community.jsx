// src/pages/Community.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, MessageCircle, Users, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatModal from '../components/ChatModal';

import '../styles/Community.css';

function Community() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMemes, setUserMemes] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [initialMemeToSend, setInitialMemeToSend] = useState(null);
  const [sentInvitations, setSentInvitations] = useState({}); // { recipientId: status }
  const [friendships, setFriendships] = useState({}); // { userId: boolean }

  const navigate = useNavigate();
  const currentUid = auth.currentUser?.uid;

  // Récupération de tous les utilisateurs
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const allUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setUsers(allUsers.filter(u => u.uid !== currentUid));
    });
    return unsub;
  }, [currentUid]);

  // récupérer invitations envoyées et amis actuels
  useEffect(() => {
    if (!currentUid) return;
    
    // invitations en attente
    const qInv = query(
      collection(db, 'invitations'),
      where('senderId', '==', currentUid),
      where('status', '==', 'pending')
    );
    const unsubInv = onSnapshot(qInv, (snap) => {
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[data.recipientId] = 'pending';
      });
      setSentInvitations(map);
    });

    // amis actuels
    const qFriends = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', currentUid)
    );
    const unsubFriends = onSnapshot(qFriends, (snap) => {
      const friendMap = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const friendUid = data.users.find(uid => uid !== currentUid);
        if (friendUid) {
          friendMap[friendUid] = true;
        }
      });
      setFriendships(friendMap);
    });

    return () => {
      unsubInv();
      unsubFriends();
    };
  }, [currentUid]);

  // Récupération des mèmes publics de l'utilisateur sélectionné
  useEffect(() => {
    if (!selectedUser) return;
    const q = query(
      collection(db, 'memes'),
      where('userId', '==', selectedUser.uid),
      where('status', '==', 'published')
    );
    const unsub = onSnapshot(q, (snap) => {
      setUserMemes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedUser]);

  const handleShareMeme = (meme) => {
    setSelectedUser(selectedUser);
    setInitialMemeToSend(meme.originalImage);
    setShowChat(true);
    setShowProfile(false);
  };

  const openProfile = (user) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const openChat = (user, memeBase64 = null) => {
    setSelectedUser(user);
    setInitialMemeToSend(memeBase64);
    setShowChat(true);
    setShowProfile(false);
  };

  // envoie une invitation d'amitié à un utilisateur
  const handleSendInvitation = async (recipient) => {
    if (!currentUid || !recipient?.uid) return;
    try {
      const invRef = doc(collection(db, 'invitations'));
      await setDoc(invRef, {
        senderId: currentUid,
        recipientId: recipient.uid,
        status: 'pending',
        createdAt: new Date()
      });
      // immediately update local state to give feedback
      setSentInvitations(prev => ({ ...prev, [recipient.uid]: 'pending' }));
      // TODO: replace with toast/snackbar notification
      console.log('Invitation envoyée à', recipient.displayName);
    } catch (err) {
      console.error('Erreur envoi invitation :', err);
    }
  };

  return (
    <div className="community-page">
      <div className="community-header">
        <h1><Users size={32} className="header-icon" /> Communauté <span>{users.length}</span></h1>
      </div>

      {users.length > 0 ? (
        <div className="users-grid">
          {users.map((user, index) => (
            <motion.div 
              key={user.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="user-card"
            >
              <div className="avatar-container">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=4f7c64&color=fff`} 
                  alt={user.displayName} 
                  className="avatar"
                />
              </div>
              <h3>{user.displayName}</h3>
              <p className="user-subtitle">Membre de la communauté</p>
              
              <div className="user-actions">
                <button onClick={() => openProfile(user)} className="btn-profile">
                  Voir le profil
                </button>
                <button onClick={() => openChat(user)} className="btn-message">
                  <MessageCircle size={18} /> Message
                </button>
                {friendships[user.uid] ? (
                  <button disabled className="btn-invite friend">
                    <UserCheck size={18} /> Amis
                  </button>
                ) : sentInvitations[user.uid] === 'pending' ? (
                  <button disabled className="btn-invite pending">
                    En attente
                  </button>
                ) : (
                  <button onClick={() => handleSendInvitation(user)} className="btn-invite">
                    <UserPlus size={18} /> Inviter
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-community">
          <Users size={64} />
          <h2>Aucun utilisateur trouvé</h2>
          <p>Soyez le premier à rejoindre la communauté !</p>
        </div>
      )}

      {/* MODAL PROFIL UTILISATEUR */}
      {showProfile && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProfile(false)}>✕</button>
            
            <img 
              src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.displayName}`} 
              className="big-avatar" 
            />
            <h2>{selectedUser.displayName}</h2>

            <h3 className="memes-title">Ses mèmes publics ({userMemes.length})</h3>
            
            <div className="public-memes-grid">
              {userMemes.length > 0 ? (
                userMemes.map(meme => (
                  <div key={meme.id} className="mini-meme-card">
                    <img src={meme.originalImage} alt="Mème" />
                    {/* Afficher les textes du mème */}
                    {meme.topText && (
                      <div className="preview-text top" style={{ color: meme.topColor }}>
                        {meme.topText}
                      </div>
                    )}
                    {meme.bottomText && (
                      <div className="preview-text bottom" style={{ color: meme.bottomColor }}>
                        {meme.bottomText}
                      </div>
                    )}
                    <div className="meme-overlay">
                      <button 
                        onClick={() => handleShareMeme(meme)}
                        className="share-in-profile"
                      >
                        <MessageCircle size={16} /> Partager
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-memes-message">
                  <p>Aucun mème public pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      <ChatModal 
        otherUser={selectedUser} 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
        initialMemeToSend={initialMemeToSend} 
      />
    </div>
  );
}

export default Community;