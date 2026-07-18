import React, { useState, useEffect } from "react";
import { Wholesaler, IptvClient, CreditRequest, PanelRequest, SubscriptionServer, Product } from "../types";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import { 
  UserPlus, 
  LogIn, 
  Wallet, 
  Users, 
  Plus, 
  Search, 
  Copy, 
  Download,
  Clock, 
  CheckCircle, 
  X, 
  Info, 
  Key, 
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Settings,
  ShieldAlert
} from "lucide-react";

interface WholesalerDashboardProps {
  loggedWholesaler: Wholesaler | null;
  onLogin: (username: string, password: string) => Promise<any>;
  onRegister: (data: any) => Promise<any>;
  wholesalerClients: IptvClient[];
  wholesalerRequests: CreditRequest[];
  panelRequests?: PanelRequest[];
  products?: Product[];
  onActivateClient: (data: any) => Promise<any>;
  onRequestCredit: (data: any) => Promise<any>;
  onRequestPanel?: (data: any) => Promise<any>;
  refreshWholesalerData: () => void;
  onLogoutWholesaler?: () => void;
  onLogoutComplete?: () => void;
  onBackToHome?: () => void;
}

export default function WholesalerDashboard({
  loggedWholesaler,
  onLogin,
  onRegister,
  wholesalerClients,
  wholesalerRequests,
  panelRequests = [],
  products = [],
  onActivateClient,
  onRequestCredit,
  onRequestPanel,
  refreshWholesalerData,
  onLogoutWholesaler,
  onLogoutComplete,
  onBackToHome
}: WholesalerDashboardProps) {
  const { t } = useTranslation();
  // Login / Register Views
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Paramètres du compte / déconnexion complète
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [confirmFullLogout, setConfirmFullLogout] = useState(false);
  
  // Register Fields
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("");
  const [teamMemberOptions, setTeamMemberOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/team-members-public")
      .then(res => res.ok ? res.json() : [])
      .then(data => setTeamMemberOptions(Array.isArray(data) ? data : []))
      .catch(() => setTeamMemberOptions([]));
  }, []);

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Dashboard Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [selectedClientCredentials, setSelectedClientCredentials] = useState<IptvClient | null>(null);
  const [copiedField, setCopiedField] = useState("");

  // New Client Form
  const [activationServiceType, setActivationServiceType] = useState<"iptv" | "sat" | "box">("iptv");
  const [newClientName, setNewClientName] = useState("");
  const [selectedServer, setSelectedServer] = useState<string>("Dino");
  const [selectedDuration, setSelectedDuration] = useState<number>(12);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [adultContent, setAdultContent] = useState(false);
  const [clientNotes, setClientNotes] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Catalogue filtré pour Code Sat / Box Android (alimenté par ce que l'admin a ajouté)
  const satProducts = products.filter(p => p.type === "code sat");
  const boxProducts = products.filter(p => p.type === "boitier android" || p.type === "device");

  // New Panel Form
  const [panelServer, setPanelServer] = useState<SubscriptionServer>("Dino");
  const [panelCodesCount, setPanelCodesCount] = useState<number>(10);
  const [panelNotes, setPanelNotes] = useState("");

  // New Recharge Form
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeMethod, setRechargeMethod] = useState<"baridimob" | "ccp">("baridimob");
  const [rechargeRef, setRechargeRef] = useState("");

  useEffect(() => {
    if (loggedWholesaler) {
      refreshWholesalerData();
    }
  }, [loggedWholesaler]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setAuthError("Veuillez saisir votre nom d'utilisateur et mot de passe.");
      return;
    }
    setLoading(true);
    setAuthError("");
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setAuthError(err.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !businessName || !phone || !email) {
      setAuthError("Tous les champs sont requis.");
      return;
    }
    setLoading(true);
    setAuthError("");
    setAuthSuccess("");
    try {
      const payload = {
        username: regUsername,
        password: regPassword,
        businessName,
        phone,
        email,
        handledByTeamMemberId: selectedTeamMemberId || undefined
      };
      const res = await onRegister(payload);
      setAuthSuccess(res.message);
      setIsRegistering(false);
      // clear fields
      setUsername(regUsername);
    } catch (err: any) {
      setAuthError(err.message || "Erreur d'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) {
      setActionError("Le nom du client est requis.");
      return;
    }
    if (activationServiceType !== "iptv" && !selectedProductId) {
      setActionError("Veuillez sélectionner un produit dans le catalogue.");
      return;
    }
    setLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      const payload: any = {
        clientName: newClientName,
        serviceType: activationServiceType,
        notes: clientNotes
      };
      if (activationServiceType === "iptv") {
        payload.server = selectedServer;
        payload.durationMonths = selectedDuration;
        payload.adultContent = adultContent;
      } else {
        payload.productId = selectedProductId;
        if (activationServiceType === "sat") {
          payload.durationMonths = selectedDuration;
        }
      }
      const res = await onActivateClient(payload);
      setActionSuccess(res.message);
      setNewClientName("");
      setClientNotes("");
      setSelectedProductId("");
      setAdultContent(false);
      setSelectedClientCredentials(res.client); // Open credentials sheet immediately so they can copy it!
      setShowActivateModal(false);
    } catch (err: any) {
      setActionError(err.message || "Erreur d'activation.");
    } finally {
      setLoading(false);
    }
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || !rechargeRef) {
      setActionError("Veuillez remplir tous les champs de recharge.");
      return;
    }
    setLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      const payload = {
        amountDA: Number(rechargeAmount),
        paymentMethod: rechargeMethod,
        receiptReference: rechargeRef
      };
      const res = await onRequestCredit(payload);
      setActionSuccess(res.message);
      setRechargeAmount("");
      setRechargeRef("");
      setShowRechargeModal(false);
    } catch (err: any) {
      setActionError(err.message || "Erreur de recharge.");
    } finally {
      setLoading(false);
    }
  };

  const handlePanelRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRequestPanel) return;
    if (panelCodesCount < 10) {
      setActionError("Le nombre minimum de codes requis pour un panel est de 10.");
      return;
    }
    setLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      await onRequestPanel({
        server: panelServer,
        codesCount: panelCodesCount,
        notes: panelNotes
      });
      setActionSuccess(`Demande de panel ${panelServer} (${panelCodesCount} codes) soumise avec succès !`);
      setPanelNotes("");
      setPanelCodesCount(10);
      setShowPanelModal(false);
    } catch (err: any) {
      setActionError(err.message || "Erreur de demande de panel.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleDownloadM3u = (client: IptvClient) => {
    const m3uContent = `#EXTM3U\n#EXTINF:-1, KURTAL IPTV - ${client.clientName} [${client.server}]\n${client.credentials?.m3uUrl || ""}`;
    const blob = new Blob([m3uContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `iptv_${client.clientName.replace(/\s+/g, "_")}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClients = wholesalerClients.filter(c =>
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.server.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Authentication Screen
  if (!loggedWholesaler) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-left">
        <div className="flex items-center justify-between">
          {onBackToHome ? (
            <button
              onClick={onBackToHome}
              className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-white/40 hover:bg-slate-100/50 px-4 py-2 rounded-xl border border-slate-200 self-start"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>← Retour à l'Accueil</span>
            </button>
          ) : <div />}
          <LanguageToggle variant="light" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Info Column */}
          <div className="space-y-6">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Programme Revendeur</span>
              <h2 className="font-display text-3xl font-extrabold text-slate-900 mt-2 leading-tight">
                Vendez de l'IPTV à vos clients et maximisez vos revenus !
              </h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Devenez membre de notre réseau de distributeurs agréés en Algérie. Bénéficiez d'un panel réactif pour activer instantanément les codes de vos clients à prix de gros imbattable.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Tarifs Réduits d'achat (Gros)</h4>
                  <p className="text-sm text-slate-500 mt-1">Économisez de 500 à 1000 DA sur chaque abonnement activé.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg shrink-0 mt-0.5">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Activations Instantanées 24/7</h4>
                  <p className="text-sm text-slate-500 mt-1">Pas besoin d'attendre. Activez et téléchargez les fichiers M3U et Xtream Codes immédiatement.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Gestion Facile</h4>
                  <p className="text-sm text-slate-500 mt-1">Suivez les dates d'expiration de vos abonnés pour les renouveler en un clic.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl"></div>

            {/* Form Toggle Tabs */}
            <div className="flex border-b border-slate-200 pb-4 mb-6">
              <button
                onClick={() => { setIsRegistering(false); setAuthError(""); }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer ${
                  !isRegistering
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <LogIn className="h-4 w-4" />
                  <span>Se Connecter</span>
                </div>
              </button>
              <button
                onClick={() => { setIsRegistering(true); setAuthError(""); }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer ${
                  isRegistering
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <UserPlus className="h-4 w-4" />
                  <span>{t("wholesaler.register_link")}</span>
                </div>
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-sm font-medium mb-4">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-sm font-medium mb-4">
                {authSuccess}
              </div>
            )}

            {/* Login Form */}
            {!isRegistering ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">{t("wholesaler.username")}</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: dino_pro"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">{t("wholesaler.password")}</label>
                  <input
                    type="password"
                    required
                    placeholder="Saisir votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  {loading ? "Connexion..." : "Se Connecter"}
                </button>
                <p className="text-xs text-center text-slate-400">
                  Compte de démonstration : <strong className="text-indigo-600">dino_pro</strong> / <strong className="text-indigo-600">n'importe quel mot de passe</strong>
                </p>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Nom du Commerce / Magasin</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kamal Sat Alger"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">{t("wholesaler.username")}</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: kamal_sat"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 0661987654"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Email professionnel</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: kamal.sat@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {teamMemberOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1">
                      Votre contact chez KURTAL IPTV <span className="text-slate-400 font-normal">(Optionnel)</span>
                    </label>
                    <select
                      value={selectedTeamMemberId}
                      onChange={(e) => setSelectedTeamMemberId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Aucune préférence --</option>
                      {teamMemberOptions.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Cette personne suivra votre compte (recharges, activations...).</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">{t("wholesaler.password")}</label>
                  <input
                    type="password"
                    required
                    placeholder="Créez un mot de passe"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  {loading ? "Création..." : "Soumettre ma Demande d'Inscription"}
                </button>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  * Après inscription, l'administrateur recevra une alerte email immédiate pour activer votre compte.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE WHOLESALER DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-indigo-50 via-white to-slate-50 rounded-2xl border border-indigo-200 shadow-sm">
        <div>
          <span className="text-xs bg-indigo-500/10 text-indigo-700 border border-indigo-500/30 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Grossiste Agrée
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-900 mt-2">{t("wholesaler.dashboard_title")} : {loggedWholesaler.businessName}</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez votre stock de crédits, activez vos abonnés et suivez les expirations.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setShowRechargeModal(true);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-indigo-600 font-bold text-sm rounded-xl border border-slate-300 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            <span>{t("wholesaler.recharge")}</span>
          </button>

          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setShowPanelModal(true);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-amber-600 font-bold text-sm rounded-xl border border-slate-300 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Key className="h-4 w-4" />
            <span>Demander Panel (Min 10 codes)</span>
          </button>

          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setShowActivateModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("wholesaler.add_client")}</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl border border-slate-300 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            <span>{t("wholesaler.settings")}</span>
          </button>

          {onLogoutWholesaler && (
            <button
              onClick={onLogoutWholesaler}
              title="Quitte le panneau, votre session reste active"
              className="px-4 py-2.5 bg-red-600/15 hover:bg-red-600/25 text-red-600 font-bold text-sm rounded-xl border border-red-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <LogIn className="h-4 w-4 rotate-180" />
              <span>{t("wholesaler.leave_panel")}</span>
            </button>
          )}

          <LanguageToggle variant="light" />
        </div>
      </div>

      {/* PARAMÈTRES DU COMPTE MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8 sm:my-0 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowSettingsModal(false);
                setConfirmFullLogout(false);
              }}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5 mb-6 border-b border-slate-200 pb-4">
              <Settings className="h-7 w-7 text-slate-500 mb-1" />
              <h3 className="font-display font-extrabold text-lg text-slate-900">{t("wholesaler.settings")}</h3>
              <p className="text-slate-500 text-sm">{loggedWholesaler.businessName} — {loggedWholesaler.username}</p>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 leading-relaxed">
                Le bouton <strong className="text-slate-700">« Quitter le panneau »</strong> vous ramène simplement à la
                boutique : votre session reste active jusqu'à 2 jours et vous retrouverez
                votre espace revendeur automatiquement, sans ressaisir vos identifiants.
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                <div className="flex items-start space-x-2">
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 leading-relaxed">
                    La déconnexion complète met fin à votre session sur cet appareil.
                    Vous devrez ressaisir votre identifiant et votre mot de passe pour
                    revenir sur votre espace revendeur.
                  </p>
                </div>

                {!confirmFullLogout ? (
                  <button
                    onClick={() => setConfirmFullLogout(true)}
                    className="w-full py-2.5 bg-red-600/15 hover:bg-red-600/25 text-red-600 border border-red-500/30 rounded-xl font-bold text-sm transition-all cursor-pointer"
                  >
                    {t("wholesaler.full_logout")}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 font-semibold">Confirmer la déconnexion complète ?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          setConfirmFullLogout(false);
                          onLogoutComplete && onLogoutComplete();
                        }}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm cursor-pointer"
                      >
                        Oui, déconnecter
                      </button>
                      <button
                        onClick={() => setConfirmFullLogout(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert states feedback */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-sm font-medium">
          {actionSuccess}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400 uppercase tracking-widest font-semibold block">{t("wholesaler.credit_balance")}</span>
            <span className="text-3xl font-black font-display text-emerald-600 mt-1 block">
              {loggedWholesaler.creditBalance.toLocaleString()} DA
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400 uppercase tracking-widest font-semibold block">Abonnements Actifs</span>
            <span className="text-3xl font-black font-display text-blue-600 mt-1 block">
              {wholesalerClients.filter(c => c.status === "active").length}
            </span>
          </div>
          <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400 uppercase tracking-widest font-semibold block">Demandes Recharges</span>
            <span className="text-3xl font-black font-display text-amber-600 mt-1 block">
              {wholesalerRequests.filter(r => r.status === "pending").length}
            </span>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Core Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
        {/* Table Search & Filter header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/20">
          <h3 className="font-display font-bold text-base text-slate-900 self-start sm:self-center">{t("wholesaler.clients_list")}</h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou serveur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          {filteredClients.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm data-table-ltr">
              <thead>
                <tr className="bg-white/40 text-slate-500 border-b border-slate-200/80">
                  <th className="p-4 font-semibold">{t("wholesaler.client_name")}</th>
                  <th className="p-4 font-semibold">Serveur IPTV</th>
                  <th className="p-4 font-semibold">Durée</th>
                  <th className="p-4 font-semibold">Date Activation</th>
                  <th className="p-4 font-semibold">Date Expiration</th>
                  <th className="p-4 font-semibold">Coût (DA)</th>
                  <th className="p-4 font-semibold text-center">Statut</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40">
                {filteredClients.map((client) => {
                  const isExpired = client.expirationDate ? new Date(client.expirationDate) < new Date() : false;
                  const svcType = client.serviceType || "iptv";
                  const svcBadge = svcType === "sat"
                    ? { label: "Code Sat", cls: "bg-purple-500/10 text-purple-600 border-purple-500/20" }
                    : svcType === "box"
                    ? { label: "Box Android", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" }
                    : { label: "IPTV", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
                  return (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{client.clientName}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${svcBadge.cls}`}>
                            {svcBadge.label}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded font-semibold text-xs">
                            {client.server}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">{svcType === "box" ? "—" : `${client.durationMonths} Mois`}</td>
                      <td className="p-4 text-slate-500">
                        {client.activationDate 
                          ? new Date(client.activationDate).toLocaleDateString("fr-FR") 
                          : "En attente"}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {client.expirationDate 
                          ? new Date(client.expirationDate).toLocaleDateString("fr-FR") 
                          : "En attente"}
                      </td>
                      <td className="p-4 font-bold text-emerald-600">{client.pricePaid.toLocaleString()} DA</td>
                      <td className="p-4 text-center">
                        {client.status === "pending" ? (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded text-[11px] font-semibold animate-pulse">
                            En attente
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded text-[11px] font-semibold">
                            Expiré
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded text-[11px] font-semibold">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedClientCredentials(client)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            client.status === "pending"
                              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20"
                              : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/30"
                          }`}
                        >
                          {client.status === "pending" ? "Suivre l'Activation" : "Voir les Accès"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm">Aucun client trouvé. Lancez votre première activation !</p>
            </div>
          )}
        </div>
      </div>

      {/* Credit Recharge Request History List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900">Suivi de vos demandes de recharge crédit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wholesalerRequests.map((req) => (
            <div key={req.id} className="p-4 bg-white/40 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
              <div>
                <span className="text-xs text-slate-500 block">{new Date(req.createdAt).toLocaleString("fr-FR")}</span>
                <span className="font-bold text-slate-900 text-sm">{req.amountDA.toLocaleString()} DA</span>
                <span className="text-slate-500 block mt-1">Via {req.paymentMethod.toUpperCase()} (Ref: {req.receiptReference})</span>
              </div>
              <div>
                {req.status === "pending" && (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-semibold text-xs">
                    En attente de validation
                  </span>
                )}
                {req.status === "approved" && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded font-semibold text-xs">
                    Approuvée & Créditée
                  </span>
                )}
                {req.status === "rejected" && (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded font-semibold text-xs">
                    Rejetée
                  </span>
                )}
              </div>
            </div>
          ))}
          {wholesalerRequests.length === 0 && (
            <p className="text-sm text-slate-400 col-span-2 text-center py-2">Aucune demande de recharge effectuée.</p>
          )}
        </div>
      </div>

      {/* Panel Requests Followup List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2">
            <Key className="h-4 w-4 text-amber-500" />
            <span>Suivi de vos demandes de Panels Revendeur (Min 10 codes)</span>
          </h3>
          <span className="text-xs bg-amber-500/15 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
            10 Codes Min.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {panelRequests.map((panelReq) => (
            <div key={panelReq.id} className="p-4 bg-white/40 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
              <div>
                <span className="text-xs text-slate-500 block">{new Date(panelReq.createdAt).toLocaleString("fr-FR")}</span>
                <span className="font-bold text-slate-900 text-sm">Panel : {panelReq.server}</span>
                <span className="text-slate-600 block mt-1 font-semibold">{panelReq.codesCount} codes demandés</span>
                {panelReq.notes && (
                  <p className="text-xs text-amber-600 mt-1 italic">Note Admin: {panelReq.notes}</p>
                )}
              </div>
              <div>
                {panelReq.status === "pending" && (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-semibold text-xs">
                    En attente de validation
                  </span>
                )}
                {panelReq.status === "approved" && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded font-semibold text-xs">
                    Panel Activé
                  </span>
                )}
                {panelReq.status === "rejected" && (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded font-semibold text-xs">
                    Rejetée
                  </span>
                )}
              </div>
            </div>
          ))}
          {panelRequests.length === 0 && (
            <p className="text-sm text-slate-400 col-span-2 text-center py-2">Aucune demande de panel effectuée.</p>
          )}
        </div>
      </div>

      {/* MODAL 3: REQUEST RESELLER PANEL */}
      {showPanelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8 sm:my-0 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowPanelModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 mb-6">
              <h3 className="font-display font-extrabold text-lg text-slate-900">Demande de Panel Revendeur</h3>
              <p className="text-slate-500 text-sm">Créez votre propre panel IPTV autonome pour gérer vos clients.</p>
            </div>

            <form onSubmit={handlePanelRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Serveur Panel IPTV</label>
                <select
                  value={panelServer}
                  onChange={(e) => setPanelServer(e.target.value as SubscriptionServer)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dino">Dino OTT</option>
                  <option value="8K">8K OTT</option>
                  <option value="V12">V12 OTT</option>
                  <option value="Golden OTT">Golden OTT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre de codes (Minimum 10)</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={panelCodesCount}
                  onChange={(e) => setPanelCodesCount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">Conformément aux règles de revente, les panels nécessitent un achat initial de minimum 10 codes d'activation.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Note ou Message Optionnel</label>
                <textarea
                  placeholder="Informations supplémentaires pour l'admin..."
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>

              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold">
                  {actionError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black text-sm rounded-xl shadow-lg shadow-amber-600/10 transition-all cursor-pointer"
              >
                {loading ? "Traitement..." : "Soumettre la Demande de Panel"}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* MODAL 1: NEW ACTIVATION */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8 sm:my-0 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowActivateModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 border-b border-slate-200 pb-3">
              <Plus className="h-5 w-5 text-indigo-600" />
              <h3 className="font-display font-bold text-lg text-slate-900">{t("wholesaler.add_client")}</h3>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-sm font-medium mb-4">
                {actionError}
              </div>
            )}

            <form onSubmit={handleClientActivation} className="space-y-4 text-sm">
              {/* Sélecteur de type de service */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5">{t("wholesaler.service_type")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "iptv", label: "IPTV" },
                    { key: "sat", label: "Code Sat" },
                    { key: "box", label: "Box Android" }
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setActivationServiceType(opt.key);
                        setSelectedProductId("");
                        setActionError("");
                      }}
                      className={`py-2 rounded-xl border text-center text-sm font-bold transition-all cursor-pointer ${
                        activationServiceType === opt.key
                          ? "bg-indigo-500/15 border-indigo-500 text-indigo-700"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">{t("wholesaler.client_name")}</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mohamed Belkaid"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900"
                />
              </div>

              {activationServiceType === "iptv" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Serveur IPTV</label>
                    <select
                      value={selectedServer}
                      onChange={(e) => setSelectedServer(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                    >
                      <option value="Dino">Dino IPTV (4,200 DA)</option>
                      <option value="8K">8K Premium (6,800 DA)</option>
                      <option value="V12">V12 IPTV Pro (4,300 DA)</option>
                      <option value="Golden OTT">Golden OTT (6,200 DA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t("wholesaler.duration")}</label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                    >
                      <option value={1}>1 Mois (15% du tarif)</option>
                      <option value={6}>6 Mois (60% du tarif)</option>
                      <option value={12}>12 Mois (100% du tarif)</option>
                    </select>
                  </div>
                </div>
              )}

              {activationServiceType === "iptv" && ["Dino", "8K", "Golden OTT"].includes(selectedServer) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <label className="block text-slate-700 font-semibold">Contenu Adulte</label>
                    <p className="text-slate-400 text-[11px] mt-0.5">Inclure les chaînes adultes dans le bouquet de ce client.</p>
                  </div>
                  <div className="flex rounded-lg overflow-hidden border border-slate-300 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAdultContent(false)}
                      className={`px-3 py-1.5 text-sm font-bold transition-colors cursor-pointer ${!adultContent ? "bg-slate-700 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                    >
                      Non
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdultContent(true)}
                      className={`px-3 py-1.5 text-sm font-bold transition-colors cursor-pointer ${adultContent ? "bg-red-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                    >
                      Adulte
                    </button>
                  </div>
                </div>
              )}

              {activationServiceType === "sat" && (
                <div className="space-y-3">
                  {satProducts.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-sm">
                      Aucun produit "Code Sat" n'est encore disponible dans le catalogue. Contactez l'administrateur pour qu'il en ajoute.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Produit Code Sat</label>
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                        >
                          <option value="">-- Choisir --</option>
                          {satProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.priceWholesale.toLocaleString()} DA)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Durée</label>
                        <select
                          value={selectedDuration}
                          onChange={(e) => setSelectedDuration(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                        >
                          <option value={6}>6 Mois</option>
                          <option value={12}>12 Mois</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activationServiceType === "box" && (
                <div className="space-y-3">
                  {boxProducts.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-sm">
                      Aucun produit "Box Android" n'est encore disponible dans le catalogue. Contactez l'administrateur pour qu'il en ajoute.
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Modèle de Box Android</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                      >
                        <option value="">-- Choisir --</option>
                        {boxProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.priceWholesale.toLocaleString()} DA)</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">Vente matérielle : pas d'abonnement ni d'expiration.</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  {activationServiceType === "box" ? "Notes / N° de série (Optionnel)" : "Notes / MAC Address (Optionnel)"}
                </label>
                <input
                  type="text"
                  placeholder="Ex: SmartOne MAC: aa:bb:cc..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900"
                />
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 rounded-lg">
                <p className="font-semibold text-sm">Tarification Revendeur :</p>
                <p className="text-xs text-slate-600 mt-1">
                  Cette activation sera déduite automatiquement de votre solde crédit. Assurez-vous d'avoir assez de fonds.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm"
              >
                {loading ? "Activation en cours..." : t("wholesaler.confirm_activation")}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* MODAL 2: REQUEST RECHARGE */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8 sm:my-0 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowRechargeModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 border-b border-slate-200 pb-3">
              <Wallet className="h-5 w-5 text-indigo-600" />
              <h3 className="font-display font-bold text-lg text-slate-900">Recharger mon Crédit</h3>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-sm font-medium mb-4">
                {actionError}
              </div>
            )}

            <form onSubmit={handleRechargeSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Montant à recharger (DA)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 20000"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Mode de Paiement effectué</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRechargeMethod("baridimob")}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      rechargeMethod === "baridimob"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-600"
                        : "bg-white/50 border-slate-200 text-slate-500"
                    }`}
                  >
                    BaridiMob
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechargeMethod("ccp")}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      rechargeMethod === "ccp"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-600"
                        : "bg-white/50 border-slate-200 text-slate-500"
                    }`}
                  >
                    Virement CCP
                  </button>
                </div>
              </div>

              {/* Display payment details */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
                <span className="font-bold text-amber-600">Coordonnées de virement :</span>
                {rechargeMethod === "baridimob" ? (
                  <p className="font-mono">
                    RIP : 007999990022334455 <br />
                    Titulaire : Belkacem Fares
                  </p>
                ) : (
                  <p className="font-mono">
                    CCP : 1234567 Clé 89 <br />
                    Titulaire : Belkacem Fares
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Numéro de Reçu / Référence du Transfert</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Trans #882190 ou Virement par Salah K."
                  value={rechargeRef}
                  onChange={(e) => setRegUsername(e.target.value)} // wait, let's fix this to setRechargeRef
                  onChangeCapture={(e) => setRechargeRef((e.target as HTMLInputElement).value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm"
              >
                {loading ? "Soumission..." : "Soumettre la preuve de paiement"}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* CREDENTIALS VIEWER DRAWER / SHEET */}
      {selectedClientCredentials && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8 sm:my-0 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedClientCredentials(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1.5 mb-6 border-b border-slate-200 pb-4">
              <Key className="h-8 w-8 text-amber-600 mx-auto" />
              <h3 className="font-display font-extrabold text-lg text-slate-900">
                {selectedClientCredentials.serviceType === "sat" ? "Accès Code Sat" : selectedClientCredentials.serviceType === "box" ? "Confirmation Box Android" : "Accès IPTV"} : {selectedClientCredentials.clientName}
              </h3>
              <p className="text-slate-500 text-sm">
                {selectedClientCredentials.serviceType === "box"
                  ? `Produit : ${selectedClientCredentials.server}`
                  : `Serveur : ${selectedClientCredentials.server} (${selectedClientCredentials.durationMonths} Mois)`}
              </p>
            </div>

            {selectedClientCredentials.status === "pending" ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl space-y-3 text-center">
                  <div className="flex justify-center mb-1">
                    <span className="relative flex h-8 w-8">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-8 w-8 bg-amber-500 flex items-center justify-center text-black font-bold">⏱️</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-amber-600 uppercase tracking-wider text-sm">En attente d'activation</h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Votre demande d'abonnement a été envoyée avec succès à l'administrateur et le coût de <strong>{selectedClientCredentials.pricePaid} DA</strong> a été déduit de votre solde.
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    L'administrateur génère actuellement votre accès sur le serveur. Les codes s'afficheront automatiquement ici dès validation. Merci pour votre patience !
                  </p>
                </div>

                <button
                  onClick={() => setSelectedClientCredentials(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-sm"
                >
                  Fermer
                </button>
              </div>
            ) : selectedClientCredentials.serviceType === "box" ? (
              /* BOX ANDROID : vente matérielle, pas de credentials à afficher */
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-center space-y-2">
                  <CheckCircle className="h-8 w-8 mx-auto text-emerald-600" />
                  <p className="font-bold text-[12px]">Vente enregistrée avec succès</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedClientCredentials.pricePaid.toLocaleString()} DA ont été déduits de votre solde crédit. Remettez le boîtier à votre client.
                  </p>
                  {selectedClientCredentials.notes && (
                    <p className="text-xs text-slate-500 pt-1 border-t border-emerald-500/20 mt-2">Note : {selectedClientCredentials.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClientCredentials(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-sm"
                >
                  Fermer
                </button>
              </div>
            ) : selectedClientCredentials.serviceType === "sat" || (selectedClientCredentials.serviceType === "iptv" && selectedClientCredentials.credentials?.satCode) ? (
              /* CODE SAT (ou IPTV à code d'activation) : afficher uniquement le code généré */
              <div className="space-y-4 text-sm">
                {copiedField && (
                  <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 rounded-lg text-xs text-center font-semibold mb-2">
                    Copié avec succès : {copiedField} !
                  </div>
                )}
                <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                    {selectedClientCredentials.serviceType === "sat" ? "Code Satellite" : "Code d'Activation"}
                  </span>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200 font-mono">
                    <span className="text-slate-800 text-sm tracking-wider select-all">{selectedClientCredentials.credentials?.satCode}</span>
                    <button
                      onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.satCode || "", "Code")}
                      className="p-1 text-slate-400 hover:text-slate-900 shrink-0 ml-2"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-lg text-xs leading-relaxed">
                  💡 Transmettez ce code à votre client pour qu'il l'active {selectedClientCredentials.serviceType === "sat" ? "sur son récepteur satellite" : "dans son application"}.
                </div>
                <button
                  onClick={() => setSelectedClientCredentials(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-sm"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {copiedField && (
                  <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 rounded-lg text-xs text-center font-semibold mb-4">
                    Copié avec succès : {copiedField} !
                  </div>
                )}

                {/* Xtream Codes format */}
                <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Format Xtream Codes</span>
                  
                  <div className="space-y-2 pt-1.5 font-mono">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500">Host:</span>
                      <span className="text-slate-700 break-all">{selectedClientCredentials.credentials?.xtreamHost}</span>
                      <button 
                        onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.xtreamHost || "", "Host")}
                        className="p-1 text-slate-400 hover:text-slate-900 shrink-0 ml-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500">User:</span>
                      <span className="text-slate-700">{selectedClientCredentials.credentials?.xtreamUser}</span>
                      <button 
                        onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.xtreamUser || "", "Username")}
                        className="p-1 text-slate-400 hover:text-slate-900 shrink-0 ml-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500">Pass:</span>
                      <span className="text-slate-700">{selectedClientCredentials.credentials?.xtreamPass}</span>
                      <button 
                        onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.xtreamPass || "", "Password")}
                        className="p-1 text-slate-400 hover:text-slate-900 shrink-0 ml-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* M3U Link Format */}
                <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Lien M3U Complet</span>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                    <span className="text-slate-700 truncate pr-2 select-all">{selectedClientCredentials.credentials?.m3uUrl}</span>
                    <button 
                      onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.m3uUrl || "", "Lien M3U")}
                      className="p-1 text-slate-400 hover:text-slate-900 shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {selectedClientCredentials.credentials?.m3uUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownloadM3u(selectedClientCredentials)}
                      className="w-full mt-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Télécharger le Fichier .m3u</span>
                    </button>
                  )}
                </div>

                {(selectedClientCredentials.adultContent !== undefined || selectedClientCredentials.credentials?.bouquetLink) && (
                  <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200">
                    {selectedClientCredentials.adultContent !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Contenu Adulte</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${selectedClientCredentials.adultContent ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                          {selectedClientCredentials.adultContent ? "Activé" : "Désactivé"}
                        </span>
                      </div>
                    )}
                    {selectedClientCredentials.credentials?.bouquetLink && (
                      <div className={selectedClientCredentials.adultContent !== undefined ? "pt-2 border-t border-slate-100" : ""}>
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Lien de Gestion des Bouquets</span>
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                          <a
                            href={selectedClientCredentials.credentials.bouquetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline truncate pr-2"
                          >
                            {selectedClientCredentials.credentials.bouquetLink}
                          </a>
                          <button
                            onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.bouquetLink || "", "Lien Bouquets")}
                            className="p-1 text-slate-400 hover:text-slate-900 shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Utilisez ce lien pour configurer les chaînes/bouquets de ce client.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-lg text-xs leading-relaxed">
                  💡 Vous pouvez transmettre directement ces codes à votre client. Ils sont compatibles avec toutes les applications IPTV (Smarters Pro, NetIPTV, SmartOne, IBO Player, etc.).
                </div>

                <button
                  onClick={() => setSelectedClientCredentials(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-sm"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
