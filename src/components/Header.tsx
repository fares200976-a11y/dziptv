import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Tv, User, Settings, LogOut, Wallet, ShieldCheck, Lock, Check, Menu, X, Search, Package, Copy, Key } from "lucide-react";
import { Wholesaler } from "../types";
import logoImg from "../assets/images/kurtal_logo_1783773370106.jpg";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageToggle from "./LanguageToggle";

interface HeaderProps {
  currentView: "retail" | "wholesaler" | "admin";
  setView: (view: "retail" | "wholesaler" | "admin") => void;
  loggedWholesaler: Wholesaler | null;
  onLogout: () => void;
  onFullLogout?: () => void;
  isAdminUnlocked: boolean;
  setAdminUnlocked: (unlocked: boolean) => void;
}

export default function Header({ 
  currentView, 
  setView, 
  loggedWholesaler, 
  onLogout,
  onFullLogout,
  isAdminUnlocked,
  setAdminUnlocked
}: HeaderProps) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");
  const [copiedField, setCopiedField] = useState("");

  const handleLogoClick = () => {
    setView("retail");
    setMobileMenuOpen(false);
  };

  const handleNavClick = (view: "retail" | "wholesaler" | "admin") => {
    setView(view);
    setMobileMenuOpen(false);
  };

  const openTrackModal = () => {
    setMobileMenuOpen(false);
    setShowTrackModal(true);
    setTrackQuery("");
    setTrackedOrders(null);
    setTrackError("");
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackError("");
    setTrackedOrders(null);
    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(trackQuery.trim())}`);
      const data = await res.json();
      if (res.ok) {
        const orders = data.orders || [];
        if (orders.length === 0) {
          setTrackError("Aucune commande trouvée avec ces informations. Vérifiez votre numéro de téléphone ou votre email.");
        } else {
          setTrackedOrders(orders);
        }
      } else {
        setTrackError(data.error || "Erreur lors de la recherche.");
      }
    } catch (err) {
      setTrackError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setTrackLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    }).catch(() => {});
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "En attente de traitement",
      completed: "Terminée",
      cancelled: "Annulée"
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status === "cancelled") return "bg-red-500/10 text-red-600 border-red-500/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  const isDark = currentView !== "retail";

  return (
    <>
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

            <LanguageToggle variant={currentView === "retail" ? "light" : "dark"} className="ml-1" />
          </nav>

          {/* Right Session Status — visible uniquement à partir de md */}
          <div className="hidden md:flex items-center space-x-2.5 shrink-0">
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
                    onClick={() => (onFullLogout || onLogout)()}
                    title="Se déconnecter complètement"
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick("wholesaler")}
                  className={`text-xs font-medium underline-offset-2 hover:underline transition-colors cursor-pointer ${
                    currentView === "retail" ? "text-slate-400 hover:text-slate-600" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t("nav.wholesaler_space")}
                </button>
                <button
                  onClick={openTrackModal}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md hover:shadow-blue-500/10 transition-all cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Suivre ma Commande</span>
                </button>
              </>
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

            {!loggedWholesaler && (
              <button
                onClick={openTrackModal}
                className="w-full flex items-center space-x-2 px-3 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
              >
                <Search className="h-4 w-4" />
                <span>Suivre ma Commande</span>
              </button>
            )}

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
                  onClick={() => { (onFullLogout || onLogout)(); setMobileMenuOpen(false); }}
                  title="Se déconnecter complètement"
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => handleNavClick("wholesaler")}
              className={`w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{t("nav.wholesaler_space")}</span>
            </button>

            <div className="flex items-center justify-between px-3 pt-2">
              <span className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t("nav.language")}</span>
              <LanguageToggle variant={currentView === "retail" ? "light" : "dark"} />
            </div>
          </div>
        )}
      </div>
    </header>

    {/* Fenêtre de suivi de commande, rendue via portail (hors du header pour
        éviter tout conflit de position "fixed" avec le flou du header). */}
    {showTrackModal && createPortal(
      (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowTrackModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">Suivre ma Commande</h3>
                  <p className="text-[11px] text-slate-400">Entrez votre téléphone, email ou n° de commande</p>
                </div>
              </div>
              <button
                onClick={() => setShowTrackModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: 0553494318 ou #o-abc123"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shrink-0"
                >
                  {trackLoading ? "..." : "Chercher"}
                </button>
              </form>

              {trackError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {trackError}
                </div>
              )}

              {trackedOrders && trackedOrders.length > 0 && (
                <div className="space-y-3">
                  {trackedOrders.map((order: any) => (
                    <div key={order.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-slate-400">#{order.id}</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${statusColor(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 font-semibold">{order.productName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {order.priceDA?.toLocaleString()} DA
                      </p>

                      {order.credentials?.satCode && (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider flex items-center gap-1"><Key className="h-3 w-3" /> Votre Code</span>
                          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 font-mono text-xs">
                            <span className="text-slate-800 select-all">{order.credentials.satCode}</span>
                            <button onClick={() => handleCopy(order.credentials.satCode, "code")} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {order.credentials?.m3uUrl && (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1"><Key className="h-3 w-3" /> Vos Accès IPTV</span>
                          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                            <span className="text-slate-800 truncate select-all">{order.credentials.m3uUrl}</span>
                            <button onClick={() => handleCopy(order.credentials.m3uUrl, "m3u")} className="text-slate-400 hover:text-slate-900 cursor-pointer shrink-0 ml-2">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {order.shippingWilaya && (
                        <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-xs text-slate-500">
                          <Package className="h-3.5 w-3.5" />
                          <span>Livraison vers {order.shippingWilaya} ({order.shippingType === "domicile" ? "à domicile" : "au bureau"})</span>
                        </div>
                      )}

                      {copiedField && (
                        <p className="text-[10px] text-emerald-600 font-semibold">✓ Copié !</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      document.body
    )}
    </>
  );
}
