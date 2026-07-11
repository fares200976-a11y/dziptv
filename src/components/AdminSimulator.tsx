import { useState, useEffect } from "react";
import { Wholesaler, Order, CreditRequest, EmailNotification, AppStats } from "../types";
import { 
  Mail, 
  Users, 
  FileText, 
  CheckCircle, 
  X, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  Smartphone, 
  UserCheck, 
  Plus, 
  RefreshCw,
  Clock,
  AlertCircle
} from "lucide-react";

interface AdminSimulatorProps {
  stats: AppStats;
  wholesalers: Wholesaler[];
  orders: Order[];
  requests: CreditRequest[];
  notifications: EmailNotification[];
  onApproveWholesaler: (id: string, currentStatus: string) => Promise<void>;
  onAddCreditManual: (id: string, amount: number) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: "completed" | "cancelled") => Promise<void>;
  onProcessCreditRequest: (id: string, action: "approve" | "reject") => Promise<void>;
  onMarkNotificationRead: (id: string) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  refreshAllData: () => void;
}

export default function AdminSimulator({
  stats,
  wholesalers,
  orders,
  requests,
  notifications,
  onApproveWholesaler,
  onAddCreditManual,
  onUpdateOrderStatus,
  onProcessCreditRequest,
  onMarkNotificationRead,
  onDeleteNotification,
  onResetDatabase,
  refreshAllData
}: AdminSimulatorProps) {
  const [activeTab, setActiveTab] = useState<"emails" | "wholesalers" | "requests" | "orders">("emails");
  const [refreshing, setRefreshing] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleRefreshClick = () => {
    setRefreshing(true);
    refreshAllData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleResetClick = async () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser la base de données ? Toutes vos données personnalisées seront effacées.")) {
      await onResetDatabase();
      setResetMessage("Base de données réinitialisée aux valeurs d'origine !");
      setTimeout(() => setResetMessage(""), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-gray-900 rounded-2xl border border-amber-500/20 shadow-xl">
        <div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Simulateur d'Administration Client/Serveur
          </span>
          <h2 className="font-display text-2xl font-bold text-white mt-2">DZ IPTV Controller Hub ⚙️</h2>
          <p className="text-gray-400 text-xs mt-1">Supervisez l'ensemble du site de vente en temps réel, vérifiez les emails reçus et validez les comptes.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshClick}
            className="p-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 text-gray-400 hover:text-white transition-all"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={handleResetClick}
            className="px-3.5 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Réinitialiser BDD
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
          {resetMessage}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-gray-800">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Chiffre d'Affaire Total</span>
          <span className="text-2xl font-black font-display text-amber-400 mt-1 block">
            {stats.totalRevenueDA.toLocaleString()} DA
          </span>
          <span className="text-[9px] text-gray-500 mt-1 block">Détail + Wholesale accumulés</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-gray-800">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Ventes Boutique Détail</span>
          <span className="text-2xl font-black font-display text-blue-400 mt-1 block">
            {stats.totalRetailSales.toLocaleString()} DA
          </span>
          <span className="text-[9px] text-blue-500/70 mt-1 block">Commandes validées</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-gray-800">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Ventes Grossistes</span>
          <span className="text-2xl font-black font-display text-indigo-400 mt-1 block">
            {stats.totalWholesaleSales.toLocaleString()} DA
          </span>
          <span className="text-[9px] text-indigo-500/70 mt-1 block">Activations de crédits</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-gray-800">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Partenaires Grossistes</span>
          <span className="text-2xl font-black font-display text-emerald-400 mt-1 block">
            {stats.activeWholesalers}
          </span>
          <span className="text-[9px] text-emerald-500/70 mt-1 block">Commerces actifs approuvés</span>
        </div>
      </div>

      {/* Admin Tabs Panel Selector */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
        <div className="flex border-b border-gray-800 bg-gray-900/10">
          <button
            onClick={() => setActiveTab("emails")}
            className={`flex-1 sm:flex-initial px-5 py-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "emails"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email Simulator ({notifications.filter(n => !n.read).length})</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("wholesalers")}
            className={`flex-1 sm:flex-initial px-5 py-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "wholesalers"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Revendeurs ({wholesalers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 sm:flex-initial px-5 py-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "requests"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Dmd de Recharge ({requests.filter(r => r.status === "pending").length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 sm:flex-initial px-5 py-4 text-xs font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "orders"
                ? "border-amber-500 text-amber-400 bg-amber-500/5"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Commandes Détail ({orders.filter(o => o.status === "pending").length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          
          {/* TAB 1: EMAIL SIMULATOR (NOTIFICATIONS ADMIN) */}
          {activeTab === "emails" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed">
                📢 <strong>Notifications de messagerie simulée :</strong> L'administrateur reçoit automatiquement un e-mail sur <strong>admin@dziptv.com</strong> pour chaque interaction du site (commande, inscription, recharges). Ce module intercepte ces notifications.
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-3.5">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row justify-between items-start gap-4 ${
                        notif.read 
                          ? "bg-gray-900/30 border-gray-800 text-gray-400" 
                          : "bg-gray-900 border-amber-500/20 text-gray-200"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold text-[9px] uppercase">
                            {notif.type.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-gray-500">{new Date(notif.sentAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{notif.subject}</h4>
                        <p className="whitespace-pre-line leading-relaxed font-mono text-[11px] bg-black/40 p-3 rounded-lg border border-gray-900 mt-2">
                          {notif.body}
                        </p>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                        {!notif.read && (
                          <button
                            onClick={() => onMarkNotificationRead(notif.id)}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg font-bold text-[10px]"
                          >
                            Lu
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteNotification(notif.id)}
                          className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                          title="Supprimer la notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Mail className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs">Aucune notification e-mail reçue pour le moment.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE WHOLESALERS */}
          {activeTab === "wholesalers" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-900/40 text-gray-400 border-b border-gray-800">
                      <th className="p-3 font-semibold">Boutique</th>
                      <th className="p-3 font-semibold">User / Email</th>
                      <th className="p-3 font-semibold">Téléphone</th>
                      <th className="p-3 font-semibold">Création</th>
                      <th className="p-3 font-semibold">Solde Crédit</th>
                      <th className="p-3 font-semibold">Statut</th>
                      <th className="p-3 font-semibold text-right">Actions de simulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {wholesalers.map((wholesaler) => (
                      <tr key={wholesaler.id} className="hover:bg-gray-900/10">
                        <td className="p-3 font-bold text-white">{wholesaler.businessName}</td>
                        <td className="p-3">
                          <span className="font-mono text-gray-300 block">{wholesaler.username}</span>
                          <span className="text-gray-500">{wholesaler.email}</span>
                        </td>
                        <td className="p-3 font-mono">{wholesaler.phone}</td>
                        <td className="p-3 text-gray-400">{new Date(wholesaler.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="p-3 font-bold text-emerald-400">{wholesaler.creditBalance.toLocaleString()} DA</td>
                        <td className="p-3">
                          {wholesaler.status === "approved" && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-semibold text-[9px]">
                              Approuvé
                            </span>
                          )}
                          {wholesaler.status === "pending" && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold text-[9px] animate-pulse">
                              En attente
                            </span>
                          )}
                          {wholesaler.status === "suspended" && (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-semibold text-[9px]">
                              Suspendu
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-1">
                            {wholesaler.status === "pending" && (
                              <button
                                onClick={() => onApproveWholesaler(wholesaler.id, "approved")}
                                className="px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded font-bold text-[10px] cursor-pointer"
                              >
                                Activer le compte
                              </button>
                            )}

                            {wholesaler.status === "approved" && (
                              <>
                                <button
                                  onClick={() => onAddCreditManual(wholesaler.id, 10000)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] rounded cursor-pointer"
                                  title="Ajouter 10,000 DA"
                                >
                                  +10k DA
                                </button>
                                <button
                                  onClick={() => onAddCreditManual(wholesaler.id, 50000)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded cursor-pointer"
                                  title="Ajouter 50,000 DA"
                                >
                                  +50k DA
                                </button>
                                <button
                                  onClick={() => onApproveWholesaler(wholesaler.id, "suspended")}
                                  className="px-2 py-1 bg-red-500/15 text-red-400 border border-red-500/20 rounded font-bold text-[9px] cursor-pointer"
                                >
                                  Suspendre
                                </button>
                              </>
                            )}

                            {wholesaler.status === "suspended" && (
                              <button
                                onClick={() => onApproveWholesaler(wholesaler.id, "approved")}
                                className="px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded font-bold text-[10px] cursor-pointer"
                              >
                                Réactiver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DEMANDES DE RECHARGE CREDITS */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <strong className="text-white text-sm">{req.wholesalerName}</strong>
                          <span className="text-[10px] text-gray-500">{new Date(req.createdAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <p className="text-gray-300 mt-1">
                          Montant demandé : <strong className="text-amber-400 text-base font-bold font-display">{req.amountDA.toLocaleString()} DA</strong>
                        </p>
                        <p className="text-gray-400 mt-1">
                          Méthode : <span className="uppercase text-white font-semibold">{req.paymentMethod}</span> | Reçu : <span className="font-mono text-gray-300 bg-black/40 px-1.5 py-0.5 rounded">{req.receiptReference}</span>
                        </p>
                      </div>

                      <div>
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onProcessCreditRequest(req.id, "approve")}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-[10px]"
                            >
                              Valider & Créditer
                            </button>
                            <button
                              onClick={() => onProcessCreditRequest(req.id, "reject")}
                              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded font-bold text-[10px]"
                            >
                              Rejeter
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded font-bold text-[10px] ${
                            req.status === "approved" 
                              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {req.status === "approved" ? "Approuvée" : "Rejetée"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs">Aucune demande de recharge en attente.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLIENT RETAIL ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start gap-4 text-xs">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{order.customerName}</span>
                          <span className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <p className="text-gray-300">
                          Produit : <strong className="text-white">{order.productName}</strong> ({order.productType === "iptv" ? "IPTV" : "Boîtier"})
                        </p>
                        <p className="text-amber-400 font-bold font-display text-sm">
                          Tarif payé : {order.priceDA.toLocaleString()} DA
                        </p>
                        <p className="text-gray-400">
                          Tél : <span className="font-mono text-gray-200">{order.customerPhone}</span> {order.customerEmail && `| Email: ${order.customerEmail}`}
                        </p>
                        <p className="text-gray-400 italic bg-black/30 p-2 rounded border border-gray-900 mt-1.5">
                          Mode de paiement : <span className="uppercase text-gray-200 font-semibold">{order.paymentMethod}</span> <br />
                          Preuve : {order.paymentDetails || "Aucune information supplémentaire."}
                        </p>
                      </div>

                      <div className="shrink-0 self-end sm:self-center flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                          order.status === "completed" 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : order.status === "cancelled"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        }`}>
                          {order.status === "pending" ? "En attente de livraison" : order.status === "completed" ? "Livrée & Activée" : "Annulée"}
                        </span>

                        {order.status === "pending" && (
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, "completed")}
                              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-[10px] cursor-pointer"
                            >
                              Valider Livraison
                            </button>
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, "cancelled")}
                              className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded font-bold text-[10px] cursor-pointer"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs">Aucune commande détail enregistrée.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
