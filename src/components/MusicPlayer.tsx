import React, { useState, useEffect, useRef } from "react";
import { Music, Volume2, VolumeX, Play, Pause } from "lucide-react";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    audio.loop = true;
    audio.volume = 0.25; // elegant low volume
    audio.muted = true; // requis par les navigateurs pour autoriser l'autoplay
    audioRef.current = audio;

    // Démarrage automatique en muet dès le chargement de la page (autorisé par
    // tous les navigateurs). Le son se déclenche ensuite au premier clic/toucher.
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(err => {
        console.log("Autoplay muet bloqué, en attente d'un geste utilisateur.", err);
      });

    const handleGesture = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
        setIsMuted(false);
        if (!isPlaying) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };

    window.addEventListener("click", handleGesture);
    window.addEventListener("keydown", handleGesture);
    window.addEventListener("touchstart", handleGesture);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => console.error(err));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-[#0d1222]/95 border border-gray-800 rounded-full py-1.5 px-3 shadow-2xl flex items-center space-x-2.5 animate-in slide-in-from-bottom duration-500 backdrop-blur-md">
      <div className="flex items-center space-x-1.5">
        <div className={`p-1.5 rounded-full ${isPlaying ? "bg-amber-500 text-black animate-spin duration-1000" : "bg-gray-800 text-gray-400"}`}>
          <Music className="h-3 w-3" />
        </div>
        <span className="text-[10px] font-mono font-medium text-gray-300 hidden sm:inline max-w-[140px] truncate">
          {isPlaying && isMuted ? "🔇 Cliquez pour le son" : isPlaying ? "DZ Premium Loop" : "Musique en Pause"}
        </span>
      </div>

      <div className="flex items-center space-x-1 border-l border-gray-800 pl-2">
        <button
          onClick={togglePlay}
          title={isPlaying ? "Pause" : "Play"}
          className="p-1 hover:text-white text-gray-400 transition-colors"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3 fill-current" />
          ) : (
            <Play className="h-3 w-3 fill-current" />
          )}
        </button>

        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          className="p-1 hover:text-white text-gray-400 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
          )}
        </button>
      </div>
    </div>
  );
}
