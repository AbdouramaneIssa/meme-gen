// src/pages/ProfileSetup.jsx
import React, { useState, useRef } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Camera, User, Mail, Sparkles, ArrowRight, Loader2, ImageIcon } from 'lucide-react';
import '../styles/ProfileSetup.css';

function ProfileSetup({ user, onProfileComplete }) {
  const [displayName, setDisplayName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user.photoURL || '');
  const [photoBase64, setPhotoBase64] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
      setError("Veuillez entrer un nom d'affichage");
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: profilePhoto,
        photoBase64: photoBase64 || user.photoURL,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      onProfileComplete();
    } catch (error) {
      setError('Erreur lors de la sauvegarde du profil');
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-setup-page">
      {/* Background décoratif raffiné */}
      <div className="setup-bg-decor">
        <div className="premium-blob b-1"></div>
        <div className="premium-blob b-2"></div>
      </div>

      <div className="setup-wrapper">
        <div className="setup-card-premium">
          {/* Logo Brand */}
          <div className="setup-logo">
            <div className="logo-box-green">
              <ImageIcon size={20} color="white" />
            </div>
            <span className="brand-text">Meme<span>Gen</span></span>
          </div>

          <div className="setup-header">
            <h1>Bienvenue parmi nous !</h1>
            <p>Créez votre identité sur la plateforme</p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="photo-picker-section">
              <div className="photo-container">
                <img 
                  src={profilePhoto || 'https://via.placeholder.com/150'} 
                  alt="Profil" 
                  className="main-preview" 
                />
                <button
                  type="button"
                  className="camera-trigger"
                  onClick={() => fileInputRef.current?.click()}
                  title="Changer la photo"
                >
                  <Camera size={18} />
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

            <div className="input-group-premium">
              <label><User size={16} /> Nom d'affichage</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Jean Meme"
                  maxLength="50"
                  className="premium-input"
                />
                <span className="count">{displayName.length}/50</span>
              </div>
            </div>

            <div className="input-group-premium disabled">
              <label><Mail size={16} /> Email de contact</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="premium-input"
              />
            </div>

            {error && <div className="setup-error">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="setup-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  Initialisation...
                </>
              ) : (
                <>
                  Découvrir le Dashboard
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;