// src/components/Invitations.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import '../styles/Invitations.css';

function Invitations({ isOpen, onClose }) {
  const [invitations, setInvitations] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);

  const currentUid = auth.currentUser?.uid;

  // Récupérer les invitations reçues
  useEffect(() => {
    if (!isOpen || !currentUid) return;

    const q = query(
      collection(db, 'invitations'),
      where('recipientId', '==', currentUid),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, async (snap) => {
      const invitationsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Récupérer les détails des utilisateurs qui ont envoyé les invitations
      const details = {};
      for (const inv of invitationsData) {
        if (!details[inv.senderId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', inv.senderId));
            if (userDoc.exists()) {
              details[inv.senderId] = userDoc.data();
            }
          } catch (err) {
            console.error('Erreur récupération utilisateur:', err);
          }
        }
      }
      
      setUserDetails(details);
      setInvitations(invitationsData);
      setLoading(false);
    });

    return unsub;
  }, [isOpen, currentUid]);

  const handleAccept = async (invitationId, senderId) => {
    try {
      // Créer une amitié bidirectionnelle
      const friendshipId = [currentUid, senderId].sort().join('_');
      await setDoc(doc(db, 'friendships', friendshipId), {
        users: [currentUid, senderId],
        createdAt: new Date(),
        status: 'active'
      });

      // Mettre à jour le statut de l'invitation
      await setDoc(doc(db, 'invitations', invitationId), {
        status: 'accepted'
      }, { merge: true });
    } catch (err) {
      console.error('Erreur acceptation invitation:', err);
    }
  };

  const handleReject = async (invitationId) => {
    try {
      await setDoc(doc(db, 'invitations', invitationId), {
        status: 'rejected'
      }, { merge: true });
    } catch (err) {
      console.error('Erreur rejet invitation:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="invitations-overlay"
          onClick={onClose}
        >
          <motion.div
            className="invitations-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="invitations-header">
              <div className="header-content">
                <UserPlus size={28} className="header-icon" />
                <h2>Demandes d'amitié</h2>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="invitations-body">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Chargement...</p>
                </div>
              ) : invitations.length > 0 ? (
                <AnimatePresence>
                  {invitations.map((inv, index) => {
                    const sender = userDetails[inv.senderId];
                    return (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="invitation-card"
                      >
                        <img
                          src={sender?.photoURL || `https://ui-avatars.com/api/?name=${sender?.displayName}&background=4f7c64&color=fff`}
                          alt={sender?.displayName}
                          className="invitation-avatar"
                        />
                        
                        <div className="invitation-info">
                          <h3>{sender?.displayName || 'Utilisateur'}</h3>
                          <p>Vous a envoyé une demande d'amitié</p>
                        </div>

                        <div className="invitation-actions">
                          <button
                            className="btn-accept"
                            onClick={() => handleAccept(inv.id, inv.senderId)}
                            title="Accepter"
                          >
                            <CheckCircle size={20} /> Accepter
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleReject(inv.id)}
                            title="Refuser"
                          >
                            <XCircle size={20} /> Refuser
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="empty-invitations">
                  <UserPlus size={64} />
                  <h3>Aucune demande d'amitié</h3>
                  <p>Vous n'avez pas de demandes en attente</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Invitations;
