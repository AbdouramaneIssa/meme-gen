import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Upload, Edit3, Share2, LogIn, Loader2 } from 'lucide-react';
import '../styles/LoginPage.css';

function LoginPage({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        onLoginSuccess(user, 'new');
      } else {
        onLoginSuccess(user, 'existing');
      }
    } catch (error) {
      setError('Erreur lors de la connexion. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Arrière-plan animé discret */}
      <div className="bg-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="login-container"
      >
        {/* Section Logo */}
        <header className="login-header">
          <div className="logo-wrapper">
            <Layout size={48} className="main-icon" />
          </div>
          <h1 className="brand-name">Meme<span>Gen</span></h1>
          <p className="brand-tagline">L'art du mème, en toute simplicité.</p>
        </header>

        {/* Carte de Connexion */}
        <div className="login-card">
          <div className="card-inner">
            <h2>Ravi de vous revoir</h2>
            <p>Connectez-vous pour libérer votre créativité.</p>

            {error && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="error-box">
                {error}
              </motion.div>
            )}

            <button 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
              className="google-btn-new"
            >
              {isLoading ? (
                <Loader2 className="spinner-icon" />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              )}
              <span>{isLoading ? 'Connexion...' : 'Continuer avec Google'}</span>
            </button>

            <p className="legal">
              En continuant, vous acceptez nos <span>Conditions d'Utilisation</span>.
            </p>
          </div>
        </div>

        {/* Features discrètes */}
        <footer className="features-minimal">
          <div className="f-item"><Upload size={18}/> <span>Upload</span></div>
          <div className="f-item"><Edit3 size={18}/> <span>Create</span></div>
          <div className="f-item"><Share2 size={18}/> <span>Share</span></div>
        </footer>
      </motion.div>
    </div>
  );
}

export default LoginPage;