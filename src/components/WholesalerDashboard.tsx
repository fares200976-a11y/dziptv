import React, { useState, useEffect } from "react";
import { Wholesaler, IptvClient, CreditRequest, PanelRequest, SubscriptionServer } from "../types";
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
  HelpCircle
} from "lucide-react";

interface WholesalerDashboardProps {
  loggedWholesaler: Wholesaler | null;
  onLogin: (username: string, password: string) => Promise<any>;
  onRegister: (data: any) => Promise<any>;
  wholesalerClients: IptvClient[];
  wholesalerRequests: CreditRequest[];
  panelRequests?: PanelRequest[];
  onActivateClient: (data: any) => Promise<any>;
  onRequestCredit: (data: any) => Promise<any>;
  onRequestPanel?: (data: any) => Promise<any>;
  refreshWholesalerData: () => void;
  onLogoutWholesaler?: () => void;
}

export default function WholesalerDashboard({
  loggedWholesaler,
  onLogin,
  onRegister,
  wholesalerClients,
  wholesalerRequests,
  panelRequests = [],
  onActivateClient,
  onRequestCredit,
  onRequestPanel,
  refreshWholesalerData,
  onLogoutWholesaler
}: WholesalerDashboardProps) {
  // Login / Register Views
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Fields
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

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
  const [newClientName, setNewClientName] = useState("");
  const [selectedServer, setSelectedServer] = useState<string>("Dino");
  const [selectedDuration, setSelectedDuration] = useState<number>(12);
  const [clientNotes, setClientNotes] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

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
        email
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
    setLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      const payload = {
        clientName: newClientName,
        server: selectedServer,
        durationMonths: selectedDuration,
        notes: clientNotes
      };
      const res = await onActivateClient(payload);
      setActionSuccess(res.message);
      setNewClientName("");
      setClientNotes("");
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Info Column */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Programme Revendeur</span>
              <h2 className="font-display text-3xl font-extrabold text-white mt-2 leading-tight">
                Vendez de l'IPTV à vos clients et maximisez vos revenus !
              </h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Devenez membre de notre réseau de distributeurs agréés en Algérie. Bénéficiez d'un panel réactif pour activer instantanément les codes de vos clients à prix de gros imbattable.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Tarifs Réduits d'achat (Gros)</h4>
                  <p className="text-xs text-gray-400 mt-1">Économisez de 500 à 1000 DA sur chaque abonnement activé.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0 mt-0.5">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Activations Instantanées 24/7</h4>
                  <p className="text-xs text-gray-400 mt-1">Pas besoin d'attendre. Activez et téléchargez les fichiers M3U et Xtream Codes immédiatement.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Gestion Facile</h4>
                  <p className="text-xs text-gray-400 mt-1">Suivez les dates d'expiration de vos abonnés pour les renouveler en un clic.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="bg-gray-950 p-8 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl"></div>

            {/* Form Toggle Tabs */}
            <div className="flex border-b border-gray-800 pb-4 mb-6">
              <button
                onClick={() => { setIsRegistering(false); setAuthError(""); }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer ${
                  !isRegistering
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
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
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <UserPlus className="h-4 w-4" />
                  <span>Créer un Compte</span>
                </div>
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium mb-4">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium mb-4">
                {authSuccess}
              </div>
            )}

            {/* Login Form */}
            {!isRegistering ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nom d'utilisateur</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: dino_pro"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    placeholder="Saisir votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  {loading ? "Connexion..." : "Se Connecter"}
                </button>
                <p className="text-[10px] text-center text-gray-500">
                  Compte de démonstration : <strong className="text-indigo-400">dino_pro</strong> / <strong className="text-indigo-400">n'importe quel mot de passe</strong>
                </p>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nom du Commerce / Magasin</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Kamal Sat Alger"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Nom d'utilisateur</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: kamal_sat"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 0661987654"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email professionnel</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: kamal.sat@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    placeholder="Créez un mot de passe"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  {loading ? "Création..." : "Soumettre ma Demande d'Inscription"}
                </button>
                <p className="text-[9px] text-gray-500 text-center leading-relaxed">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-gray-900 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Grossiste Agrée
          </span>
          <h2 className="font-display text-2xl font-bold text-white mt-2">Console Revendeur : {loggedWholesaler.businessName}</h2>
          <p className="text-gray-400 text-xs mt-1">Gérez votre stock de crédits, activez vos abonnés et suivez les expirations.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setShowRechargeModal(true);
            }}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-indigo-400 font-bold text-xs rounded-xl border border-gray-700 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            <span>Demander Crédit</span>
          </button>

          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setShowPanelModal(true);
            }}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-xs rounded-xl border border-gray-700 transition-all flex items-center space-x-1.5 cursor-pointer"
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
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Activation</span>
          </button>

          {onLogoutWholesaler && (
            <button
              onClick={onLogoutWholesaler}
              className="px-4 py-2.5 bg-red-600/15 hover:bg-red-600/25 text-red-400 font-bold text-xs rounded-xl border border-red-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <LogIn className="h-4 w-4 rotate-180" />
              <span>Se déconnecter</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert states feedback */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
          {actionSuccess}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Crédit Disponible</span>
            <span className="text-3xl font-black font-display text-emerald-400 mt-1 block">
              {loggedWholesaler.creditBalance.toLocaleString()} DA
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Abonnements Actifs</span>
            <span className="text-3xl font-black font-display text-blue-400 mt-1 block">
              {wholesalerClients.filter(c => c.status === "active").length}
            </span>
          </div>
          <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold block">Demandes Recharges</span>
            <span className="text-3xl font-black font-display text-amber-400 mt-1 block">
              {wholesalerRequests.filter(r => r.status === "pending").length}
            </span>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Core Table View */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
        {/* Table Search & Filter header */}
        <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900/20">
          <h3 className="font-display font-bold text-base text-white self-start sm:self-center">Liste de vos Clients Activés</h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou serveur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          {filteredClients.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-900/40 text-gray-400 border-b border-gray-800/80">
                  <th className="p-4 font-semibold">Nom du Client</th>
                  <th className="p-4 font-semibold">Serveur IPTV</th>
                  <th className="p-4 font-semibold">Durée</th>
                  <th className="p-4 font-semibold">Date Activation</th>
                  <th className="p-4 font-semibold">Date Expiration</th>
                  <th className="p-4 font-semibold">Coût (DA)</th>
                  <th className="p-4 font-semibold text-center">Statut</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filteredClients.map((client) => {
                  const isExpired = client.expirationDate ? new Date(client.expirationDate) < new Date() : false;
                  return (
                    <tr key={client.id} className="hover:bg-gray-900/10">
                      <td className="p-4 font-bold text-white">{client.clientName}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-semibold text-[10px]">
                          {client.server}
                        </span>
                      </td>
                      <td className="p-4">{client.durationMonths} Mois</td>
                      <td className="p-4 text-gray-400">
                        {client.activationDate 
                          ? new Date(client.activationDate).toLocaleDateString("fr-FR") 
                          : "En attente"}
                      </td>
                      <td className="p-4 text-gray-400 font-mono">
                        {client.expirationDate 
                          ? new Date(client.expirationDate).toLocaleDateString("fr-FR") 
                          : "En attente"}
                      </td>
                      <td className="p-4 font-bold text-emerald-400">{client.pricePaid.toLocaleString()} DA</td>
                      <td className="p-4 text-center">
                        {client.status === "pending" ? (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-semibold animate-pulse">
                            En attente
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-semibold">
                            Expiré
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[9px] font-semibold">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedClientCredentials(client)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                            client.status === "pending"
                              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                              : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
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
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs">Aucun client trouvé. Lancez votre première activation !</p>
            </div>
          )}
        </div>
      </div>

      {/* Credit Recharge Request History List */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 p-5 space-y-4">
        <h3 className="font-display font-bold text-base text-white">Suivi de vos demandes de recharge crédit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wholesalerRequests.map((req) => (
            <div key={req.id} className="p-4 bg-gray-900/40 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block">{new Date(req.createdAt).toLocaleString("fr-FR")}</span>
                <span className="font-bold text-white text-sm">{req.amountDA.toLocaleString()} DA</span>
                <span className="text-gray-400 block mt-1">Via {req.paymentMethod.toUpperCase()} (Ref: {req.receiptReference})</span>
              </div>
              <div>
                {req.status === "pending" && (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold text-[10px]">
                    En attente de validation
                  </span>
                )}
                {req.status === "approved" && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-semibold text-[10px]">
                    Approuvée & Créditée
                  </span>
                )}
                {req.status === "rejected" && (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-semibold text-[10px]">
                    Rejetée
                  </span>
                )}
              </div>
            </div>
          ))}
          {wholesalerRequests.length === 0 && (
            <p className="text-xs text-gray-500 col-span-2 text-center py-2">Aucune demande de recharge effectuée.</p>
          )}
        </div>
      </div>

      {/* Panel Requests Followup List */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-base text-white flex items-center space-x-2">
            <Key className="h-4 w-4 text-amber-500" />
            <span>Suivi de vos demandes de Panels Revendeur (Min 10 codes)</span>
          </h3>
          <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
            10 Codes Min.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {panelRequests.map((panelReq) => (
            <div key={panelReq.id} className="p-4 bg-gray-900/40 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block">{new Date(panelReq.createdAt).toLocaleString("fr-FR")}</span>
                <span className="font-bold text-white text-sm">Panel : {panelReq.server}</span>
                <span className="text-gray-300 block mt-1 font-semibold">{panelReq.codesCount} codes demandés</span>
                {panelReq.notes && (
                  <p className="text-[10px] text-amber-400 mt-1 italic">Note Admin: {panelReq.notes}</p>
                )}
              </div>
              <div>
                {panelReq.status === "pending" && (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold text-[10px]">
                    En attente de validation
                  </span>
                )}
                {panelReq.status === "approved" && (
                  <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-semibold text-[10px]">
                    Panel Activé
                  </span>
                )}
                {panelReq.status === "rejected" && (
                  <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-semibold text-[10px]">
                    Rejetée
                  </span>
                )}
              </div>
            </div>
          ))}
          {panelRequests.length === 0 && (
            <p className="text-xs text-gray-500 col-span-2 text-center py-2">Aucune demande de panel effectuée.</p>
          )}
        </div>
      </div>

      {/* MODAL 3: REQUEST RESELLER PANEL */}
      {showPanelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPanelModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 mb-6">
              <h3 className="font-display font-extrabold text-lg text-white">Demande de Panel Revendeur</h3>
              <p className="text-gray-400 text-xs">Créez votre propre panel IPTV autonome pour gérer vos clients.</p>
            </div>

            <form onSubmit={handlePanelRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Serveur Panel IPTV</label>
                <select
                  value={panelServer}
                  onChange={(e) => setPanelServer(e.target.value as SubscriptionServer)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Dino">Dino OTT</option>
                  <option value="8K">8K OTT</option>
                  <option value="V12">V12 OTT</option>
                  <option value="Golden OTT">Golden OTT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre de codes (Minimum 10)</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={panelCodesCount}
                  onChange={(e) => setPanelCodesCount(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-500 mt-1">Conformément aux règles de revente, les panels nécessitent un achat initial de minimum 10 codes d'activation.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Note ou Message Optionnel</label>
                <textarea
                  placeholder="Informations supplémentaires pour l'admin..."
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>

              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-semibold">
                  {actionError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-600/10 transition-all cursor-pointer"
              >
                {loading ? "Traitement..." : "Soumettre la Demande de Panel"}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* MODAL 1: NEW ACTIVATION */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowActivateModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 border-b border-gray-800 pb-3">
              <Plus className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-bold text-lg text-white">Activer un Client</h3>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium mb-4">
                {actionError}
              </div>
            )}

            <form onSubmit={handleClientActivation} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Nom du Client</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mohamed Belkaid"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Serveur IPTV</label>
                  <select
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="Dino">Dino IPTV (4,200 DA)</option>
                    <option value="8K">8K Premium (6,800 DA)</option>
                    <option value="V12">V12 IPTV Pro (4,300 DA)</option>
                    <option value="Golden OTT">Golden OTT (6,200 DA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Durée d'abonnement</label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value={1}>1 Mois (15% du tarif)</option>
                    <option value={6}>6 Mois (60% du tarif)</option>
                    <option value={12}>12 Mois (100% du tarif)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Notes / MAC Address (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: SmartOne MAC: aa:bb:cc..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <p className="font-semibold text-[11px]">Tarification Revendeur :</p>
                <p className="text-[10px] text-gray-300 mt-1">
                  Cette activation sera déduite automatiquement de votre solde crédit. Assurez-vous d'avoir assez de fonds.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs"
              >
                {loading ? "Activation en cours..." : "Confirmer l'activation"}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* MODAL 2: REQUEST RECHARGE */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowRechargeModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-5 border-b border-gray-800 pb-3">
              <Wallet className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-bold text-lg text-white">Recharger mon Crédit</h3>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium mb-4">
                {actionError}
              </div>
            )}

            <form onSubmit={handleRechargeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Montant à recharger (DA)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 20000"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Mode de Paiement effectué</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRechargeMethod("baridimob")}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      rechargeMethod === "baridimob"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                        : "bg-gray-900/50 border-gray-800 text-gray-400"
                    }`}
                  >
                    BaridiMob
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechargeMethod("ccp")}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      rechargeMethod === "ccp"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                        : "bg-gray-900/50 border-gray-800 text-gray-400"
                    }`}
                  >
                    Virement CCP
                  </button>
                </div>
              </div>

              {/* Display payment details */}
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1.5 text-gray-300">
                <span className="font-bold text-amber-400">Coordonnées de virement :</span>
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
                <label className="block text-gray-300 font-semibold mb-1">Numéro de Reçu / Référence du Transfert</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Trans #882190 ou Virement par Salah K."
                  value={rechargeRef}
                  onChange={(e) => setRegUsername(e.target.value)} // wait, let's fix this to setRechargeRef
                  onChangeCapture={(e) => setRechargeRef((e.target as HTMLInputElement).value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs"
              >
                {loading ? "Soumission..." : "Soumettre la preuve de paiement"}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* CREDENTIALS VIEWER DRAWER / SHEET */}
      {selectedClientCredentials && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-950 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedClientCredentials(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1.5 mb-6 border-b border-gray-800 pb-4">
              <Key className="h-8 w-8 text-amber-400 mx-auto" />
              <h3 className="font-display font-extrabold text-lg text-white">Accès IPTV : {selectedClientCredentials.clientName}</h3>
              <p className="text-gray-400 text-xs">Serveur : {selectedClientCredentials.server} ({selectedClientCredentials.durationMonths} Mois)</p>
            </div>

            {selectedClientCredentials.status === "pending" ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl space-y-3 text-center">
                  <div className="flex justify-center mb-1">
                    <span className="relative flex h-8 w-8">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-8 w-8 bg-amber-500 flex items-center justify-center text-black font-bold">⏱️</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">En attente d'activation</h4>
                  <p className="text-[10px] leading-relaxed text-gray-300">
                    Votre demande d'abonnement a été envoyée avec succès à l'administrateur et le coût de <strong>{selectedClientCredentials.pricePaid} DA</strong> a été déduit de votre solde.
                  </p>
                  <p className="text-[10px] leading-relaxed text-gray-400">
                    L'administrateur génère actuellement votre accès sur le serveur. Les codes s'afficheront automatiquement ici dès validation. Merci pour votre patience !
                  </p>
                </div>

                <button
                  onClick={() => setSelectedClientCredentials(null)}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {copiedField && (
                  <div className="p-2 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] text-center font-semibold mb-4">
                    Copié avec succès : {copiedField} !
                  </div>
                )}

                {/* Xtream Codes format */}
                <div className="space-y-2 p-3.5 bg-gray-900 rounded-xl border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Format Xtream Codes</span>
                  
                  <div className="space-y-2 pt-1.5 font-mono">
                    <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-gray-800">
                      <span className="text-gray-400">Host:</span>
                      <span className="text-gray-200 break-all">{selectedClientCredentials.credentials?.xtreamHost}</span>
                      <button 
                        onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.xtreamHost || "", "Host")}
                        className="p-1 text-gray-500 hover:text-white shrink-0 ml-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-gray-800">
                      <span className="text-gray-400">User:</span>
                      <span className="text-gray-200">{selectedClientCredentials.credentials?.xtreamUser}</span>
                      <button 
                        onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.xtreamUser || "", "Username")}
                        className="p-1 text-gray-500 hover:text-white shrink-0 ml-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-gray-800">
                      <span className="text-gray-400">Pass:</span>
                      <span className="text-gray-200">{selectedClientCredentials.credentials?.xtreamPass}</span>
                      <button 
                        onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.xtreamPass || "", "Password")}
                        className="p-1 text-gray-500 hover:text-white shrink-0 ml-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* M3U Link Format */}
                <div className="space-y-2 p-3.5 bg-gray-900 rounded-xl border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Lien M3U Complet</span>
                  <div className="flex items-center justify-between bg-black/30 p-2 rounded border border-gray-800 font-mono">
                    <span className="text-gray-200 truncate pr-2 select-all">{selectedClientCredentials.credentials?.m3uUrl}</span>
                    <button 
                      onClick={() => handleCopyToClipboard(selectedClientCredentials.credentials?.m3uUrl || "", "Lien M3U")}
                      className="p-1 text-gray-500 hover:text-white shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {selectedClientCredentials.credentials?.m3uUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownloadM3u(selectedClientCredentials)}
                      className="w-full mt-2 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Télécharger le Fichier .m3u</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-[10px] leading-relaxed">
                  💡 Vous pouvez transmettre directement ces codes à votre client. Ils sont compatibles avec toutes les applications IPTV (Smarters Pro, NetIPTV, SmartOne, IBO Player, etc.).
                </div>

                <button
                  onClick={() => setSelectedClientCredentials(null)}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-xs"
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
