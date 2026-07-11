import React, { useState } from "react";
import { Product, Order } from "../types";
import { 
  Check, 
  Tv, 
  Smartphone, 
  ShieldCheck, 
  ShoppingBag, 
  X, 
  CreditCard, 
  Info, 
  CheckCircle,
  Truck,
  Search,
  Package,
  RefreshCw,
  Clock,
  MapPin,
  AlertTriangle
} from "lucide-react";

interface RetailCatalogProps {
  products: Product[];
  onOrderSubmit: (orderData: any) => Promise<any>;
}

export default function RetailCatalog({ products, onOrderSubmit }: RetailCatalogProps) {
  const [filter, setFilter] = useState<"all" | "iptv" | "device" | "adsl" | "track">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"baridimob" | "ccp" | "card" | "hand">("baridimob");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [formError, setFormError] = useState("");

  // Configuration Client Fields
  const [tvModel, setTvModel] = useState("");
  const [installedApp, setInstalledApp] = useState("");
  const [hasAndroidBox, setHasAndroidBox] = useState(false);
  const [downloaderCode, setDownloaderCode] = useState("");

  // Order Tracking States
  const [trackQuery, setTrackQuery] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [trackError, setTrackError] = useState("");

  const filteredProducts = products.filter(
    (p) => filter === "all" || p.type === filter
  );

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) {
      setTrackError("Veuillez saisir votre ID de commande ou numéro de téléphone.");
      return;
    }

    setIsTracking(true);
    setTrackError("");
    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(trackQuery.trim())}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue lors du suivi.");
      }
      const data = await res.json();
      setTrackedOrders(data.orders);
      if (data.orders.length === 0) {
        setTrackError("Aucune commande trouvée pour '" + trackQuery + "'.");
      }
    } catch (err: any) {
      setTrackError(err.message || "Impossible de récupérer les informations de suivi.");
      setTrackedOrders(null);
    } finally {
      setIsTracking(false);
    }
  };

  const handleOpenCheckout = (product: Product) => {
    setSelectedProduct(product);
    setName("");
    setPhone("");
    setEmail("");
    setPaymentMethod("baridimob");
    setPaymentDetails("");
    setSuccessOrder(null);
    setFormError("");
    setTvModel("");
    setInstalledApp("");
    setHasAndroidBox(false);
    setDownloaderCode("");
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setFormError("Le nom complet et le numéro de téléphone sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      // Determine what to put in paymentDetails if payment method is baridimob/ccp
      let details = paymentDetails;
      if (paymentMethod === "baridimob") {
        details = `BaridiMob: ${paymentDetails || "En attente de vérification"}`;
      } else if (paymentMethod === "ccp") {
        details = `Versement CCP: ${paymentDetails || "En attente de vérification"}`;
      } else if (paymentMethod === "card") {
        details = "Paiement par Carte CIB/Edahabia validé automatiquement.";
      } else if (paymentMethod === "hand") {
        details = "Livraison contre remboursement (Yalidine) / Main à main.";
      }

      const orderPayload = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        productId: selectedProduct?.id,
        paymentMethod,
        paymentDetails: details,
        tvModel,
        installedApp,
        hasAndroidBox,
        downloaderCode
      };

      const result = await onOrderSubmit(orderPayload);
      setSuccessOrder(result.order);
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue lors de la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="shop-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 mb-10">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Nos Offres & Produits</h2>
          <p className="text-slate-500 text-sm mt-1">Abonnements IPTV, recharges ADSL Idoom et boîtiers de streaming de dernière génération.</p>
        </div>
        <div className="flex flex-wrap mt-4 md:mt-0 bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 self-start">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tout Voir
          </button>
          <button
            onClick={() => setFilter("iptv")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "iptv"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Abonnements IPTV
          </button>
          <button
            onClick={() => setFilter("device")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "device"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Boîtiers Android & Firestick
          </button>
          <button
            onClick={() => setFilter("adsl")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === "adsl"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Cartes ADSL Idoom
          </button>
          <button
            onClick={() => {
              setFilter("track");
              setTrackQuery("");
              setTrackedOrders(null);
              setTrackError("");
            }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              filter === "track"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-emerald-600 hover:text-white hover:bg-emerald-600/10"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Suivi de Commande</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </div>

      {filter === "track" ? (
        <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-8 text-white">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/25">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-white">Suivi en Temps Réel de Votre Commande</h3>
            <p className="text-gray-400 text-xs max-w-md mx-auto">
              Saisissez votre numéro de téléphone (ex: 0550123456) ou votre identifiant de commande (ex: o-abcdefg) pour connaître l'avancement.
            </p>
          </div>

          <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="ID de commande ou N° de téléphone..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isTracking}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer animate-none"
            >
              {isTracking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <span>Rechercher</span>
                </>
              )}
            </button>
          </form>

          {trackError && (
            <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          {trackedOrders && trackedOrders.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                Commandes trouvées ({trackedOrders.length})
              </h4>
              <div className="space-y-4">
                {trackedOrders.map((order) => {
                  let stepIndex = 0;
                  if (order.status === "pending") stepIndex = 0;
                  else if (order.status === "packaging") stepIndex = 1;
                  else if (order.status === "shipping") stepIndex = 2;
                  else if (order.status === "completed") stepIndex = 3;
                  else if (order.status === "returned") stepIndex = 4;

                  const steps = [
                    { key: "pending", label: "Commande Reçue", desc: "Votre commande est bien enregistrée et en attente de validation.", icon: Clock },
                    { key: "packaging", label: "En Préparation", desc: "Nous configurons votre accès IPTV ou préparons votre colis.", icon: Package },
                    { key: "shipping", label: "En cours d'expédition", desc: "Le livreur est en route ou l'article a été expédié.", icon: Truck },
                    { key: "completed", label: "Livrée & Activée", desc: "Commande finalisée avec succès. Merci pour votre confiance !", icon: CheckCircle }
                  ];

                  if (order.status === "returned") {
                    steps[3] = { key: "returned", label: "Retournée / Annulée", desc: "La commande n'a pas pu être livrée et a été retournée.", icon: AlertTriangle };
                  }

                  return (
                    <div key={order.id} className="p-5 bg-black/30 border border-slate-800 rounded-2xl space-y-5">
                      {/* Top Bar Info */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800/60 pb-3 gap-2">
                        <div>
                          <span className="text-[10px] text-gray-500 block">Identifiant Commande</span>
                          <span className="text-sm font-mono font-bold text-emerald-400">{order.id}</span>
                        </div>
                        <div className="text-sm sm:text-right">
                          <span className="text-[10px] text-gray-500 block">Produit / Service</span>
                          <span className="font-bold text-white">{order.productName}</span>
                        </div>
                        <div className="text-sm sm:text-right">
                          <span className="text-[10px] text-gray-500 block">Montant</span>
                          <span className="font-extrabold text-amber-400">{order.priceDA.toLocaleString()} DA</span>
                        </div>
                      </div>

                      {/* Stepper tracking */}
                      <div className="relative pt-4 pb-2">
                        {/* Stepper Progress Bar Line */}
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800 sm:left-4 sm:right-4 sm:top-5 sm:bottom-auto sm:w-auto sm:h-0.5"></div>

                        {/* Stepper nodes */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-4 relative">
                          {steps.map((step, idx) => {
                            const isCurrent = order.status === step.key;
                            const isPast = idx <= stepIndex && order.status !== "returned";
                            const IconCmp = step.icon;

                            return (
                              <div key={step.key} className="flex sm:flex-col items-center sm:text-center flex-1 space-x-3.5 sm:space-x-0">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all shrink-0 z-10 ${
                                  isCurrent
                                    ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-110"
                                    : isPast
                                    ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                                    : "bg-slate-900 border-slate-800 text-slate-500"
                                }`}>
                                  <IconCmp className="h-4 w-4" />
                                </div>
                                <div className="sm:mt-2 text-left sm:text-center">
                                  <p className={`text-xs font-bold ${isCurrent || isPast ? "text-white" : "text-slate-500"}`}>
                                    {step.label}
                                  </p>
                                  <p className="text-[10px] text-gray-400 line-clamp-2 max-w-[150px] sm:mx-auto mt-0.5 hidden sm:block">
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mobile Step Description */}
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs sm:hidden">
                        <span className="font-bold text-emerald-400 block mb-0.5">Statut Actuel :</span>
                        <p className="text-gray-300">
                          {steps[stepIndex > 3 ? 3 : stepIndex]?.desc}
                        </p>
                      </div>

                      {/* Delivery Driver Info Section */}
                      {order.livreur && (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                            <Truck className="h-4 w-4" />
                            <span>Livreur Assigné (Service Livraison)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                            <div>
                              <span className="text-gray-500 text-[10px] block">Nom du Livreur</span>
                              <span className="font-semibold text-white">{order.livreur.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block">Téléphone de Contact</span>
                              <span className="font-bold text-amber-300">{order.livreur.phone}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block">Secteur / Wilaya</span>
                              <span className="font-semibold text-white">{order.livreur.wilaya || "Toutes Wilayas"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-note */}
                      <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                        <Info className="h-3 w-3" />
                        <span>Mise à jour en temps réel. Pour toute assistance, appelez notre support.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              id={`product-card-${product.id}`}
              className="bg-white rounded-2xl overflow-hidden flex flex-col h-full border border-slate-150 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative group"
            >
              {/* Image banner */}
              <div className="relative h-48 overflow-hidden bg-slate-50">
                {/* Secondary image hover transition if exists */}
                {product.imageUrl2 ? (
                  <>
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-90 transition-all duration-500 group-hover:opacity-0 group-hover:scale-105" 
                    />
                    <img 
                      src={product.imageUrl2} 
                      alt={`${product.name} alternate view`} 
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-90 group-hover:scale-105" 
                    />
                  </>
                ) : (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-all duration-500 group-hover:scale-105" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                
                {/* Product Badge */}
                <span className={`absolute top-4 left-4 px-2.5 py-1 text-[10px] uppercase font-bold rounded ${
                  product.type === "iptv" 
                    ? "bg-blue-50 text-blue-600 border border-blue-200" 
                    : product.type === "adsl"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-purple-50 text-purple-600 border border-purple-200"
                }`}>
                  {product.type === "iptv" ? "Abonnement" : product.type === "adsl" ? "Recharge ADSL" : "Matériel"}
                </span>

                {/* Popular Badge */}
                {product.isPopular && (
                  <span className="absolute top-4 right-4 bg-amber-500 text-black text-[9px] font-extrabold uppercase px-2 py-1 rounded shadow-md tracking-wider">
                    Recommandé
                  </span>
                )}
              </div>

              {/* Content info */}
              <div className="p-6 flex-1 flex flex-col bg-white">
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed flex-grow-0">
                  {product.description}
                </p>

                {/* Bullet points */}
                <ul className="space-y-2 mb-6 flex-grow">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-xs text-slate-700">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mr-2 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Pricing & Call to action */}
                <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Tarif Détail</span>
                    <span className="text-2xl font-black font-display text-indigo-600">{product.priceRetail.toLocaleString()} DA</span>
                    {product.type === "iptv" && <span className="text-slate-400 text-[10px] block">/ 12 Mois</span>}
                  </div>
                  <button
                    id={`btn-buy-${product.id}`}
                    onClick={() => handleOpenCheckout(product)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-blue-500/15 transition-all flex items-center space-x-1 cursor-pointer font-sans"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Commander</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Modal Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800">Formulaire de Commande</h3>
                  <p className="text-xs text-slate-500">Paiement 100% sécurisé et livraison rapide</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            {!successOrder ? (
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium">
                    {formError}
                  </div>
                )}

                {/* Selected Item Recap Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Produit choisi :</span>
                    <h4 className="font-bold text-slate-800 text-base font-display">{selectedProduct.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total à payer :</span>
                    <p className="text-xl font-extrabold text-blue-600 font-display">{selectedProduct.priceRetail.toLocaleString()} DA</p>
                  </div>
                </div>

                {/* Grid Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom & Prénom <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Sofiane Yahiaoui"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Numéro de Téléphone (Algeria) <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      required
                      placeholder="Ex: 0550123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adresse Email (Optionnel)</label>
                  <input 
                    type="email" 
                    placeholder="Ex: sofiane@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Configuration Client Specifics (TV Model, App Installed, Android Box, Downloader Code) */}
                <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100/75 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-indigo-700 tracking-wider">
                    Informations de Configuration (Recommandé pour activation rapide)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Modèle de votre Téléviseur (Optionnel)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Samsung QLED, LG OLED, TCL..."
                        value={tvModel}
                        onChange={(e) => setTvModel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Choix de l'application IPTV <span className="text-red-500">*</span></label>
                      <div className="space-y-1.5">
                        <select
                          value={installedApp}
                          onChange={(e) => setInstalledApp(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                          <option value="">-- Choisir une option --</option>
                          <optgroup label="TV Connectée Samsung & LG WebOS">
                            <option value="Samsung Smart TV (Smarters Pro)">Samsung Smart TV - IPTV Smarters Pro</option>
                            <option value="LG WebOS (SmartOne IPTV)">LG WebOS - SmartOne IPTV (Très stable)</option>
                            <option value="IBO Player">IBO Player (Moderne & Fluide)</option>
                            <option value="Smart IPTV (SIPTV)">Smart IPTV / SIPTV (Classique)</option>
                            <option value="NetIPTV">NetIPTV (Simple)</option>
                            <option value="Set IPTV">Set IPTV (Rapide)</option>
                          </optgroup>
                          <optgroup label="Boîtier Android / Firestick / Autre">
                            <option value="Smarters Pro (Android App)">IPTV Smarters Pro (Android)</option>
                            <option value="TiviMate Player">TiviMate (Recommandé premium Android)</option>
                            <option value="XCIPTV Player">XCIPTV Player</option>
                            <option value="Downloader Code Choice">Downloader App (AFTVnews)</option>
                          </optgroup>
                          <option value="other">Autre application (Saisir manuellement)...</option>
                        </select>
                        
                        {(installedApp === "other" || (!["", "Samsung Smart TV (Smarters Pro)", "LG WebOS (SmartOne IPTV)", "IBO Player", "Smart IPTV (SIPTV)", "NetIPTV", "Set IPTV", "Smarters Pro (Android App)", "TiviMate Player", "XCIPTV Player", "Downloader Code Choice"].includes(installedApp) && installedApp.length > 0)) && (
                          <input 
                            type="text" 
                            placeholder="Nom de l'application installée..."
                            value={installedApp === "other" ? "" : installedApp}
                            onChange={(e) => setInstalledApp(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="flex items-center space-x-2.5 bg-white p-3 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox"
                        id="hasAndroidBox"
                        checked={hasAndroidBox}
                        onChange={(e) => setHasAndroidBox(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4 bg-white cursor-pointer"
                      />
                      <label htmlFor="hasAndroidBox" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                        Je possède un Boîtier/Box Android
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Code Downloader AFTVnews (Optionnel)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 283749"
                        value={downloaderCode}
                        onChange={(e) => setDownloaderCode(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Méthode de Paiement Préférée :</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("baridimob")}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                        paymentMethod === "baridimob"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <span className="text-[10px] font-bold">BaridiMob</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ccp")}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                        paymentMethod === "ccp"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="text-[10px] font-bold">Versement CCP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                        paymentMethod === "card"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="text-[10px] font-bold">CIB / Dahabia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("hand")}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                        paymentMethod === "hand"
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Truck className="h-5 w-5 text-blue-600" />
                      <span className="text-[10px] font-bold">Yalidine COD</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Payment Instructions Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-600 space-y-2.5">
                  {paymentMethod === "baridimob" && (
                    <>
                      <div className="flex items-center space-x-1.5 text-amber-600 font-bold">
                        <Info className="h-3.5 w-3.5 text-amber-500" />
                        <span>Instructions BaridiMob</span>
                      </div>
                      <p className="leading-relaxed">
                        Veuillez transférer le montant de <strong className="text-slate-900">{selectedProduct.priceRetail.toLocaleString()} DA</strong> vers le compte Algérie Poste suivant via votre application BaridiMob :
                      </p>
                      <div className="p-2.5 bg-slate-100 rounded font-mono text-slate-800 border border-slate-200">
                        RIP : 007999990022334455 <br />
                        Titulaire : Belkacem Fares
                      </div>
                      <div className="mt-2">
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Numéro de transaction ou Nom de l'expéditeur :</label>
                        <input
                          type="text"
                          placeholder="Ex: Trans #49120 ou Fares B."
                          value={paymentDetails}
                          onChange={(e) => setPaymentDetails(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === "ccp" && (
                    <>
                      <div className="flex items-center space-x-1.5 text-amber-600 font-bold">
                        <Info className="h-3.5 w-3.5 text-amber-500" />
                        <span>Instructions Versement CCP</span>
                      </div>
                      <p className="leading-relaxed">
                        Rendez-vous dans un bureau d'Algérie Poste pour effectuer le versement de <strong className="text-slate-900">{selectedProduct.priceRetail.toLocaleString()} DA</strong> sur :
                      </p>
                      <div className="p-2.5 bg-slate-100 rounded font-mono text-slate-800 border border-slate-200">
                        CCP : 1234567 Clé 89 <br />
                        Nom : Belkacem Fares
                      </div>
                      <div className="mt-2">
                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Référence du reçu ou numéro de bureau postal :</label>
                        <input
                          type="text"
                          placeholder="Ex: Mandat n° 9812 ou Reçu"
                          value={paymentDetails}
                          onChange={(e) => setPaymentDetails(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === "card" && (
                    <>
                      <div className="flex items-center space-x-1.5 text-blue-600 font-bold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Formulaire Carte Bancaire CIB / Dahabia</span>
                      </div>
                      <p className="text-slate-500 leading-relaxed">
                        Simulation de paiement sécurisé. Saisissez vos coordonnées de carte :
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="Numéro de carte (16 chiffres)"
                          className="col-span-3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Code SMS 3D-Secure"
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === "hand" && (
                    <>
                      <div className="flex items-center space-x-1.5 text-emerald-600 font-bold">
                        <Truck className="h-3.5 w-3.5" />
                        <span>Paiement à la livraison (Yalidine Express)</span>
                      </div>
                      <p className="leading-relaxed text-slate-600">
                        {selectedProduct.type === "device" ? (
                          <>
                            Pour l'achat du boîtier <strong>{selectedProduct.name}</strong>, l'envoi se fera via <strong className="text-slate-900">Yalidine Express</strong>. Vous paierez en espèces à la livraison. Notre agent vous appellera pour confirmer l'adresse de livraison (Wilaya/Commune).
                          </>
                        ) : (
                          <>
                            Pour l'abonnement IPTV, nous pouvons nous rencontrer ou vous appeler pour valider votre code et recevoir le paiement. Nous vous contacterons sous peu pour fixer les modalités.
                          </>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-55 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Traitement en cours...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirmer ma Commande ({selectedProduct.priceRetail.toLocaleString()} DA)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Checkout View */
              <div className="p-8 text-center space-y-5 animate-in fade-in duration-300">
                <div className="mx-auto h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-2xl text-slate-900">Merci pour votre commande !</h3>
                  <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto">
                    Votre commande <span className="text-blue-600 font-mono font-semibold">#{successOrder.id}</span> a été enregistrée avec succès.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-left text-xs text-slate-600 space-y-1.5 max-w-md mx-auto">
                  <p><strong className="text-slate-800">Client :</strong> {successOrder.customerName}</p>
                  <p><strong className="text-slate-800">Téléphone :</strong> {successOrder.customerPhone}</p>
                  <p><strong className="text-slate-800">Produit :</strong> {successOrder.productName}</p>
                  <p><strong className="text-slate-800">Montant :</strong> {successOrder.priceDA.toLocaleString()} DA</p>
                  <p><strong className="text-slate-800">Méthode de paiement :</strong> {successOrder.paymentMethod.toUpperCase()}</p>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-amber-800 font-medium bg-amber-50 border border-amber-200 py-2.5 px-4 rounded-lg inline-block max-w-sm">
                    ⚡ Notre administrateur a reçu une notification immédiate par e-mail. Nous allons vous appeler au téléphone pour valider l'accès.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer border border-slate-250 transition-colors"
                >
                  Fermer la fenêtre
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
