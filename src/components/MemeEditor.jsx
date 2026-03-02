import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Save, Send, Move, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import '../styles/MemeEditor.css';

function MemeEditor({ user }) {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [topColor, setTopColor] = useState('#ffffff');
  const [bottomColor, setBottomColor] = useState('#ffffff');
  const [topFontSize, setTopFontSize] = useState(45);
  const [bottomFontSize, setBottomFontSize] = useState(45);
  const [topPosition, setTopPosition] = useState({ x: 0, y: -25 });
  const [bottomPosition, setBottomPosition] = useState({ x: 0, y: 25 });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setTopText(''); setBottomText('');
    setTopPosition({ x: 0, y: -25 });
    setBottomPosition({ x: 0, y: 25 });
    setTopFontSize(45); setBottomFontSize(45);
  };

  const triggerUpload = () => fileInputRef.current.click();

  // === DRAG FIXÉ ET FIABLE (SOURIS + TACTILE) ===
  const startDrag = (e, isTop) => {
    e.stopPropagation();
    const setPos = isTop ? setTopPosition : setBottomPosition;
    const currentPos = isTop ? topPosition : bottomPosition;
    const container = e.currentTarget.parentElement.getBoundingClientRect();

    // Récupérer les coordonnées (souris ou tactile)
    const startX = e.clientX || e.touches?.[0]?.clientX;
    const startY = e.clientY || e.touches?.[0]?.clientY;

    const onMove = (moveE) => {
      const clientX = moveE.clientX || moveE.touches?.[0]?.clientX;
      const clientY = moveE.clientY || moveE.touches?.[0]?.clientY;

      const dx = ((clientX - startX) / container.width) * 100;
      const dy = ((clientY - startY) / container.height) * 100;

      setPos({
        x: Math.max(-45, Math.min(45, currentPos.x + dx)),
        y: Math.max(-45, Math.min(45, currentPos.y + dy)),
      });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  };

  const handleSave = async (status) => {
    if (!selectedImage) return alert("Upload d'abord une image !");
    if (!user || !user.uid) return alert("Erreur : utilisateur non authentifié.");

    setIsSaving(true);
    try {
      console.log('Sauvegarde du mème avec userId:', user.uid);
      await addDoc(collection(db, 'memes'), {
        userId: user.uid,
        displayName: user.displayName || 'Utilisateur',
        originalImage: selectedImage,
        topText: topText.trim(),
        bottomText: bottomText.trim(),
        topColor, bottomColor,
        topFontSize, bottomFontSize,
        topPosition, bottomPosition,
        status,
        createdAt: serverTimestamp(),
      });

      setSuccessMessage(status === 'draft' 
        ? '✅ Brouillon sauvegardé (visible uniquement par toi)' 
        : '🎉 Mème publié dans la communauté !');

      setTimeout(() => {
        setSuccessMessage('');
        removeImage();
        navigate('/gallery');
      }, 2200);
    } catch (err) {
      console.error('Erreur de sauvegarde:', err);
      alert('Erreur de sauvegarde: ' + err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="meme-editor-layout">
      {/* CANEVAS */}
      <div className="meme-canvas-section">
        <div className="canvas-stage">
          {!selectedImage ? (
            <div className="empty-studio-placeholder" onClick={triggerUpload}>
              <div className="icon-wrap"><Upload size={56} color="#4f7c64" /></div>
              <h2>Crée ton mème <span>ici</span></h2>
              <p>Clique pour uploader une image</p>
            </div>
          ) : (
            <div className="canvas-capture-area">
              <img src={selectedImage} alt="Mème" className="meme-base-img" />

              {/* TEXTE HAUT DRAGGABLE */}
              {topText && (
                <div
                  className="draggable-text-overlay"
                  style={{
                    top: `calc(50% + ${topPosition.y}%)`,
                    left: `calc(50% + ${topPosition.x}%)`,
                    transform: 'translate(-50%, -50%)',
                    color: topColor,
                    fontSize: `${topFontSize}px`,
                  }}
                  onMouseDown={(e) => startDrag(e, true)}
                  onTouchStart={(e) => startDrag(e, true)}
                >
                  {topText}
                  <div className="drag-handle-icon"><Move size={14} /></div>
                </div>
              )}

              {/* TEXTE BAS DRAGGABLE */}
              {bottomText && (
                <div
                  className="draggable-text-overlay"
                  style={{
                    top: `calc(50% + ${bottomPosition.y}%)`,
                    left: `calc(50% + ${bottomPosition.x}%)`,
                    transform: 'translate(-50%, -50%)',
                    color: bottomColor,
                    fontSize: `${bottomFontSize}px`,
                  }}
                  onMouseDown={(e) => startDrag(e, false)}
                  onTouchStart={(e) => startDrag(e, false)}
                >
                  {bottomText}
                  <div className="drag-handle-icon"><Move size={14} /></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OUTILS : carte toujours visible à droite du canevas */}
      <div className="meme-sidebar-tools">
        <div className="toolbar-header">
          <h3>Outils du mème</h3>
        </div>

        {!selectedImage ? (
          <div className="upload-trigger" onClick={triggerUpload}>
            <Upload size={24} /> Uploader une image
          </div>
        ) : (
          <button className="upload-trigger" style={{ background: 'var(--error-light)', color: 'var(--danger)' }} onClick={removeImage}>
            <Trash2 size={24} /> Supprimer l’image
          </button>
        )}

        {selectedImage && (
          <div className="text-editor-section">
            <div className="section-header"><h3>Textes du mème</h3></div>

            {/* HAUT */}
            <div className={`text-item-card ${topText ? 'active' : ''}`}>
              <div className="card-main">
                <input type="text" placeholder="Texte du haut..." value={topText} onChange={(e) => setTopText(e.target.value)} maxLength={60} />
                {topText && <button className="delete-btn" onClick={() => setTopText('')}><Trash2 size={20} /></button>}
              </div>
              <div className="card-tools">
                <div className="tool-control">
                  <span>Couleur :</span>
                  <div className="color-picker-wrapper"><input type="color" value={topColor} onChange={(e) => setTopColor(e.target.value)} /></div>
                </div>
                <div className="tool-control flex-grow">
                  <Type size={18} />
                  <input type="range" min="20" max="110" value={topFontSize} onChange={(e) => setTopFontSize(Number(e.target.value))} />
                  <span>{topFontSize}px</span>
                </div>
              </div>
            </div>

            {/* BAS */}
            <div className={`text-item-card ${bottomText ? 'active' : ''}`}>
              <div className="card-main">
                <input type="text" placeholder="Texte du bas..." value={bottomText} onChange={(e) => setBottomText(e.target.value)} maxLength={60} />
                {bottomText && <button className="delete-btn" onClick={() => setBottomText('')}><Trash2 size={20} /></button>}
              </div>
              <div className="card-tools">
                <div className="tool-control">
                  <span>Couleur :</span>
                  <div className="color-picker-wrapper"><input type="color" value={bottomColor} onChange={(e) => setBottomColor(e.target.value)} /></div>
                </div>
                <div className="tool-control flex-grow">
                  <Type size={18} />
                  <input type="range" min="20" max="110" value={bottomFontSize} onChange={(e) => setBottomFontSize(Number(e.target.value))} />
                  <span>{bottomFontSize}px</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedImage && (
          <>
            {successMessage && <div className="success-message">{successMessage}</div>}
            <div className="publish-actions-group">
              <button className="btn-action-draft" onClick={() => handleSave('draft')} disabled={isSaving}>
                <Save size={20} /> {isSaving ? 'Sauvegarde...' : 'Brouillon'}
              </button>
              <button className="btn-action-publish" onClick={() => handleSave('published')} disabled={isSaving}>
                <Send size={20} /> {isSaving ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* mobile toggle removed - tools always visible */}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  );
}

export default MemeEditor;