import React, { useState } from "react";
import { Tv, User, Settings, LogOut, Wallet, ShieldCheck, Lock, Check } from "lucide-react";
import { Wholesaler } from "../types";
import logoImg from "../assets/images/kurtal_logo_1783773370106.jpg";

interface HeaderProps {
  currentView: "retail" | "wholesaler" | "admin";
  setView: (view: "retail" | "wholesaler" | "admin") => void;
  loggedWholesaler: Wholesaler | null;
  onLogout: () => void;
  isAdminUnlocked: boolean;
  setAdminUnlocked: (unlocked: boolean) => void;
}

export default function Header({ 
  currentView, 
  setView, 
  loggedWholesaler, 
  onLogout,
  isAdminUnlocked,
  setAdminUnlocked
}: HeaderProps) {
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [secretError, setSecretError] = useState("");
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  const handleLogoClick = () => {
    if (isAdminUnlocked) {
      setView("admin");
    } else {
      setShowSecretModal(true);
      setAdminUsername("");
      setAdminPassword("");
      setSecretError("");
      setUnlockSuccess(false);
    }
  };

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCredentials = adminUsername.trim().toLowerCase() === "fares2026" && adminPassword === "Fares14081976";

    if (isCredentials) {
      setUnlockSuccess(true);
      setTimeout(() => {
        setAdminUnlocked(true);
        localStorage.setItem("adminUnlocked", "true");
        setShowSecretModal(false);
        setView("admin");
      }, 1000);
    } else {
      setSecretError("Utilisateur ou mot de passe incorrect.");
    }
  };

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 backdrop-blur-md ${
      currentView === "retail"
        ? "bg-white/95 border-slate-200 text-slate-800 shadow-sm"
        : "glass-panel border-b border-gray-800 bg-[#0b0f19]/90 text-gray-200"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand with Secret Admin Panel Access */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleLogoClick}>
            <div className="shrink-0 relative">
              <img 
                src={logoImg} 
                alt="Kurtal IPTV Logo" 
                className="h-10 w-10 rounded-full object-cover border-2 border-amber-500/40 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform duration-200"
                referrerPolicy="no-referrer" 
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <span className={`font-display font-black text-xl tracking-tight transition-all duration-300 ${
                currentView === "retail"
                  ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-800 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300 bg-clip-text text-transparent"
              }`}>
                KURTAL IPTV
              </span>
              <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded font-extrabold ${
                currentView === "retail"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                PRO
              </span>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              id="nav-retail"
              onClick={() => setView("retail")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === "retail"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/40"
              }`}
            >
              <Tv className="h-4 w-4" />
              <span>Boutique Détail</span>
            </button>

            <button
              id="nav-wholesaler"
              onClick={() => setView("wholesaler")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === "wholesaler"
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold"
                  : currentView === "retail"
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/40"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Espace Grossiste</span>
            </button>

            {/* Admin Panel button - visible ONLY if unlocked */}
            {isAdminUnlocked && (
              <button
                id="nav-admin"
                onClick={() => setView("admin")}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentView === "admin"
                    ? "bg-amber-600/10 text-amber-400 border border-amber-500/20 font-semibold"
                    : currentView === "retail"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/40"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Admin Panel</span>
                <span className="hidden sm:inline-block px-1 py-0.2 text-[8px] bg-amber-500 text-black rounded font-bold uppercase tracking-widest scale-90">
                  Live
                </span>
              </button>
            )}
          </nav>

          {/* Right Session Status */}
          <div className="flex items-center space-x-3">
            {loggedWholesaler ? (
              <div className="flex items-center space-x-3">
                {/* Balance display */}
                <div className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
                  currentView === "retail"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-green-500/10 border-green-500/20 text-green-300"
                }`}>
                  <Wallet className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs font-semibold">
                    {loggedWholesaler.creditBalance.toLocaleString()} DA
                  </span>
                </div>
                {/* User capsule */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                  currentView === "retail"
                    ? "bg-slate-100 border-slate-200 text-slate-800"
                    : "bg-gray-800/60 border-gray-700 text-gray-200"
                }`}>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium truncate max-w-[100px] sm:max-w-[150px]">
                    {loggedWholesaler.businessName}
                  </span>
                  <button
                    onClick={onLogout}
                    title="Se déconnecter"
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setView("wholesaler")}
                className="hidden md:flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer"
              >
                <User className="h-3.5 w-3.5" />
                <span>Espace Client / Grossiste</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Secret Admin Unlock Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-full mb-2">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">KURTAL IPTV Administrateur</h3>
              <p className="text-xs text-gray-400">
                Entrez le code secret sur le logo pour déverrouiller l'accès.
              </p>
            </div>

            <form onSubmit={handleSecretSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Nom d'utilisateur</label>
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-gray-700 font-sans"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-gray-700 font-sans"
                  />
                </div>
                {secretError && (
                  <p className="mt-1.5 text-xs text-red-400 text-center">{secretError}</p>
                )}
              </div>

              {unlockSuccess ? (
                <div className="flex items-center justify-center space-x-2 py-2.5 text-green-400 bg-green-500/10 rounded-lg border border-green-500/20 text-xs font-semibold">
                  <Check className="h-4 w-4" />
                  <span>Accès Déverrouillé !</span>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSecretModal(false)}
                    className="flex-1 py-2 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/10"
                  >
                    Valider
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
