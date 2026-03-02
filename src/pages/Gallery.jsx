// src/pages/Gallery.jsx - VERSION DÉFINITIVE (images apparaissent toujours)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Send, Lock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import '../styles/Gallery.css';

function Gallery() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      console.log('Pas de uid, Gallery vide');
      setMemes([]);
      setLoading(false);
      return;
    }

    console.log('Recherche des mèmes pour uid:', uid);
    const q = query(
      collection(db, 'memes'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Mèmes trouvés:', snapshot.docs.length);
        const memesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMemes(memesList);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Gallery:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const toggleStatus = async (memeId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
      await updateDoc(doc(db, 'memes', memeId), { status: newStatus });
      console.log(`Mème ${memeId} changé en ${newStatus}`);
    } catch (error) {
      console.error('Erreur lors du changement de statut :', error);
      alert('Erreur lors du changement de statut. Veuillez réessayer.');
    }
  };

  const deleteMeme = async (memeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce mème ?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'memes', memeId));
      console.log(`Mème ${memeId} supprimé`);
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      alert('Erreur lors de la suppression. Veuillez réessayer.');
    }
  };

  if (loading) {
    return <div className="gallery-loading">Chargement de ta magnifique galerie...</div>;
  }

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={26} /> Retour
        </button>
        <div>
          <h1>Ma Galerie <span className="count">{memes.length}</span></h1>
          <p>Brouillons & mèmes publiés</p>
        </div>
      </div>

      {memes.length === 0 ? (
        <div className="empty-gallery">
          <div className="empty-icon">🖼️</div>
          <h2>Aucun mème encore</h2>
          <p>Crée ton premier chef-d’œuvre dans "Créer un mème"</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {memes.map((meme, index) => (
            <motion.div
              key={meme.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="meme-card"
            >
              <div className="card-image-wrapper">
                <img 
                  src={meme.originalImage} 
                  alt="Mème" 
                  className="card-image" 
                />

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

                <div className={`status-badge ${meme.status}`}>
                  {meme.status === 'draft' ? 'Brouillon' : 'Publié'}
                </div>
              </div>

              <div className="card-footer">
                <div className="footer-actions">
                  <button
                    className={`toggle-btn ${meme.status}`}
                    onClick={() => toggleStatus(meme.id, meme.status)}
                  >
                    {meme.status === 'draft' ? (
                      <> <Send size={20} /> Publier maintenant </>
                    ) : (
                      <> <Lock size={20} /> Rendre privé </>
                    )}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteMeme(meme.id)}
                    title="Supprimer ce mème"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Gallery;