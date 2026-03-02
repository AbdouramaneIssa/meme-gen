// src/pages/Messages.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import ChatModal from '../components/ChatModal';
import { MessageCircle, Search, Clock } from 'lucide-react';
import '../styles/Messages.css';

function Messages() {
  const [chats, setChats] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const currentUid = auth.currentUser?.uid;

  // Récupération de tous les chats de l'utilisateur
  useEffect(() => {
    if (!currentUid) return;
    
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUid));
    const unsub = onSnapshot(q, async (snap) => {
      const chatsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Récupérer les détails des autres utilisateurs
      const details = {};
      for (const chat of chatsData) {
        const otherUid = chat.participants.find(uid => uid !== currentUid);
        if (otherUid && !details[otherUid]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUid));
            if (userDoc.exists()) {
              details[otherUid] = userDoc.data();
            }
          } catch (err) {
            console.error('Erreur récupération utilisateur:', err);
          }
        }
      }
      
      setUserDetails(details);
      setChats(chatsData.sort((a, b) => (b.lastTimestamp?.toMillis?.() || 0) - (a.lastTimestamp?.toMillis?.() || 0)));
      setLoading(false);
    });
    
    return unsub;
  }, [currentUid]);

  const openChatWith = (chat) => {
    const otherUid = chat.participants.find(uid => uid !== currentUid);
    const otherUser = userDetails[otherUid];
    if (otherUser) {
      setSelectedChatUser({ uid: otherUid, ...otherUser });
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const filteredChats = chats.filter(chat => {
    const otherUid = chat.participants.find(uid => uid !== currentUid);
    const otherUser = userDetails[otherUid];
    if (!otherUser) return false;
    return otherUser.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-header">
          <h1><MessageCircle size={32} className="header-icon" /> Messages</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h1><MessageCircle size={32} className="header-icon" /> Messages</h1>
      </div>

      <div className="messages-search">
        <Search size={20} />
        <input
          type="text"
          placeholder="Rechercher une conversation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="chat-list">
        <AnimatePresence>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat, index) => {
              const otherUid = chat.participants.find(uid => uid !== currentUid);
              const otherUser = userDetails[otherUid];
              
              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="chat-item"
                  onClick={() => openChatWith(chat)}
                >
                  <div className="chat-avatar">
                    <img
                      src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName}&background=4f7c64&color=fff`}
                      alt={otherUser?.displayName}
                    />
                  </div>
                  
                  <div className="chat-content">
                    <div className="chat-header-row">
                      <h3>{otherUser?.displayName || 'Utilisateur'}</h3>
                      <span className="chat-time">
                        <Clock size={14} /> {formatTime(chat.lastTimestamp)}
                      </span>
                    </div>
                    <p className="chat-preview">
                      {chat.lastMessage?.length > 50
                        ? `${chat.lastMessage.substring(0, 50)}...`
                        : chat.lastMessage || 'Aucun message'}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-chats"
            >
              <MessageCircle size={64} />
              <h2>Aucune conversation</h2>
              <p>{searchQuery ? 'Aucune conversation ne correspond à votre recherche' : 'Commencez une conversation en visitant la communauté !'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChatModal
        otherUser={selectedChatUser}
        isOpen={!!selectedChatUser}
        onClose={() => setSelectedChatUser(null)}
      />
    </div>
  );
}

export default Messages;
