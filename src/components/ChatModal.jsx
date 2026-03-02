// src/components/ChatModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Download, Share2, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, getDoc } from 'firebase/firestore';
import '../styles/ChatModal.css';

function ChatModal({ otherUser, isOpen, onClose, initialMemeToSend = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState('');
  const [showMemeUpload, setShowMemeUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUid = auth.currentUser?.uid;
  const otherUid = otherUser?.uid;

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !otherUid) return;

    const id = [currentUid, otherUid].sort().join('_');
    setChatId(id);

    // Créer le chat s'il n'existe pas
    setDoc(doc(db, 'chats', id), {
      participants: [currentUid, otherUid],
      lastMessage: 'Discussion commencée',
      lastTimestamp: serverTimestamp(),
      unreadCount: { [currentUid]: 0, [otherUid]: 0 }
    }, { merge: true });

    // Réinitialiser le compteur de messages non lus pour l'utilisateur actuel
    setDoc(doc(db, 'chats', id), {
      unreadCount: { [currentUid]: 0 }
    }, { merge: true });

    const q = query(collection(db, 'chats', id, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [isOpen, otherUid, currentUid]);

  // Envoi automatique du mème si on vient du bouton "Partager"
  useEffect(() => {
    if (initialMemeToSend && chatId) {
      sendMessage(initialMemeToSend, 'meme');
    }
  }, [initialMemeToSend, chatId]);

  const sendMessage = async (content, type = 'text') => {
    if (!content || !chatId) return;
    const ref = collection(db, 'chats', chatId, 'messages');
    await addDoc(ref, {
      senderId: currentUid,
      content,
      type,
      timestamp: serverTimestamp()
    });

    await setDoc(doc(db, 'chats', chatId), {
      lastMessage: type === 'text' ? content.slice(0, 40) : '🖼️ Mème envoyé',
      lastTimestamp: serverTimestamp(),
      unreadCount: { [otherUid]: (await getUnreadCount(chatId, otherUid)) + 1 }
    }, { merge: true });
  };

  const getUnreadCount = async (chatId, uid) => {
    try {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists() && chatDoc.data().unreadCount && chatDoc.data().unreadCount[uid]) {
        return chatDoc.data().unreadCount[uid];
      }
      return 0;
    } catch (err) {
      return 0;
    }
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      setLoading(true);
      sendMessage(newMessage.trim());
      setNewMessage('');
      setLoading(false);
    }
  };

  const handleMemeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        sendMessage(event.target.result, 'meme');
        setShowMemeUpload(false);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadMeme = (base64) => {
    const a = document.createElement('a');
    a.href = base64;
    a.download = `meme-${Date.now()}.png`;
    a.click();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen || !otherUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        className="chat-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-user-info">
            <img
              src={otherUser.photoURL || `https://ui-avatars.com/api/?name=${otherUser.displayName}&background=4f7c64&color=fff`}
              alt=""
              className="chat-avatar-img"
            />
            <div className="user-info-text">
              <h3>{otherUser.displayName}</h3>
              <p className="online-status">En ligne</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}><X size={26} /></button>
        </div>

        {/* Messages */}
        <div className="chat-body">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="empty-chat-message"
              >
                <MessageCircle size={48} />
                <p>Commencez une conversation !</p>
              </motion.div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message ${msg.senderId === currentUid ? 'sent' : 'received'}`}
                >
                  {msg.type === 'meme' ? (
                    <div className="meme-in-chat">
                      <img src={msg.content} alt="meme" className="meme-image" />
                      <div className="meme-actions">
                        <button
                          onClick={() => downloadMeme(msg.content)}
                          className="download-btn"
                          title="Télécharger le mème"
                        >
                          <Download size={16} /> Télécharger
                        </button>
                      </div>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                  ) : (
                    <div className="text-message">
                      <p>{msg.content}</p>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Meme Upload Preview */}
        <AnimatePresence>
          {showMemeUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="meme-upload-section"
            >
              <label className="meme-upload-label">
                <ImageIcon size={24} />
                <span>Cliquez pour ajouter un mème</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMemeUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="chat-input-section">
          <div className="chat-input">
            <button
              className="meme-share-btn"
              onClick={() => setShowMemeUpload(!showMemeUpload)}
              title="Partager un mème"
            >
              <Share2 size={20} />
            </button>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Écris un message..."
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="message-input"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="send-btn"
              title="Envoyer le message"
            >
              <Send size={22} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ChatModal;
