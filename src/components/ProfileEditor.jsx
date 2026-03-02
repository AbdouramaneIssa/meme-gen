// src/components/ProfileEditor.jsx
import React, { useState, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Mail, X, CheckCircle2, Loader2 } from 'lucide-react';
import '../styles/ProfileEditor.css';

function ProfileEditor({ user, onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [profilePhoto, setProfilePhoto] = useState(user.photoURL || '');
  const [photoBase64, setPhotoBase64] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setPhotoBase64(base64String);
        setProfilePhoto(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Le nom d'affichage est requis");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updateData = {
        displayName: displayName,
        updatedAt: new Date()
      };

      if (photoBase64) {
        updateData.photoURL = profilePhoto;
        updateData.photoBase64 = photoBase64;
      }

      await updateDoc(userDocRef, updateData);
      setSuccess('Profil mis à jour !');
      
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      setError('Erreur de mise à jour');
      setIsLoading(false);
    }
  };

  return (
    <div className="editor-overlay-premium">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="editor-modal-premium"
      >
        <div className="editor-header-premium">
          <div className="header-title-group">
            <User size={20} className="header-icon" />
            <h2>Mon Profil</h2>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="editor-form-premium">
          <div className="photo-editor-section">
            <div className="photo-preview-wrapper">
              <img src={profilePhoto || 'https://via.placeholder.com/150'} alt="Profil" />
              <button
                type="button"
                className="edit-photo-trigger"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={16} />
                <span>Modifier</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-fields-grid">
            <div className="editor-group">
              <label><User size={14} /> Nom d'affichage</label>
              <div className="input-with-counter">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jean Meme"
                  maxLength="50"
                  className="editor-input"
                />
                <span className="editor-counter">{displayName.length}/50</span>
              </div>
            </div>

            <div className="editor-group disabled">
              <label><Mail size={14} /> Adresse Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="editor-input"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="editor-alert error">
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="editor-alert success">
                <CheckCircle2 size={16} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="editor-footer-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 size={18} className="spinner" /> Sauvegarde...</>
              ) : (
                'Enregistrer les changements'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default ProfileEditor;