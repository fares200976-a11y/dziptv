import React, { useState, useEffect } from 'react';
import { X, Check, Eye, HelpCircle, Film, ShoppingBag, ZoomIn, ZoomOut, RotateCcw, Maximize2, Move, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dress, Booking } from '../types';
import BookingCalendar from './BookingCalendar';

interface DressModalProps {
  dress: Dress;
  isOpen: boolean;
  onClose: () => void;
  existingBookings: Booking[];
  onInitiatePayment: (bookingDetails: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    date: string;
    size: string;
    notes: string;
  }) => void;
}

export default function DressModal({ dress, isOpen, onClose, existingBookings, onInitiatePayment }: DressModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  // Zoom / Lightbox states
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Escape key to close zoom or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomOpen) {
          setIsZoomOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, isOpen, onClose]);

  // Drag / pan event handlers for zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Bounds limit based on scale
    const limitX = (zoomLevel - 1) * 350;
    const limitY = (zoomLevel - 1) * 250;
    
    setPanOffset({
      x: Math.min(Math.max(newX, -limitX), limitX),
      y: Math.min(Math.max(newY, -limitY), limitY)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel <= 1) return;
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    const limitX = (zoomLevel - 1) * 350;
    const limitY = (zoomLevel - 1) * 250;
    
    setPanOffset({
      x: Math.min(Math.max(newX, -limitX), limitX),
      y: Math.min(Math.max(newY, -limitY), limitY)
    });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    if (zoomLevel === 1) {
      setZoomLevel(2.5);
    } else {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  if (!isOpen) return null;

  return (
    <div id="dress-detail-overlay" className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl bg-white rounded-none shadow-2xl overflow-hidden border border-bento-gold/25 max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-3 bg-white hover:bg-bento-rose text-bento-text rounded-none shadow-sm transition-all border border-bento-gold/25 cursor-pointer"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Visual Media Presentation */}
          <div className="w-full md:w-1/2 bg-bento-bg relative flex flex-col border-r border-bento-gold/15 min-h-[300px] md:min-h-0">
            {/* Main view (image or video) */}
            <div className="flex-1 relative h-64 md:h-auto overflow-hidden bg-zinc-950 flex items-center justify-center">
              {showVideo && dress.videoUrl ? (
                <video
                  src={dress.videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  onClick={() => {
                    setIsZoomOpen(true);
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="w-full h-full relative cursor-zoom-in group"
                  title="Cliquez pour zoomer sur les détails de broderies et dentelles"
                >
                  <img
                    src={dress.images[activeImageIdx]}
                    alt={dress.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 animate-fade-in"
                    decoding="async"
                  />
                  {/* Elegant hover badge info */}
                  <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <span className="bg-white/95 backdrop-blur-xs text-bento-text text-[10px] uppercase tracking-wider font-sans font-bold px-4 py-2.5 border border-bento-gold/30 shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <Maximize2 className="w-3.5 h-3.5 text-bento-gold" /> Zoomer sur les Détails
                    </span>
                    <span className="text-white/80 text-[9px] font-sans tracking-wide">Dentelles, Broderies & Finitions</span>
                  </div>
                </div>
              )}

              {/* Video toggle badge if video is present */}
              {dress.videoUrl && (
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="absolute bottom-4 left-4 bg-bento-gold hover:bg-bento-gold-dark text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded-none flex items-center gap-1.5 shadow-sm cursor-pointer transition-all font-bold font-sans"
                >
                  <Film className="w-3.5 h-3.5" />
                  {showVideo ? "Photos" : "Défilé Vidéo"}
                </button>
              )}

              {/* Category Badge */}
              <div className="absolute top-4 left-4 bg-bento-dark text-white text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-none font-bold font-sans border border-bento-gold/25">
                {dress.category}
              </div>
            </div>

            {/* Thumbnail Selectors (Only shown if viewing photos) */}
            {!showVideo && dress.images.length > 1 && (
              <div className="p-4 bg-white shrink-0 flex gap-2 overflow-x-auto justify-center border-t border-bento-gold/15">
                {dress.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveImageIdx(idx);
                      setShowVideo(false);
                    }}
                    className={`w-14 h-14 rounded-none overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIdx === idx && !showVideo
                        ? 'border-bento-gold scale-102'
                        : 'border-transparent hover:border-bento-gold/30'
                    }`}
                  >
                    <img src={img} alt={`${dress.name} thumbnail ${idx}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Booking Engine */}
          <div className="w-full md:w-1/2 flex flex-col overflow-y-auto p-6 md:p-8 space-y-6 max-h-[90vh] md:max-h-none">
            {/* Dress Metadata */}
            <div className="space-y-2 pb-5 border-b border-bento-gold/15">
              <h2 className="text-2xl md:text-3xl font-serif font-light text-bento-text leading-tight uppercase tracking-wide">
                {dress.name}
              </h2>
              
              <div className="flex items-center gap-3">
                <span className="text-xl font-serif font-light text-bento-gold">
                  {dress.pricePerDay.toLocaleString()} DZD <span className="text-[10px] font-sans text-bento-text/40 font-normal uppercase tracking-wider">/ Jour de location</span>
                </span>
                
                {dress.available ? (
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                    Disponible
                  </span>
                ) : (
                  <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wider">
                    Réservée
                  </span>
                )}
              </div>
            </div>

            {/* Rich Description */}
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest text-bento-text/50 font-bold font-sans">
                À Propos de la Tenue
              </h4>
              <p className="text-xs text-bento-text/80 leading-relaxed font-sans">
                {dress.description}
              </p>
            </div>

            {/* Quick Perks / Information */}
            <div className="grid grid-cols-2 gap-3 bg-bento-rose p-3.5 rounded-none text-[10px] text-bento-text/85 border border-bento-gold/20 font-sans">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-bento-gold shrink-0" />
                <span>Nettoyage à sec inclus</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-bento-gold shrink-0" />
                <span>Retouches sur mesure</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-bento-gold shrink-0" />
                <span>Acompte sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-bento-gold shrink-0" />
                <span>Showroom physique à Tizi</span>
              </div>
            </div>

            {/* Booking Calendar Integration */}
            {dress.available ? (
              <div className="pt-2">
                <BookingCalendar
                  dress={dress}
                  existingBookings={existingBookings}
                  onInitiatePayment={onInitiatePayment}
                />
              </div>
            ) : (
              <div className="bg-rose-50/50 border border-rose-200/60 p-4 rounded-none text-center space-y-2 font-sans">
                <p className="text-xs text-rose-700 font-semibold uppercase tracking-wider">
                  Cette tenue est actuellement indisponible à la location.
                </p>
                <p className="text-xs text-rose-500 leading-relaxed">
                  N'hésitez pas à contacter notre équipe au <strong className="text-rose-600 font-bold">0550 12 34 56</strong> pour connaître la date de retour prévue ou découvrir des modèles similaires.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* FULLSCREEN INTERACTIVE ZOOM LIGHTBOX */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-zinc-950/98 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 select-none"
          >
            {/* Lightbox Top Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-55">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-bento-gold" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-bento-gold font-bold font-sans">
                    Détails des Broderies & Dentelles
                  </span>
                </div>
                <h3 className="font-serif font-light text-white text-base md:text-lg uppercase tracking-wide">
                  {dress.name}
                </h3>
              </div>

              {/* Counter and Instructions */}
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-white/40 text-[10px] font-mono tracking-widest uppercase">
                  Image {activeImageIdx + 1} sur {dress.images.length}
                </span>
                <span className="text-white/60 text-[9px] font-sans italic mt-0.5">
                  Glissez pour explorer ou utilisez le zoom double-clic
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsZoomOpen(false);
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-none transition-all border border-white/10 cursor-pointer shadow-lg"
                title="Fermer le zoom (Échap)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image Container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative w-full h-full my-4">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <span className="text-white/5 font-serif text-[10vw] select-none uppercase tracking-widest text-center font-bold">
                  Boutique Coup de Cœur
                </span>
              </div>

              <motion.img
                src={dress.images[activeImageIdx]}
                alt={dress.name}
                animate={{
                  scale: zoomLevel,
                  x: panOffset.x,
                  y: panOffset.y,
                }}
                transition={isDragging ? { type: "just" } : { type: "spring", stiffness: 300, damping: 30 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                onClick={handleImageClick}
                className={`max-w-full max-h-[70vh] object-contain select-none pointer-events-auto shadow-2xl transition-shadow ${
                  zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                }`}
                style={{ originX: 0.5, originY: 0.5 }}
              />
            </div>

            {/* Lightbox Footer Control Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 relative z-55">
              {/* Quick instructions for Mobile */}
              <div className="block md:hidden text-center">
                <span className="text-white/40 text-[9px] font-sans tracking-wide">
                  Double-cliquez pour zoomer • Glissez pour naviguer
                </span>
              </div>

              {/* Thumbnails to switch within Zoom Lightbox */}
              {dress.images.length > 1 ? (
                <div className="flex gap-2 max-w-full overflow-x-auto justify-center">
                  {dress.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveImageIdx(idx);
                        setZoomLevel(1);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className={`w-12 h-12 rounded-none overflow-hidden border transition-all shrink-0 cursor-pointer ${
                        activeImageIdx === idx
                          ? 'border-bento-gold scale-105 bg-bento-gold/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt={`${dress.name} zoom thumbnail ${idx}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-2" />
              )}

              {/* Controls floating panel */}
              <div className="bg-zinc-900 border border-white/10 px-4 py-2.5 flex items-center gap-4 shadow-xl">
                <button
                  type="button"
                  disabled={zoomLevel <= 1}
                  onClick={() => {
                    const nextZoom = Math.max(1, zoomLevel - 0.5);
                    setZoomLevel(nextZoom);
                    if (nextZoom === 1) setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1.5 hover:bg-white/10 text-white/85 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  title="Zoom Arrière"
                  aria-label="Zoom arrière"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <div className="w-20 text-center font-mono text-[10px] tracking-wider text-bento-gold font-bold">
                  {Math.round(zoomLevel * 100)}%
                </div>

                <button
                  type="button"
                  disabled={zoomLevel >= 4}
                  onClick={() => {
                    setZoomLevel(Math.min(4, zoomLevel + 0.5));
                  }}
                  className="p-1.5 hover:bg-white/10 text-white/85 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  title="Zoom Avant"
                  aria-label="Zoom avant"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="h-4 w-[1px] bg-white/10" />

                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1.5 hover:bg-white/10 text-white/85 hover:text-white cursor-pointer transition-colors flex items-center gap-1 text-[10px] font-sans font-semibold uppercase tracking-wider"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </button>
              </div>

              {/* Status information */}
              <div className="hidden md:flex items-center gap-2 text-white/40 text-[10px] font-sans">
                <Move className="w-3.5 h-3.5 text-bento-gold/50" />
                <span>Panoramique actif si zoomé</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
