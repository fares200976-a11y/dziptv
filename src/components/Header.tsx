import { Tv, User, Settings, LogOut, Wallet, ShieldCheck } from "lucide-react";
import { Wholesaler } from "../types";

interface HeaderProps {
  currentView: "retail" | "wholesaler" | "admin";
  setView: (view: "retail" | "wholesaler" | "admin") => void;
  loggedWholesaler: Wholesaler | null;
  onLogout: () => void;
}

export default function Header({ currentView, setView, loggedWholesaler, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView("retail")}>
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <Tv className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-300 bg-clip-text text-transparent">
                DZ IPTV
              </span>
              <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-medium">
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
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
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
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/40"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Espace Grossiste</span>
            </button>

            <button
              id="nav-admin"
              onClick={() => setView("admin")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === "admin"
                  ? "bg-amber-600/10 text-amber-400 border border-amber-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/40"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
              <span className="hidden sm:inline-block px-1 py-0.2 text-[8px] bg-amber-500 text-black rounded font-bold uppercase tracking-widest scale-90">
                Live
              </span>
            </button>
          </nav>

          {/* Right Session Status */}
          <div className="flex items-center space-x-3">
            {loggedWholesaler ? (
              <div className="flex items-center space-x-3">
                {/* Balance display */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                  <Wallet className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-semibold text-green-300">
                    {loggedWholesaler.creditBalance.toLocaleString()} DA
                  </span>
                </div>
                {/* User capsule */}
                <div className="flex items-center space-x-2 bg-gray-800/60 px-3 py-1.5 rounded-lg border border-gray-700">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-200 truncate max-w-[100px] sm:max-w-[150px]">
                    {loggedWholesaler.businessName}
                  </span>
                  <button
                    onClick={onLogout}
                    title="Se déconnecter"
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
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
    </header>
  );
}
