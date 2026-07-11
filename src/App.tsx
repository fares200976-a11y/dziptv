import { useState, useEffect } from "react";
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
  VideoTutorial
} from "./types";
import { Tv, Sparkles, ShieldCheck, Flame, HelpCircle } from "lucide-react";

export default function App() {
  const [currentView, setView] = useState<"retail" | "wholesaler" | "admin">("retail");
  const [isAdminUnlocked, setAdminUnlocked] = useState(() => {
    return localStorage.getItem("adminUnlocked") === "true";
  });
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);
  const [loggedWholesaler, setLoggedWholesaler] = useState<Wholesaler | null>(null);
  
  // Wholesaler-specific lists
  const [wholesalerClients, setWholesalerClients] = useState<IptvClient[]>([]);
  const [wholesalerRequests, setWholesalerRequests] = useState<CreditRequest[]>([]);
  
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

  // 1. Initial Load of Products & Auth check
  useEffect(() => {
    fetchProducts();
    fetchTutorials();
    
    // Check local storage for persistent login
    const savedProfile = localStorage.getItem("wholesalerProfile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setLoggedWholesaler(profile);
      } catch (e) {
        localStorage.removeItem("wholesalerProfile");
      }
    }
  }, []);

  // 2. Fetch wholesaler specific data if logged in
  useEffect(() => {
    if (loggedWholesaler) {
      fetchWholesalerData();
    } else {
      setWholesalerClients([]);
      setWholesalerRequests([]);
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

  const fetchWholesalerData = async () => {
    if (!loggedWholesaler) return;
    try {
      // Refresh profile to get updated balance
      const profRes = await fetch("/api/wholesaler/profile", {
        headers: { "x-wholesaler-id": loggedWholesaler.id }
      });
      if (profRes.ok) {
        const freshProfile = await profRes.json();
        if (freshProfile.status === "suspended") {
          localStorage.removeItem("wholesalerProfile");
          setLoggedWholesaler(null);
          alert("Votre compte grossiste a été suspendu par l'administration.");
          return;
        }
        setLoggedWholesaler(freshProfile);
        localStorage.setItem("wholesalerProfile", JSON.stringify(freshProfile));
      } else if (profRes.status === 403 || profRes.status === 401) {
        localStorage.removeItem("wholesalerProfile");
        setLoggedWholesaler(null);
      }

      // Fetch Clients
      const clientsRes = await fetch("/api/wholesaler/clients", {
        headers: { "x-wholesaler-id": loggedWholesaler.id }
      });
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setWholesalerClients(clientsData);
      }

      // Fetch Credit Requests
      const reqRes = await fetch("/api/wholesaler/credit-requests", {
        headers: { "x-wholesaler-id": loggedWholesaler.id }
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setWholesalerRequests(reqData);
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
    } catch (e) {
      console.error("Error fetching admin data:", e);
    }
  };

  const refreshAllData = () => {
    fetchProducts();
    fetchTutorials();
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
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Identifiants incorrects.");
    }

    const data = await res.json();
    setLoggedWholesaler(data.wholesaler);
    localStorage.setItem("wholesalerProfile", JSON.stringify(data.wholesaler));
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
      const errData = await res.json();
      throw new Error(errData.error || "Erreur d'inscription.");
    }

    const data = await res.json();
    refreshAllData();
    return data;
  };

  const handleWholesalerLogout = () => {
    localStorage.removeItem("wholesalerProfile");
    setLoggedWholesaler(null);
    setView("retail");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminUnlocked");
    setAdminUnlocked(false);
    setView("retail");
  };

  // Wholesale Operations
  const handleActivateClient = async (payload: any) => {
    if (!loggedWholesaler) return;
    const res = await fetch("/api/wholesaler/clients", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-wholesaler-id": loggedWholesaler.id 
      },
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
      headers: {
        "Content-Type": "application/json",
        "x-wholesaler-id": loggedWholesaler.id
      },
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
        localStorage.removeItem("wholesalerProfile");
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
        setView={setView} 
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
              onWholesaleClick={() => setView("wholesaler")}
            />
            {/* Products grid and checkout modals */}
            <RetailCatalog 
              products={products} 
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
              onActivateClient={handleActivateClient}
              onRequestCredit={handleRequestCredit}
              refreshWholesalerData={fetchWholesalerData}
              onLogoutWholesaler={handleWholesalerLogout}
            />
          </div>
        )}

        {currentView === "admin" && (
          <div className="animate-in fade-in duration-300">
            <AdminSimulator 
              stats={adminStats}
              wholesalers={adminWholesalers}
              orders={adminOrders}
              requests={adminRequests}
              notifications={adminNotifications}
              products={products}
              tutorials={tutorials}
              clients={adminClients}
              onUpdateClient={handleUpdateClient}
              onApproveWholesaler={handleApproveWholesaler}
              onAddCreditManual={handleAddCreditManual}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onProcessCreditRequest={handleProcessCreditRequest}
              onMarkNotificationRead={handleMarkNotificationRead}
              onDeleteNotification={handleDeleteNotification}
              onResetDatabase={handleResetDatabase}
              refreshAllData={refreshAllData}
              onLogoutAdmin={handleAdminLogout}
            />
          </div>
        )}
      </main>

      {/* Background Autoplay Music Widget */}
      <MusicPlayer />

      {/* Modern Compact Footer */}
      <footer className="border-t border-gray-900 bg-black/40 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 KURTAL IPTV Premium. Tous droits réservés. Vente en gros et au détail.</p>
          <div className="flex space-x-4 text-gray-400 font-medium">
            <span className="hover:text-white cursor-pointer" onClick={() => setView("retail")}>Accueil</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setView("wholesaler")}>Espace Revendeurs</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setView("admin")}>Simulateur Admin</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
