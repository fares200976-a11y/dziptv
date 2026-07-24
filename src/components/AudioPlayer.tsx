import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioPlayerProps {
  url: string;
  title: string;
}

export default function AudioPlayer({ url, title }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and handle url changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.log('Audio autoplay prevented by browser. Waiting for user interaction.', err);
      });
    }

    return () => {
      audio.pause();
    };
  }, [url]);

  // Attempt to play on first user interaction to bypass browser autoplay policies
  useEffect(() => {
    const startAudioOnInteraction = () => {
      if (audioRef.current && isPlaying) {
        audioRef.current.play()
          .then(() => {
            cleanupListeners();
          })
          .catch((err) => {
            console.log("Autoplay play attempt failed", err);
          });
      }
    };

    const cleanupListeners = () => {
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('touchstart', startAudioOnInteraction);
      window.removeEventListener('scroll', startAudioOnInteraction);
    };

    window.addEventListener('click', startAudioOnInteraction);
    window.addEventListener('touchstart', startAudioOnInteraction);
    window.addEventListener('scroll', startAudioOnInteraction);

    // Also attempt immediate play
    if (audioRef.current && isPlaying) {
      audioRef.current.play().then(() => {
        cleanupListeners();
      }).catch(() => {});
    }

    return () => {
      cleanupListeners();
    };
  }, [isPlaying, url]);

  // Handle Play / Pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle Mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Handle Volume change
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [volume]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div id="ambient-audio-player" className="fixed bottom-4 left-4 z-40">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-none border border-bento-gold/30 shadow-md scale-90 sm:scale-100 transform origin-bottom-left"
      >
        {/* Equalizer animation when playing */}
        <div className="flex items-end gap-[2px] h-3 w-3 shrink-0">
          <motion.span 
            animate={isPlaying ? { height: [3, 12, 3] } : { height: 3 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="w-[2px] bg-bento-gold rounded-none"
          />
          <motion.span 
            animate={isPlaying ? { height: [5, 9, 5] } : { height: 5 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
            className="w-[2px] bg-bento-gold rounded-none"
          />
          <motion.span 
            animate={isPlaying ? { height: [2, 11, 2] } : { height: 2 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-[2px] bg-bento-gold rounded-none"
          />
        </div>

        {/* Info & Title */}
        <div className="hidden sm:block max-w-[90px] lg:max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap leading-none">
          <p className="text-[7.5px] uppercase tracking-widest text-bento-gold font-bold flex items-center gap-1 font-sans">
            <Music className="w-2 h-2 animate-pulse" /> Musique
          </p>
          <p className="text-[8.5px] text-bento-text font-serif italic truncate">
            {title}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 border-l border-bento-gold/10 pl-2 shrink-0">
          <button
            onClick={togglePlay}
            id="audio-play-pause-btn"
            className="w-8 h-8 rounded-none bg-bento-gold hover:bg-bento-gold-dark text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title={isPlaying ? "Mettre en pause" : "Écouter la musique d'ambiance"}
            aria-label={isPlaying ? "Mettre en pause" : "Écouter la musique d'ambiance"}
          >
            {isPlaying ? (
              <Pause className="w-2.5 h-2.5 fill-current text-white" />
            ) : (
              <Play className="w-2.5 h-2.5 fill-current text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-none bg-bento-rose border border-bento-gold/25 hover:bg-bento-gold/10 text-bento-gold flex items-center justify-center transition-colors cursor-pointer"
            title={isMuted ? "Activer le son" : "Désactiver le son"}
            aria-label={isMuted ? "Activer le son" : "Désactiver le son"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-2.5 h-2.5 text-bento-text/40" />
            ) : (
              <Volume2 className="w-2.5 h-2.5 text-bento-gold" />
            )}
          </button>

          {/* Volume slider on hover */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-12 h-1 bg-bento-rose rounded-none appearance-none cursor-pointer accent-bento-gold hidden md:block"
            title="Volume"
          />
        </div>
      </motion.div>
    </div>
  );
}
