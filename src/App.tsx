import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import RetailCatalog from "./components/RetailCatalog";
import WholesalerDashboard from "./components/WholesalerDashboard";
import AdminSimulator from "./components/AdminSimulator";
import InstallationTutorials from "./components/InstallationTutorials";
import MusicPlayer from "./components/MusicPlayer";
import { 
  Product, 
  Wholesaler, 
  IptvClient, 
  Order, 
  CreditRequest, 
  EmailNotification, 
  AppStats,
  VideoTutorial,
  PanelRequest,
  CatalogCategory
} from "./types";
import { Tv, Sparkles, ShieldCheck, Flame, HelpCircle } from "lucide-react";

export default function App() {
  const [currentView, setView] = useState<"retail" | "wholesaler" | "admin">("retail");
  // La vraie source de vérité est le cookie HttpOnly "admin_token" côté serveur,
  // vérifié au chargement via /api/auth/admin/session (voir useEffect plus bas).
  // Ne JAMAIS se fier à un flag localStorage pour une décision de sécurité.
  const [isAdminUnlocked, setAdminUnlocked] = useState(false);

  // Secret Admin modal states
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [secretError, setSecretError] = useState("");
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [loggedWholesaler, setLoggedWholesaler] = useState<Wholesaler | null>(null);
  
  // Wholesaler-specific lists
  const [wholesalerClients, setWholesalerClients] = useState<IptvClient[]>([]);
  const [wholesalerRequests, setWholesalerRequests] = useState<CreditRequest[]>([]);
  const [wholesalerPanelRequests, setWholesalerPanelRequests] = useState<PanelRequest[]>([]);
  
  // Admin-specific lists
  const [adminStats, setAdminStats] = useState<AppStats>({
    totalRetailSales: 0,
    totalWholesaleSales: 0,
    totalRevenueDA: 0,
    activeWholesalers: 0,
    totalClientsActivated: 0
  });
  const [adminWholesalers, setAdminWholesalers] = useState<Wholesaler[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminRequests, setAdminRequests] = useState<CreditRequest[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<EmailNotification[]>([]);
  const [adminClients, setAdminClients] = useState<IptvClient[]>([]);
  const [adminPanelRequests, setAdminPanelRequests] = useState<PanelRequest[]>([]);

  // 1. Initial Load of Products, Categories & Auth check
  useEffect(() => {
    fetchProducts();
    fetchTutorials();
    fetchCatalogCategories();

    // Reconnexion automatique : si un cookie JWT valide existe encore (session
    // de 2 jours), on restaure le profil revendeur sans redemander les identifiants.
    // Le mot de passe n'est plus jamais stocké côté client (localStorage).
    (async () => {
      try {
        const res = await fetch("/api/auth/wholesaler/session", {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setLoggedWholesaler(data.wholesaler);
        }
      } catch (e) {
        // Pas de session valide, l'utilisateur devra se connecter normalement.
      }
    })();

    // Idem pour le panneau administrateur : vérifie le cookie admin_token
    // (HttpOnly, signé serveur) au lieu de l'ancien flag localStorage non sécurisé.
    (async () => {
      try {
        const res = await fetch("/api/auth/admin/session", {
          credentials: "include"
        });
        setAdminUnlocked(res.ok);
      } catch (e) {
        setAdminUnlocked(false);
      }
    })();
  }, []);

  // 2. Fetch wholesaler specific data if logged in
  useEffect(() => {
    if (loggedWholesaler) {
      fetchWholesalerData();
    } else {
      setWholesalerClients([]);
      setWholesalerRequests([]);
      setWholesalerPanelRequests([]);
    }
    // Also load admin data so simulator is synced
    fetchAdminData();
  }, [loggedWholesaler]);

  // Fetch Routines
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    }
  };

  const fetchTutorials = async () => {
    try {
      const res = await fetch("/api/tutorials");
      if (res.ok) {
        const data = await res.json();
        setTutorials(data);
      }
    } catch (e) {
      console.error("Error fetching tutorials:", e);
    }
  };

  const fetchCatalogCategories = async () => {
    try {
      const res = await fetch("/api/catalog-categories");
      if (res.ok) {
        const data = await res.json();
        setCatalogCategories(data);
      }
    } catch (e) {
      console.error("Error fetching catalog categories:", e);
    }
  };

  const fetchWholesalerData = async () => {
    if (!loggedWholesaler) return;
    try {
      // Refresh profile to get updated balance
      const profRes = await fetch("/api/wholesaler/profile", {
        credentials: "include"
      });
      if (profRes.ok) {
        const freshProfile = await profRes.json();
        if (freshProfile.status === "suspended") {
          setLoggedWholesaler(null);
          alert("Votre compte grossiste a été suspendu par l'administration.");
          return;
        }
        setLoggedWholesaler(freshProfile);
      } else if (profRes.status === 403 || profRes.status === 401) {
        setLoggedWholesaler(null);
      }

      // Fetch Clients
      const clientsRes = await fetch("/api/wholesaler/clients", {
        credentials: "include"
      });
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setWholesalerClients(clientsData);
      }

      // Fetch Credit Requests
      const reqRes = await fetch("/api/wholesaler/credit-requests", {
        credentials: "include"
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setWholesalerRequests(reqData);
      }

      // Fetch Panel Requests
      const panelRes = await fetch("/api/wholesaler/panel-requests", {
        credentials: "include"
      });
      if (panelRes.ok) {
        const panelData = await panelRes.json();
        setWholesalerPanelRequests(panelData);
      }
    } catch (e) {
      console.error("Error fetching wholesaler data:", e);
    }
  };

  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) setAdminStats(await statsRes.json());

      const wholesalersRes = await fetch("/api/admin/wholesalers");
      if (wholesalersRes.ok) setAdminWholesalers(await wholesalersRes.json());

      const ordersRes = await fetch("/api/admin/orders");
      if (ordersRes.ok) setAdminOrders(await ordersRes.json());

      const reqsRes = await fetch("/api/admin/credit-requests");
      if (reqsRes.ok) setAdminRequests(await reqsRes.json());

      const notifsRes = await fetch("/api/admin/notifications");
      if (notifsRes.ok) setAdminNotifications(await notifsRes.json());

      const clientsRes = await fetch("/api/admin/clients");
      if (clientsRes.ok) setAdminClients(await clientsRes.json());

      const panelRes = await fetch("/api/admin/panel-requests");
      if (panelRes.ok) setAdminPanelRequests(await panelRes.json());
    } catch (e) {
      console.error("Error fetching admin data:", e);
    }
  };

  const refreshAllData = () => {
    fetchProducts();
    fetchTutorials();
    fetchCatalogCategories();
    if (loggedWholesaler) {
      fetchWholesalerData();
    }
    fetchAdminData();
  };

  // Wholesale Auth Handlers
  const handleWholesalerLogin = async (usernameInput: string, passwordInput: string) => {
    const res = await fetch("/api/auth/wholesaler/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });
    
    if (!res.ok) {
      let errorMessage = "Identifiants incorrects.";
      try {
        const errData = await res.json();
        errorMessage = errData.error || errorMessage;
      } catch (e) {
        try {
          const text = await res.text();
          if (text && text.trim().startsWith("{")) {
            const parsed = JSON.parse(text);
            errorMessage = parsed.error || errorMessage;
          } else {
            errorMessage = text ? text.substring(0, 150) : res.statusText || errorMessage;
          }
        } catch (_) {}
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    setLoggedWholesaler(data.wholesaler);
    refreshAllData();
    return data;
  };

  const handleWholesalerRegister = async (payload: any) => {
    const res = await fetch("/api/auth/wholesaler/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errorMessage = "Erreur d'inscription.";
      try {
        const errData = await res.json();
        errorMessage = errData.error || errorMessage;
      } catch (e) {
        try {
          const text = await res.text();
          if (text && text.trim().startsWith("{")) {
            const parsed = JSON.parse(text);
            errorMessage = parsed.error || errorMessage;
          } else {
            errorMessage = text ? text.substring(0, 150) : res.statusText || errorMessage;
          }
        } catch (_) {}
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    refreshAllData();
    return data;
  };

  const handleSetView = (view: "retail" | "wholesaler" | "admin") => {
    if (view === "admin") {
      if (loggedWholesaler) {
        alert("Accès refusé. Les comptes revendeurs ne sont pas autorisés à accéder au panneau d'administration.");
        setView("wholesaler");
        return;
      }
    }
    setView(view);
  };

  // "Quitter le panneau" : ferme uniquement la vue revendeur et retourne à la
  // boutique. La session (cookie JWT) N'EST PAS touchée : le revendeur reste
  // connecté et retrouvera son panneau automatiquement pendant 2 jours.
  const handleWholesalerLogout = () => {
    setView("retail");
  };

  // "Déconnexion complète" (paramètres du compte) : révoque le JWT côté serveur
  // et supprime le cookie. Une reconnexion avec identifiant + mot de passe sera
  // nécessaire ensuite.
  const handleWholesalerLogoutComplete = async () => {
    try {
      await fetch("/api/auth/wholesaler/logout-complete", {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.error("Error during full logout:", e);
    }
    setLoggedWholesaler(null);
    setWholesalerClients([]);
    setWholesalerRequests([]);
    setWholesalerPanelRequests([]);
    setView("retail");
    refreshAllData();
  };

  const handleSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecretError("");

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSecretError(data.error || "Nom d'utilisateur ou mot de passe incorrect.");
        return;
      }

      setUnlockSuccess(true);
      setTimeout(() => {
        setAdminUnlocked(true);
        setShowSecretModal(false);
        setUnlockSuccess(false);
        setAdminUsername("");
        setAdminPassword("");
        setView("admin");
      }, 1000);
    } catch (err) {
      setSecretError("Impossible de contacter le serveur. Réessayez.");
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/auth/admin/logout-complete", {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.error("Error during admin logout:", e);
    }
    setAdminUnlocked(false);
    setView("retail");
  };

  // Wholesale Operations
  const handleActivateClient = async (payload: any) => {
    if (!loggedWholesaler) return;
    const res = await fetch("/api/wholesaler/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Échec de l'activation.");
    }

    const data = await res.json();
    // Refresh both wholesaler details and general admin simulator
    fetchWholesalerData();
    fetchAdminData();
    return data;
  };

  const handleRequestCredit = async (payload: any) => {
    if (!loggedWholesaler) return;
    const res = await fetch("/api/wholesaler/credit-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Échec de la soumission de recharge.");
    }

    const data = await res.json();
    fetchWholesalerData();
    fetchAdminData();
    return data;
  };

  const handleRequestPanel = async (payload: any) => {
    if (!loggedWholesaler) return;
    const res = await fetch("/api/wholesaler/panel-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Échec de la demande de panel.");
    }

    const data = await res.json();
    fetchWholesalerData();
    fetchAdminData();
    return data;
  };

  // Retail Operations
  const handleOrderSubmit = async (payload: any) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Échec de l'enregistrement de la commande.");
    }

    const data = await res.json();
    fetchAdminData();
    return data;
  };

  // Admin Simulator Operations
  const handleApproveWholesaler = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch(`/api/admin/wholesalers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentStatus })
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCreditManual = async (id: string, amount: number) => {
    try {
      // Fetch current wholesaler balance first
      const wholesaler = adminWholesalers.find(w => w.id === id);
      if (!wholesaler) return;

      const newBalance = wholesaler.creditBalance + amount;
      const res = await fetch(`/api/admin/wholesalers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditBalance: newBalance })
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: "completed" | "cancelled") => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessCreditRequest = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/credit-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessPanelRequest = async (id: string, status: "approved" | "rejected", notes: string) => {
    try {
      const res = await fetch(`/api/admin/panel-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (payload: { name: string; description?: string; icon?: string; color?: string }) => {
    try {
      const res = await fetch("/api/admin/catalog-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newCategory = await res.json();
        refreshAllData();
        return newCategory;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCategory = async (id: string, payload: { name: string; description?: string; icon?: string; color?: string }) => {
    try {
      const res = await fetch(`/api/admin/catalog-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/catalog-categories/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}/read`, {
        method: "PUT"
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateClient = async (clientId: string, payload: any) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error("Error updating client details:", e);
    }
  };

  const handleResetDatabase = async () => {
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST"
      });
      if (res.ok) {
        // La base est réinitialisée (les comptes/IDs revendeurs changent) :
        // on invalide aussi la session en cours pour éviter un état incohérent.
        await fetch("/api/auth/wholesaler/logout-complete", {
          method: "POST",
          credentials: "include"
        });
        setLoggedWholesaler(null);
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToCatalog = () => {
    const catalog = document.getElementById("shop-catalog");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      currentView === "retail" 
        ? "bg-slate-50 text-slate-900" 
        : "bg-[#0b0f19] text-gray-200"
    }`}>
      {/* Dynamic Header */}
      <Header 
        currentView={currentView} 
        setView={handleSetView} 
        loggedWholesaler={loggedWholesaler}
        onLogout={handleWholesalerLogout}
        isAdminUnlocked={isAdminUnlocked}
        setAdminUnlocked={setAdminUnlocked}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === "retail" && (
          <div className="animate-in fade-in duration-300">
            {/* Elegant Hero Slider/Title */}
            <Hero 
              onExploreClick={scrollToCatalog}
              onWholesaleClick={() => handleSetView("wholesaler")}
            />
            {/* Products grid and checkout modals */}
            <RetailCatalog 
              products={products} 
              catalogCategories={catalogCategories}
              onOrderSubmit={handleOrderSubmit}
            />

            {/* Video Installation Tutorials */}
            <InstallationTutorials tutorials={tutorials} />

            {/* General FAQ section or trust badges */}
            <section className="max-w-4xl mx-auto px-4 mt-8">
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-lg text-slate-800 flex items-center space-x-1.5">
                  <HelpCircle className="h-5 w-5 text-indigo-600" />
                  <span>Foire Aux Questions (Détail & Gros)</span>
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">Comment se passe l'activation après commande ?</h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Une fois que vous validez votre commande au détail (Dino, 8K, V12 ou Golden OTT), notre admin reçoit une notification par email. Nous vous contactons immédiatement sur votre numéro de téléphone pour vous guider et vous transmettre vos codes Xtream / Lien M3U à configurer sur votre TV ou smartphone.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Je suis revendeur, comment fonctionne le solde de crédit ?</h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      En créant un compte grossiste, après approbation par l'admin, vous pouvez recharger votre portefeuille en effectuant un transfert BaridiMob ou CCP. Une fois le virement envoyé, soumettez la preuve dans votre tableau de bord. L'admin crédite votre compte, et vous pouvez alors activer vos clients de manière 100% autonome et instantanée à toute heure.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentView === "wholesaler" && (
          <div className="animate-in fade-in duration-300">
            <WholesalerDashboard 
              loggedWholesaler={loggedWholesaler}
              onLogin={handleWholesalerLogin}
              onRegister={handleWholesalerRegister}
              wholesalerClients={wholesalerClients}
              wholesalerRequests={wholesalerRequests}
              panelRequests={wholesalerPanelRequests}
              onActivateClient={handleActivateClient}
              onRequestCredit={handleRequestCredit}
              onRequestPanel={handleRequestPanel}
              refreshWholesalerData={fetchWholesalerData}
              onLogoutWholesaler={handleWholesalerLogout}
              onLogoutComplete={handleWholesalerLogoutComplete}
              onBackToHome={() => setView("retail")}
            />
          </div>
        )}

        {currentView === "admin" && (
          <div className="animate-in fade-in duration-300">
            {isAdminUnlocked && !loggedWholesaler ? (
              <AdminSimulator 
                stats={adminStats}
                wholesalers={adminWholesalers}
                orders={adminOrders}
                requests={adminRequests}
                notifications={adminNotifications}
                products={products}
                tutorials={tutorials}
                clients={adminClients}
                panelRequests={adminPanelRequests}
                catalogCategories={catalogCategories}
                onUpdateClient={handleUpdateClient}
                onApproveWholesaler={handleApproveWholesaler}
                onAddCreditManual={handleAddCreditManual}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onProcessCreditRequest={handleProcessCreditRequest}
                onProcessPanelRequest={handleProcessPanelRequest}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onMarkNotificationRead={handleMarkNotificationRead}
                onDeleteNotification={handleDeleteNotification}
                onResetDatabase={handleResetDatabase}
                refreshAllData={refreshAllData}
                onLogoutAdmin={handleAdminLogout}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-gray-950 border border-gray-800 rounded-3xl text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="h-16 w-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20 shadow-inner">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black font-display text-white tracking-tight uppercase">Accès Réservé à l'Admin</h2>
                  <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                    Vous n'avez pas l'autorisation d'accéder à cette page. Les comptes revendeurs grossistes ne peuvent pas accéder au panneau administratif.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handleSetView(loggedWholesaler ? "wholesaler" : "retail")}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
                  >
                    Retourner à mon espace autorisé
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Background Autoplay Music Widget */}
      <MusicPlayer />

      {/* Modern Compact Footer */}
      <footer className="border-t border-gray-900 bg-black/40 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 KURTAL IPTV Premium. Tous droits réservés. Vente en gros et au détail.</p>
          <div className="flex space-x-4 text-gray-400 font-medium items-center">
            <span className="hover:text-white cursor-pointer" onClick={() => handleSetView("retail")}>Accueil</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => handleSetView("wholesaler")}>Espace Revendeurs</span>
            <span>•</span>
            <span 
              className="text-gray-600 hover:text-white transition-colors cursor-pointer text-[10px] font-bold px-1.5 py-0.5 rounded select-none"
              onClick={() => {
                if (isAdminUnlocked) {
                  handleSetView("admin");
                } else {
                  setShowSecretModal(true);
                  setAdminUsername("");
                  setAdminPassword("");
                  setSecretError("");
                  setUnlockSuccess(false);
                }
              }}
              title="Administration"
            >
              A
            </span>
          </div>
        </div>
      </footer>

      {/* Admin Unlock Modal — authentification vérifiée côté serveur */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl space-y-4 text-gray-200">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-full mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">KURTAL IPTV Administrateur</h3>
              <p className="text-xs text-gray-400">Connexion réservée à l'administrateur</p>
            </div>

            <form onSubmit={handleSecretSubmit} className="space-y-4">
              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Nom d'utilisateur</label>
                  <input
                    type="text"
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
                  <div className="h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  <span>Accès Déverrouillé !</span>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecretModal(false);
                      setSecretError("");
                      setAdminUsername("");
                      setAdminPassword("");
                    }}
                    className="flex-1 py-2 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
                  >
                    Se connecter
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
