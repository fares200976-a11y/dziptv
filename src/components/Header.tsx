import React, { useState } from "react";
import { Tv, User, Settings, LogOut, Wallet, ShieldCheck, Lock, Check, Menu, X } from "lucide-react";
import { Wholesaler } from "../types";
import logoImg from "../assets/images/kurtal_logo_1783773370106.jpg";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageToggle from "./LanguageToggle";

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
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    setView("retail");
    setMobileMenuOpen(false);
  };

  const handleNavClick = (view: "retail" | "wholesaler" | "admin") => {
    setView(view);
    setMobileMenuOpen(false);
  };

  const isDark = currentView !== "retail";

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 backdrop-blur-md ${
      currentView === "retail"
        ? "bg-white/95 border-slate-200 text-slate-800 shadow-sm"
        : "glass-panel border-b border-gray-800 bg-[#0b0f19]/90 text-gray-200"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0 shrink-0" onClick={handleLogoClick}>
            <div className="shrink-0 relative">
              <img 
                src={logoImg} 
                alt="Kurtal IPTV Logo" 
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-amber-500/40 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform duration-200"
                referrerPolicy="no-referrer" 
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="min-w-0 truncate">
              <span className={`font-display font-black text-base sm:text-xl tracking-tight transition-all duration-300 ${
                currentView === "retail"
                  ? "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-800 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300 bg-clip-text text-transparent"
              }`}>
                KURTAL IPTV
              </span>
              <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded font-extrabold hidden sm:inline ${
                currentView === "retail"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                PRO
              </span>
            </div>
          </div>

          {/* Center Navigation — visible uniquement à partir de md (tablette/desktop) */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-retail"
              onClick={() => handleNavClick("retail")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                currentView === "retail"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/40"
              }`}
            >
              <Tv className="h-4 w-4" />
              <span>{t("nav.shop")}</span>
            </button>

            <button
              id="nav-wholesaler"
              onClick={() => handleNavClick("wholesaler")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                currentView === "wholesaler"
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold"
                  : currentView === "retail"
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/40"
              }`}
            >
              <User className="h-4 w-4" />
              <span>{t("nav.wholesaler_space")}</span>
            </button>

            <LanguageToggle variant={currentView === "retail" ? "light" : "dark"} className="ml-1" />
          </nav>

          {/* Right Session Status — visible uniquement à partir de md */}
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            {loggedWholesaler ? (
              <div className="flex items-center space-x-3">
                <div className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
                  currentView === "retail"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-green-500/10 border-green-500/20 text-green-300"
                }`}>
                  <Wallet className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs font-semibold">
                    {loggedWholesaler.creditBalance.toLocaleString()} DA
                  </span>
                </div>
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
                    title={t("wholesaler.leave_panel")}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setView("wholesaler")}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer"
              >
                <User className="h-3.5 w-3.5" />
                <span>{t("nav.wholesaler_login")}</span>
              </button>
            )}
          </div>

          {/* Bouton hamburger — mobile uniquement */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg shrink-0 cursor-pointer transition-colors ${
              currentView === "retail"
                ? "text-slate-700 hover:bg-slate-100"
                : "text-gray-300 hover:bg-gray-800/60"
            }`}
            title="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {mobileMenuOpen && (
          <div className={`md:hidden pb-4 space-y-2 border-t animate-in fade-in slide-in-from-top-2 duration-200 ${
            currentView === "retail" ? "border-slate-200" : "border-gray-800"
          }`}>
            <button
              onClick={() => handleNavClick("retail")}
              className={`w-full flex items-center space-x-2 px-3 py-2.5 mt-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentView === "retail"
                  ? "bg-blue-600 text-white"
                  : isDark ? "text-gray-300 hover:bg-gray-800/60" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Tv className="h-4 w-4" />
              <span>{t("nav.shop")}</span>
            </button>

            <button
              onClick={() => handleNavClick("wholesaler")}
              className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentView === "wholesaler"
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold"
                  : isDark ? "text-gray-300 hover:bg-gray-800/60" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <User className="h-4 w-4" />
              <span>{t("nav.wholesaler_space")}</span>
            </button>

            {loggedWholesaler && (
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                isDark ? "bg-gray-800/60 border-gray-700 text-gray-200" : "bg-slate-100 border-slate-200 text-slate-800"
              }`}>
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                  <span className="text-xs font-medium truncate">{loggedWholesaler.businessName}</span>
                  <span className="text-xs font-semibold text-green-500 shrink-0">
                    {loggedWholesaler.creditBalance.toLocaleString()} DA
                  </span>
                </div>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  title={t("wholesaler.leave_panel")}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between px-3 pt-2">
              <span className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t("nav.language")}</span>
              <LanguageToggle variant={currentView === "retail" ? "light" : "dark"} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
