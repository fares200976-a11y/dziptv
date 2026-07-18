import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Wholesaler, Order, CreditRequest, EmailNotification, AppStats, Product, VideoTutorial, IptvClient, Livreur, PanelRequest, CatalogCategory } from "../types";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import { 
  Mail, 
  Users, 
  FileText, 
  CheckCircle, 
  X, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon,
  TrendingUp, 
  Smartphone, 
  UserCheck, 
  Plus, 
  RefreshCw,
  Download,
  Clock,
  AlertCircle,
  Video,
  ShoppingBag,
  Tv,
  Flame,
  PlusCircle,
  Edit2,
  Save,
  Undo2,
  Info,
  LogOut,
  Truck,
  Key,
  FolderOpen,
  Box,
  Zap
} from "lucide-react";

interface AdminSimulatorProps {
  isOwner?: boolean;
  permissions?: string[];
  adminName?: string;
  adminCreditBalance?: number;
  onStaffActivateClient?: (payload: any) => Promise<any>;
  stats: AppStats;
  wholesalers: Wholesaler[];
  orders: Order[];
  requests: CreditRequest[];
  notifications: EmailNotification[];
  products: Product[];
  tutorials: VideoTutorial[];
  clients: IptvClient[];
  panelRequests?: PanelRequest[];
  catalogCategories?: CatalogCategory[];
  onUpdateClient: (id: string, payload: any) => Promise<void>;
  onApproveWholesaler: (id: string, currentStatus: string) => Promise<void>;
  onAddCreditManual: (id: string, amount: number) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: "completed" | "cancelled") => Promise<void>;
  onUpdateOrderCredentials?: (id: string, payload: any) => Promise<void>;
  onDeleteClient?: (id: string) => Promise<void>;
  onDeleteOrder?: (id: string) => Promise<void>;
  onProcessCreditRequest: (id: string, action: "approve" | "reject") => Promise<void>;
  onProcessPanelRequest?: (id: string, status: "approved" | "rejected", notes?: string) => Promise<void>;
  onAddCategory?: (payload: { name: string; description?: string; icon?: string; color?: string }) => Promise<CatalogCategory | undefined | void>;
  onUpdateCategory?: (id: string, payload: { name: string; description?: string; icon?: string; color?: string }) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
  onMarkNotificationRead: (id: string) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  refreshAllData: () => void;
  onLogoutAdmin?: () => void;
}

const isStandardType = (t: string) => {
  return [
    "code iptv",
    "abonnement iptv",
    "televiseur",
    "boitier android",
    "application",
    "demodulateur",
    "code sat",
    "recharge adsl",
    "accessoire"
  ].includes(t);
};

// Commandes boutique pour lesquelles l'admin peut fournir des accès IPTV
// (M3U, Xtream, lien de bouquets) : uniquement Dino / 8K / Golden OTT.
const ADULT_TOGGLE_NAMES = ["dino", "8k", "golden"];
const isIptvOrderWithAccess = (order: any) => {
  return (order.productType === "iptv" || order.productType === "code iptv")
    && ADULT_TOGGLE_NAMES.some(n => (order.productName || "").toLowerCase().includes(n));
};

// Sections accordables à un membre de l'équipe (doit correspondre à
// ADMIN_PERMISSION_TABS côté serveur). "team" n'est jamais accordable.
const PERMISSION_TAB_LABELS: { key: string; label: string }[] = [
  { key: "emails", label: "Emails" },
  { key: "wholesalers", label: "Revendeurs" },
  { key: "requests", label: "Recharges" },
  { key: "orders", label: "Commandes" },
  { key: "products", label: "Catalogue Produits" },
  { key: "tutorials", label: "Tutoriels Vidéo" },
  { key: "clients", label: "Abonnements Grossistes" },
  { key: "livreurs", label: "Livreurs & Suivi" },
  { key: "panels", label: "Demandes Panels" },
  { key: "categories", label: "Catégories" },
  { key: "slides", label: "Bannières Accueil" }
];

export default function AdminSimulator({
  isOwner = true,
  permissions = [],
  adminName = "",
  adminCreditBalance = 0,
  onStaffActivateClient,
  stats,
  wholesalers,
  orders,
  requests,
  notifications,
  products,
  tutorials,
  clients = [],
  panelRequests = [],
  catalogCategories = [],
  onUpdateClient,
  onApproveWholesaler,
  onAddCreditManual,
  onUpdateOrderStatus,
  onUpdateOrderCredentials,
  onDeleteClient,
  onDeleteOrder,
  onProcessCreditRequest,
  onProcessPanelRequest,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMarkNotificationRead,
  onDeleteNotification,
  onResetDatabase,
  refreshAllData,
  onLogoutAdmin
}: AdminSimulatorProps) {
  const { t } = useTranslation();
  const canAccess = (tab: string) => isOwner || permissions.includes(tab);
  const [activeTab, setActiveTab] = useState<"emails" | "wholesalers" | "requests" | "orders" | "products" | "tutorials" | "clients" | "livreurs" | "panels" | "categories" | "slides" | "team">("emails");

  // Si le compte connecté (membre d'équipe) n'a pas accès à l'onglet par
  // défaut ("emails"), on bascule automatiquement sur la première section autorisée.
  useEffect(() => {
    if (!canAccess(activeTab)) {
      const firstAllowed = PERMISSION_TAB_LABELS.find(t => canAccess(t.key));
      if (firstAllowed) setActiveTab(firstAllowed.key as any);
    }
  }, [isOwner, permissions]);

  // Liens de gestion des bouquets (Dino / 8K / Golden OTT), affichés au revendeur après activation IPTV
  const [bouquetLinks, setBouquetLinks] = useState<{ dino: string; "8k": string; "golden ott": string }>({ dino: "", "8k": "", "golden ott": "" });
  const [bouquetLinksLoaded, setBouquetLinksLoaded] = useState(false);
  const [bouquetLinksSaving, setBouquetLinksSaving] = useState(false);
  const [bouquetLinksSaved, setBouquetLinksSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/bouquet-links")
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        setBouquetLinks({
          dino: data.dino || "",
          "8k": data["8k"] || "",
          "golden ott": data["golden ott"] || ""
        });
        setBouquetLinksLoaded(true);
      })
      .catch(() => setBouquetLinksLoaded(true));
  }, []);

  const handleSaveBouquetLinks = async () => {
    setBouquetLinksSaving(true);
    setBouquetLinksSaved(false);
    try {
      const res = await fetch("/api/admin/bouquet-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bouquetLinks)
      });
      if (res.ok) {
        setBouquetLinksSaved(true);
        setTimeout(() => setBouquetLinksSaved(false), 2500);
      }
    } catch (e) {
      console.error("Error saving bouquet links:", e);
    } finally {
      setBouquetLinksSaving(false);
    }
  };

  // --- Stock de codes pré-chargés (Code Sat / IPTV à code d'activation) ---
  const [codeStock, setCodeStock] = useState<any[]>([]);
  const [stockProductId, setStockProductId] = useState("");
  const [bulkCodesText, setBulkCodesText] = useState("");
  const [stockLoading, setStockLoading] = useState(false);
  const [stockMessage, setStockMessage] = useState("");

  const fetchCodeStock = () => {
    fetch("/api/admin/code-stock")
      .then(res => res.ok ? res.json() : [])
      .then(data => setCodeStock(Array.isArray(data) ? data : []))
      .catch(() => setCodeStock([]));
  };

  useEffect(() => {
    fetchCodeStock();
  }, []);

  const codeStockProducts = products.filter(p => p.usesCodeStock);

  const handleAddBulkCodes = async () => {
    if (!stockProductId) {
      setStockMessage("Choisissez d'abord un produit.");
      return;
    }
    const codes = bulkCodesText.split("\n").map(c => c.trim()).filter(c => c.length > 0);
    if (codes.length === 0) {
      setStockMessage("Collez au moins un code (un par ligne).");
      return;
    }
    setStockLoading(true);
    setStockMessage("");
    try {
      const res = await fetch("/api/admin/code-stock/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: stockProductId, codes })
      });
      const data = await res.json();
      if (res.ok) {
        setStockMessage(data.message);
        setBulkCodesText("");
        fetchCodeStock();
      } else {
        setStockMessage(data.error || "Échec de l'ajout.");
      }
    } catch (err: any) {
      setStockMessage(err.message);
    } finally {
      setStockLoading(false);
    }
  };

  const handleDeleteStockCode = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/code-stock/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCodeStock();
      } else {
        const data = await res.json();
        setStockMessage(data.error || "Échec de la suppression.");
      }
    } catch (err: any) {
      setStockMessage(err.message);
    }
  };

  // Saisie des accès IPTV (M3U, Xtream, lien bouquets) pour une commande boutique
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderCredForm, setOrderCredForm] = useState({
    m3uUrl: "",
    xtreamHost: "",
    xtreamUser: "",
    xtreamPass: "",
    bouquetLink: "",
    adultContent: false
  });

  const startEditOrderCredentials = (order: any) => {
    setEditingOrderId(order.id);
    setOrderCredForm({
      m3uUrl: order.credentials?.m3uUrl || "",
      xtreamHost: order.credentials?.xtreamHost || "",
      xtreamUser: order.credentials?.xtreamUser || "",
      xtreamPass: order.credentials?.xtreamPass || "",
      bouquetLink: order.credentials?.bouquetLink || "",
      adultContent: !!order.adultContent
    });
  };

  const handleSaveOrderCredentials = async () => {
    if (!editingOrderId || !onUpdateOrderCredentials) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await onUpdateOrderCredentials(editingOrderId, {
        adultContent: orderCredForm.adultContent,
        credentials: {
          m3uUrl: orderCredForm.m3uUrl,
          xtreamHost: orderCredForm.xtreamHost,
          xtreamUser: orderCredForm.xtreamUser,
          xtreamPass: orderCredForm.xtreamPass,
          bouquetLink: orderCredForm.bouquetLink
        }
      });
      setSuccessMessage("Accès IPTV enregistrés et visibles par le client.");
      setEditingOrderId(null);
      refreshAllData();
    } catch (err: any) {
      setErrorMessage(err.message || "Échec de l'enregistrement des accès.");
    }
  };

  // --- Bannières / slides du carrousel d'accueil ---
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [slideForm, setSlideForm] = useState({
    badge: "",
    title: "",
    highlightWord: "",
    buttonText: "Acheter Maintenant",
    imageUrl: "",
    productId: "",
    linkUrl: "",
    isNew: false
  });

  const fetchHeroSlides = () => {
    fetch("/api/hero-slides")
      .then(res => res.ok ? res.json() : [])
      .then(data => setHeroSlides(Array.isArray(data) ? data : []))
      .catch(() => setHeroSlides([]));
  };

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  const resetSlideForm = () => {
    setSlideForm({ badge: "", title: "", highlightWord: "", buttonText: "Acheter Maintenant", imageUrl: "", productId: "", linkUrl: "", isNew: false });
  };

  const handleAddSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slideForm)
      });
      if (res.ok) {
        setSuccessMessage(`Slide "${slideForm.title}" ajoutée avec succès !`);
        resetSlideForm();
        setShowAddSlide(false);
        fetchHeroSlides();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Échec de l'ajout de la slide.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const startEditSlide = (slide: any) => {
    setEditingSlide(slide);
    setSlideForm({
      badge: slide.badge || "",
      title: slide.title || "",
      highlightWord: slide.highlightWord || "",
      buttonText: slide.buttonText || "",
      imageUrl: slide.imageUrl || "",
      productId: slide.productId || "",
      linkUrl: slide.linkUrl || "",
      isNew: !!slide.isNew
    });
  };

  const handleEditSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/hero-slides/${editingSlide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slideForm)
      });
      if (res.ok) {
        setSuccessMessage("Slide mise à jour avec succès !");
        setEditingSlide(null);
        resetSlideForm();
        fetchHeroSlides();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Échec de la modification.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteSlide = async (id: string, title: string) => {
    if (!confirm(`Supprimer la slide "${title}" ?`)) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMessage("Slide supprimée.");
        fetchHeroSlides();
      } else {
        setErrorMessage("Échec de la suppression.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // --- Équipe : comptes admin secondaires ---
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    username: "",
    password: "",
    permissions: [] as string[],
    alertEmail: "",
    alertWhatsappPhone: "",
    alertWhatsappApiKey: "",
    alertTelegramChatId: ""
  });

  const fetchTeamMembers = () => {
    fetch("/api/admin/team")
      .then(res => res.ok ? res.json() : [])
      .then(data => setTeamMembers(Array.isArray(data) ? data : []))
      .catch(() => setTeamMembers([]));
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Compte créé pour "${teamForm.name}" — communiquez-lui son nom d'utilisateur et mot de passe.`);
        setTeamForm({ name: "", username: "", password: "", permissions: [], alertEmail: "", alertWhatsappPhone: "", alertWhatsappApiKey: "", alertTelegramChatId: "" });
        setShowAddTeamMember(false);
        fetchTeamMembers();
      } else {
        setErrorMessage(data.error || "Échec de la création du compte.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const toggleFormPermission = (key: string) => {
    setTeamForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key]
    }));
  };

  const [editingPermissionsFor, setEditingPermissionsFor] = useState<string | null>(null);
  const [editPermissionsDraft, setEditPermissionsDraft] = useState<string[]>([]);
  const [editAlertDraft, setEditAlertDraft] = useState({ alertEmail: "", alertWhatsappPhone: "", alertWhatsappApiKey: "", alertTelegramChatId: "" });
  const [editCreditDraft, setEditCreditDraft] = useState<string>("0");
  const [editPasswordDraft, setEditPasswordDraft] = useState<string>("");

  const startEditPermissions = (member: any) => {
    setEditingPermissionsFor(member.id);
    setEditPermissionsDraft(member.permissions || []);
    setEditAlertDraft({
      alertEmail: member.alertEmail || "",
      alertWhatsappPhone: member.alertWhatsappPhone || "",
      alertWhatsappApiKey: member.alertWhatsappApiKey || "",
      alertTelegramChatId: member.alertTelegramChatId || ""
    });
    setEditCreditDraft(String(member.creditBalance ?? 0));
    setEditPasswordDraft("");
  };

  const toggleEditPermission = (key: string) => {
    setEditPermissionsDraft(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const handleSaveMemberPermissions = async (id: string) => {
    if (editPasswordDraft && editPasswordDraft.length < 6) {
      setErrorMessage("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload: any = { permissions: editPermissionsDraft, creditBalance: Number(editCreditDraft) || 0, ...editAlertDraft };
      if (editPasswordDraft) payload.password = editPasswordDraft;
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMessage(editPasswordDraft ? "Tâches, crédit, alertes et mot de passe mis à jour." : "Tâches, crédit et alertes mis à jour.");
        setEditingPermissionsFor(null);
        setEditPasswordDraft("");
        fetchTeamMembers();
      } else {
        setErrorMessage("Échec de la mise à jour des tâches.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Retirer l'accès de "${name}" ?`)) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMessage("Accès retiré.");
        fetchTeamMembers();
      } else {
        setErrorMessage("Échec de la suppression.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };
  const [refreshing, setRefreshing] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Tv");
  const [newCategoryColor, setNewCategoryColor] = useState("indigo");
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null);
  const [panelActionNotes, setPanelActionNotes] = useState<Record<string, string>>({});

  // Deliverers (Livreurs) state and CRUD
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [showAddLivreur, setShowAddLivreur] = useState(false);
  const [editingLivreur, setEditingLivreur] = useState<Livreur | null>(null);
  const [livreurForm, setLivreurForm] = useState({
    name: "",
    phone: "",
    wilaya: "",
    status: "active" as "active" | "inactive"
  });

  const fetchLivreurs = async () => {
    try {
      const res = await fetch("/api/admin/livreurs");
      if (res.ok) {
        const data = await res.json();
        setLivreurs(data);
      }
    } catch (e) {
      console.error("Error fetching livreurs:", e);
    }
  };

  React.useEffect(() => {
    fetchLivreurs();
  }, []);

  const handleAddLivreurSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/livreurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(livreurForm)
      });
      if (res.ok) {
        setSuccessMessage(`Livreur "${livreurForm.name}" ajouté avec succès !`);
        setLivreurForm({ name: "", phone: "", wilaya: "", status: "active" });
        setShowAddLivreur(false);
        fetchLivreurs();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Erreur lors du rajout.");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleEditLivreurSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLivreur) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/livreurs/${editingLivreur.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLivreur)
      });
      if (res.ok) {
        setSuccessMessage("Informations livreur mises à jour !");
        setEditingLivreur(null);
        fetchLivreurs();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Erreur de mise à jour.");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleDeleteLivreur = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce livreur ?")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/livreurs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMessage("Livreur supprimé de la base.");
        fetchLivreurs();
      } else {
        setErrorMessage("Impossible de supprimer le livreur.");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleUpdateDelivery = async (orderId: string, assignedLivreurId: string, deliveryStatus: string) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedLivreurId, deliveryStatus })
      });
      if (res.ok) {
        setSuccessMessage("Suivi de livraison mis à jour avec succès !");
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Erreur de mise à jour livraison.");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  // Client edit states
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientForm, setClientForm] = useState({
    clientName: "",
    server: "" as any,
    durationMonths: 12,
    status: "active" as "active" | "expired",
    notes: "",
    adultContent: false,
    m3uUrl: "",
    xtreamHost: "",
    xtreamUser: "",
    xtreamPass: ""
  });

  // --- Auto-activation par un membre de l'équipe (avec son propre crédit) ---
  const [showStaffActivate, setShowStaffActivate] = useState(false);
  const [staffServiceType, setStaffServiceType] = useState<"iptv" | "sat" | "box">("iptv");
  const [staffForm, setStaffForm] = useState({
    clientName: "",
    server: "Dino",
    durationMonths: 12,
    productId: "",
    adultContent: false,
    notes: ""
  });
  const [staffActivationResult, setStaffActivationResult] = useState<any>(null);
  const [staffError, setStaffError] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  const staffSatProducts = products.filter(p => p.type === "code sat");
  const staffBoxProducts = products.filter(p => p.type === "boitier android" || p.type === "device");

  const handleStaffActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onStaffActivateClient) return;
    if (!staffForm.clientName) {
      setStaffError("Le nom du client est requis.");
      return;
    }
    if (staffServiceType !== "iptv" && !staffForm.productId) {
      setStaffError("Veuillez sélectionner un produit dans le catalogue.");
      return;
    }
    setStaffLoading(true);
    setStaffError("");
    try {
      const payload: any = {
        clientName: staffForm.clientName,
        serviceType: staffServiceType,
        notes: staffForm.notes
      };
      if (staffServiceType === "iptv") {
        payload.server = staffForm.server;
        payload.durationMonths = staffForm.durationMonths;
        payload.adultContent = staffForm.adultContent;
      } else {
        payload.productId = staffForm.productId;
        if (staffServiceType === "sat") payload.durationMonths = staffForm.durationMonths;
      }
      const result = await onStaffActivateClient(payload);
      setStaffActivationResult(result.client);
      setStaffForm({ clientName: "", server: "Dino", durationMonths: 12, productId: "", adultContent: false, notes: "" });
      setShowStaffActivate(false);
    } catch (err: any) {
      setStaffError(err.message || "Échec de l'activation.");
    } finally {
      setStaffLoading(false);
    }
  };

  const handleEditClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        clientName: clientForm.clientName,
        server: clientForm.server,
        durationMonths: clientForm.durationMonths,
        status: clientForm.status,
        notes: clientForm.notes,
        adultContent: clientForm.adultContent,
        credentials: {
          m3uUrl: clientForm.m3uUrl,
          xtreamHost: clientForm.xtreamHost,
          xtreamUser: clientForm.xtreamUser,
          xtreamPass: clientForm.xtreamPass
        }
      };
      await onUpdateClient(editingClient.id, payload);
      setSuccessMessage(`Abonnement de "${clientForm.clientName}" mis à jour avec succès !`);
      setEditingClient(null);
      refreshAllData();
    } catch (err: any) {
      setErrorMessage("Échec de la modification : " + err.message);
    }
  };

  const startEditClient = (client: any) => {
    setEditingClient(client);
    setClientForm({
      clientName: client.clientName,
      server: client.server,
      durationMonths: client.durationMonths,
      status: client.status,
      notes: client.notes || "",
      adultContent: !!client.adultContent,
      m3uUrl: client.credentials?.m3uUrl || "",
      xtreamHost: client.credentials?.xtreamHost || "",
      xtreamUser: client.credentials?.xtreamUser || "",
      xtreamPass: client.credentials?.xtreamPass || ""
    });
  };

  // Product CRUD Form States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    type: "code iptv" as string,
    priceRetail: 0,
    priceWholesale: 0,
    description: "",
    featuresString: "",
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&w=400&q=80",
    imageUrl2: "",
    categoryId: "",
    usesCodeStock: false
  });

  // Ajout rapide d'une catégorie directement depuis le formulaire produit
  // (sans changer d'onglet), pour le formulaire "Ajouter un produit"
  const [quickAddCatOpenNew, setQuickAddCatOpenNew] = useState(false);
  const [quickAddCatNameNew, setQuickAddCatNameNew] = useState("");
  const [quickAddCatLoadingNew, setQuickAddCatLoadingNew] = useState(false);

  // Idem pour le formulaire "Modifier un produit"
  const [quickAddCatOpenEdit, setQuickAddCatOpenEdit] = useState(false);
  const [quickAddCatNameEdit, setQuickAddCatNameEdit] = useState("");
  const [quickAddCatLoadingEdit, setQuickAddCatLoadingEdit] = useState(false);

  const handleQuickAddCategory = async (
    name: string,
    onCreated: (categoryId: string) => void,
    setLoading: (v: boolean) => void,
    closeForm: () => void
  ) => {
    if (!name.trim() || !onAddCategory) return;
    setLoading(true);
    try {
      const newCategory = await onAddCategory({ name: name.trim() });
      if (newCategory && (newCategory as CatalogCategory).id) {
        onCreated((newCategory as CatalogCategory).id);
      }
      closeForm();
    } catch (e) {
      console.error("Error quick-adding category:", e);
    } finally {
      setLoading(false);
    }
  };

  // Tutorial CRUD Form States
  const [editingTutorial, setEditingTutorial] = useState<VideoTutorial | null>(null);
  const [showAddTutorial, setShowAddTutorial] = useState(false);
  const [tutorialForm, setTutorialForm] = useState({
    title: "",
    url: "",
    description: "",
    category: "smart_tv" as "smart_tv" | "android" | "firestick" | "other",
    downloaderCode: ""
  });

  // Wholesaler Direct Form States
  const [showAddWholesaler, setShowAddWholesaler] = useState(false);
  const [editingWholesaler, setEditingWholesaler] = useState<any | null>(null);
  const [wholesalerForm, setWholesalerForm] = useState({
    username: "",
    password: "",
    businessName: "",
    email: "",
    phone: "",
    creditBalance: 10000
  });

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

  // Exporte toutes les commandes boutique en fichier Excel (.xlsx), pour
  // archivage / sauvegarde manuelle par l'admin.
  const handleExportOrdersExcel = () => {
    const rows = orders.map(o => ({
      "N° Commande": o.id,
      "Date": new Date(o.createdAt).toLocaleString("fr-FR"),
      "Client": o.customerName,
      "Téléphone": o.customerPhone,
      "Email": o.customerEmail || "",
      "Produit": o.productName,
      "Type": o.productType,
      "Prix (DA)": o.priceDA,
      "Statut": o.status,
      "Méthode Paiement": o.paymentMethod,
      "Détails Paiement": o.paymentDetails || "",
      "Contenu Adulte": o.adultContent === undefined ? "" : (o.adultContent ? "Oui" : "Non"),
      "Wilaya Livraison": o.shippingWilaya || "",
      "Type Livraison": o.shippingType || "",
      "Adresse Livraison": o.shippingAddress || "",
      "Frais Livraison (DA)": o.shippingPriceDA || "",
      "Xtream Host": o.credentials?.xtreamHost || "",
      "Xtream User": o.credentials?.xtreamUser || "",
      "Xtream Pass": o.credentials?.xtreamPass || "",
      "Lien M3U": o.credentials?.m3uUrl || "",
      "Code": o.credentials?.satCode || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commandes");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `kurtal-commandes-${dateStr}.xlsx`);
  };

  // Direct Wholesaler Creation Submit
  const handleAddWholesalerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/wholesalers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wholesalerForm)
      });
      if (res.ok) {
        setSuccessMessage(`Compte revendeur "${wholesalerForm.businessName}" créé avec succès !`);
        setWholesalerForm({
          username: "",
          password: "",
          businessName: "",
          email: "",
          phone: "",
          creditBalance: 10000
        });
        setShowAddWholesaler(false);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Une erreur est survenue lors de la création.");
      }
    } catch (err: any) {
      setErrorMessage("Erreur réseau: " + err.message);
    }
  };

  // Edit Wholesaler Credentials & Profile Submit
  const handleEditWholesalerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWholesaler) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/wholesalers/${editingWholesaler.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingWholesaler.username,
          password: editingWholesaler.password || "",
          businessName: editingWholesaler.businessName,
          email: editingWholesaler.email,
          phone: editingWholesaler.phone,
          creditBalance: Number(editingWholesaler.creditBalance),
          status: editingWholesaler.status
        })
      });
      if (res.ok) {
        setSuccessMessage(`Compte revendeur "${editingWholesaler.businessName}" mis à jour avec succès !`);
        setEditingWholesaler(null);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Une erreur est survenue lors de la mise à jour.");
      }
    } catch (err: any) {
      setErrorMessage("Erreur réseau: " + err.message);
    }
  };

  // Product CRUD Submits
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean, field: "imageUrl" | "imageUrl2") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditingProduct(prev => prev ? { ...prev, [field]: base64String } : null);
      } else {
        setProductForm(prev => ({ ...prev, [field]: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlideForm(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        ...productForm,
        features: productForm.featuresString.split(",").map(f => f.trim()).filter(f => f.length > 0)
      };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMessage(`Produit "${productForm.name}" ajouté avec succès !`);
        setProductForm({
          name: "",
          type: "code iptv",
          priceRetail: 0,
          priceWholesale: 0,
          description: "",
          featuresString: "",
          imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&w=400&q=80",
          imageUrl2: "",
          categoryId: "",
          usesCodeStock: false
        });
        setShowAddProduct(false);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Échec de l'ajout.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        ...editingProduct,
        features: (editingProduct as any).featuresString
          ? (editingProduct as any).featuresString.split(",").map((f: string) => f.trim()).filter((f: string) => f.length > 0)
          : editingProduct.features
      };
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMessage("Produit mis à jour avec succès !");
        setEditingProduct(null);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Échec de la modification.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMessage("Produit supprimé avec succès.");
        refreshAllData();
      } else {
        setErrorMessage("Impossible de supprimer le produit.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Tutorial CRUD Submits
  const handleAddTutorialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/tutorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tutorialForm)
      });
      if (res.ok) {
        setSuccessMessage(`Tutoriel "${tutorialForm.title}" ajouté avec succès !`);
        setTutorialForm({
          title: "",
          url: "",
          description: "",
          category: "smart_tv",
          downloaderCode: ""
        });
        setShowAddTutorial(false);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Échec de l'ajout.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleEditTutorialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTutorial) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/tutorials/${editingTutorial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTutorial)
      });
      if (res.ok) {
        setSuccessMessage("Tutoriel mis à jour avec succès !");
        setEditingTutorial(null);
        refreshAllData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Échec de la modification.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteTutorial = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce tutoriel ?")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch(`/api/tutorials/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMessage("Tutoriel supprimé.");
        refreshAllData();
      } else {
        setErrorMessage("Échec de la suppression.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-amber-50 via-white to-slate-50 rounded-2xl border border-amber-200 shadow-sm">
        <div>
          <span className="text-xs bg-amber-500/10 text-amber-700 border border-amber-500/30 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Simulateur d'Administration Client/Serveur
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-900 mt-2">KURTAL IPTV Controller Hub ⚙️</h2>
          <p className="text-slate-500 text-sm mt-1">Supervisez l'ensemble du site de vente en temps réel, vérifiez les emails reçus et validez les comptes.</p>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle variant="light" />

          <button
            onClick={handleRefreshClick}
            className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-amber-600" : ""}`} />
          </button>

          {isOwner && (
          <button
            onClick={handleExportOrdersExcel}
            className="px-3.5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-500/20 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center space-x-1.5"
            title="Télécharger toutes les commandes en Excel"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Backup Commandes</span>
          </button>
          )}

          {onLogoutAdmin && (
            <button
              onClick={onLogoutAdmin}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm transition-all flex items-center space-x-1 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t("admin.logout")}</span>
            </button>
          )}
        </div>
      </div>

      {resetMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-sm font-semibold">
          {resetMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-lg text-sm font-semibold">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Chiffre d'Affaire Total</span>
          <span className="text-2xl font-black font-display text-amber-600 mt-1 block">
            {stats.totalRevenueDA.toLocaleString()} DA
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Détail + Wholesale accumulés</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Ventes Boutique Détail</span>
          <span className="text-2xl font-black font-display text-blue-600 mt-1 block">
            {stats.totalRetailSales.toLocaleString()} DA
          </span>
          <span className="text-[11px] text-blue-500/70 mt-1 block">Commandes validées</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Ventes Grossistes</span>
          <span className="text-2xl font-black font-display text-indigo-600 mt-1 block">
            {stats.totalWholesaleSales.toLocaleString()} DA
          </span>
          <span className="text-[11px] text-indigo-500/70 mt-1 block">Activations de crédits</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">Partenaires Grossistes</span>
          <span className="text-2xl font-black font-display text-emerald-600 mt-1 block">
            {stats.activeWholesalers}
          </span>
          <span className="text-[11px] text-emerald-500/70 mt-1 block">Commerces actifs approuvés</span>
        </div>
      </div>

      {/* Admin Tabs Panel Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
        <div className="flex flex-wrap border-b border-slate-200 bg-white/10">
          {canAccess("emails") && (
          <button
            onClick={() => setActiveTab("emails")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "emails"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Emails ({notifications.filter(n => !n.read).length})</span>
          </button>
          )}

          {canAccess("wholesalers") && (
          <button
            onClick={() => setActiveTab("wholesalers")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "wholesalers"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className={`h-4 w-4 ${wholesalers.filter(w => w.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}`} />
            <span className={wholesalers.filter(w => w.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}>
              Revendeurs ({wholesalers.length})
            </span>
          </button>
          )}

          {canAccess("requests") && (
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "requests"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Clock className={`h-4 w-4 ${requests.filter(r => r.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}`} />
            <span className={requests.filter(r => r.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}>
              Recharges ({requests.filter(r => r.status === "pending").length})
            </span>
          </button>
          )}

          {canAccess("orders") && (
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "orders"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText className={`h-4 w-4 ${orders.filter(o => o.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}`} />
            <span className={orders.filter(o => o.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}>
              Commandes ({orders.filter(o => o.status === "pending").length})
            </span>
          </button>
          )}

          {canAccess("products") && (
          <button
            onClick={() => setActiveTab("products")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "products"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Catalogue Produits ({products.length})</span>
          </button>
          )}

          {canAccess("tutorials") && (
          <button
            onClick={() => setActiveTab("tutorials")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "tutorials"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Tutoriels Vidéo ({tutorials.length})</span>
          </button>
          )}

          {canAccess("clients") && (
          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "clients"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className={`h-4 w-4 ${clients.filter(c => c.status === "pending").length > 0 ? "animate-pending-blink-text" : "text-amber-600"}`} />
            <span className={clients.filter(c => c.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}>
              Abonnements Grossistes ({clients.length})
            </span>
          </button>
          )}

          {canAccess("livreurs") && (
          <button
            type="button"
            onClick={() => setActiveTab("livreurs")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "livreurs"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Truck className="h-4 w-4 text-amber-600" />
            <span>Livreurs & Suivi ({livreurs.length})</span>
          </button>
          )}

          {canAccess("panels") && (
          <button
            type="button"
            onClick={() => setActiveTab("panels")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "panels"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Key className={`h-4 w-4 ${panelRequests.filter(p => p.status === "pending").length > 0 ? "animate-pending-blink-text" : "text-amber-600"}`} />
            <span className={panelRequests.filter(p => p.status === "pending").length > 0 ? "animate-pending-blink-text" : ""}>
              Demandes Panels ({panelRequests.filter(p => p.status === "pending").length})
            </span>
          </button>
          )}

          {canAccess("categories") && (
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "categories"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FolderOpen className="h-4 w-4 text-amber-600" />
            <span>Catégories ({catalogCategories.length})</span>
          </button>
          )}

          {canAccess("slides") && (
          <button
            type="button"
            onClick={() => setActiveTab("slides")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "slides"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="h-4 w-4 text-amber-600" />
            <span>Bannières Accueil ({heroSlides.length})</span>
          </button>
          )}

          {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === "team"
                ? "border-amber-500 text-amber-600 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4 text-amber-600" />
            <span>Équipe ({teamMembers.length})</span>
          </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          
          {/* TAB 1: EMAIL SIMULATOR (NOTIFICATIONS ADMIN) */}
          {activeTab === "emails" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-700 leading-relaxed flex items-center space-x-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  📢 <strong>Intercepteur d'Alertes :</strong> Reçoit toutes les notifications envoyées à <strong>fares200976@gmail.com</strong> et les alertes WhatsApp sur le <strong>00213667719761</strong>.
                </span>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-3.5">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-4 rounded-xl border transition-all text-sm flex flex-col sm:flex-row justify-between items-start gap-4 ${
                        notif.read 
                          ? "bg-white/30 border-slate-200 text-slate-500" 
                          : "bg-white border-amber-500/20 text-slate-700"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-semibold text-[11px] uppercase">
                            {notif.type.replace("_", " ")}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(notif.sentAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{notif.subject}</h4>
                        <p className="whitespace-pre-line leading-relaxed font-mono text-sm bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                          {notif.body}
                        </p>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                        {!notif.read && (
                          <button
                            onClick={() => onMarkNotificationRead(notif.id)}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Lu
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteNotification(notif.id)}
                          className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Mail className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm">Aucune notification e-mail reçue pour le moment.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE WHOLESALERS (REVENDEURS) */}
          {activeTab === "wholesalers" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Liste des Revendeurs Partenaires</h3>
                <button
                  onClick={() => setShowAddWholesaler(!showAddWholesaler)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddWholesaler ? "Masquer Formulaire" : "Ajouter un Revendeur"}</span>
                </button>
              </div>

              {showAddWholesaler && (
                <form onSubmit={handleAddWholesalerSubmit} className="p-5 bg-white/60 rounded-2xl border border-slate-200 space-y-4 text-sm animate-in slide-in-from-top-4 duration-200">
                  <h4 className="text-sm font-bold text-blue-600 uppercase">Créer un Compte Revendeur Directement</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1.5">Nom du Commerce / Boutique</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Dino IPTV Alger"
                        value={wholesalerForm.businessName}
                        onChange={e => setWholesalerForm({ ...wholesalerForm, businessName: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1.5">Identifiant (Username)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: fares_iptv"
                        value={wholesalerForm.username}
                        onChange={e => setWholesalerForm({ ...wholesalerForm, username: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1.5">Mot de Passe</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 caractères"
                        value={wholesalerForm.password}
                        onChange={e => setWholesalerForm({ ...wholesalerForm, password: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1.5">Téléphone WhatsApp</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 0550123456"
                        value={wholesalerForm.phone}
                        onChange={e => setWholesalerForm({ ...wholesalerForm, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1.5">Email de contact</label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: client@gmail.com"
                        value={wholesalerForm.email}
                        onChange={e => setWholesalerForm({ ...wholesalerForm, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1.5">Crédit Initial (DA)</label>
                      <input
                        type="number"
                        required
                        value={wholesalerForm.creditBalance}
                        onChange={e => setWholesalerForm({ ...wholesalerForm, creditBalance: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Valider l'Inscription
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse data-table-ltr">
                  <thead>
                    <tr className="bg-white/40 text-slate-500 border-b border-slate-200">
                      <th className="p-3 font-semibold">Boutique</th>
                      <th className="p-3 font-semibold">User / Email</th>
                      <th className="p-3 font-semibold">Téléphone</th>
                      <th className="p-3 font-semibold">Création</th>
                      <th className="p-3 font-semibold">Solde Crédit</th>
                      <th className="p-3 font-semibold">Statut</th>
                      <th className="p-3 font-semibold text-right">Actions de simulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40">
                    {wholesalers.map((wholesaler) => (
                      <tr key={wholesaler.id} className={`hover:bg-slate-50 ${wholesaler.status === "pending" ? "animate-pending-blink" : ""}`}>
                        <td className="p-3 font-bold text-slate-900">{wholesaler.businessName}</td>
                        <td className="p-3">
                          <span className="font-mono text-slate-600 block">User: {wholesaler.username}</span>
                          <span className="text-slate-400 block">{wholesaler.email}</span>
                          <span className="text-amber-600 font-mono text-xs block">MDP: {wholesaler.password || "123456"}</span>
                        </td>
                        <td className="p-3 font-mono">{wholesaler.phone}</td>
                        <td className="p-3 text-slate-500">{new Date(wholesaler.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="p-3 font-bold text-emerald-600">{wholesaler.creditBalance.toLocaleString()} DA</td>
                        <td className="p-3">
                          {wholesaler.status === "approved" && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded font-semibold text-[11px]">
                              Approuvé
                            </span>
                          )}
                          {wholesaler.status === "pending" && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-semibold text-[11px] animate-pulse">
                              En attente
                            </span>
                          )}
                          {wholesaler.status === "suspended" && (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded font-semibold text-[11px]">
                              Suspendu
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                            {/* Account Status Switch (Actif / Inactif) */}
                            <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => onApproveWholesaler(wholesaler.id, "approved")}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                  wholesaler.status === "approved"
                                    ? "bg-green-500 text-black shadow-md font-extrabold"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                                title="Activer / Approuver le compte"
                              >
                                Actif
                              </button>
                              <button
                                type="button"
                                onClick={() => onApproveWholesaler(wholesaler.id, "suspended")}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                  wholesaler.status === "suspended"
                                    ? "bg-red-500 text-white shadow-md font-extrabold"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                                title="Désactiver / Suspendre le compte"
                              >
                                Inactif
                              </button>
                            </div>

                            {wholesaler.status === "approved" && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => onAddCreditManual(wholesaler.id, 10000)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded cursor-pointer"
                                  title="Ajouter 10,000 DA"
                                >
                                  +10k
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAddCreditManual(wholesaler.id, 50000)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded cursor-pointer"
                                  title="Ajouter 50,000 DA"
                                >
                                  +50k
                                </button>
                              </div>
                            )}

                            {wholesaler.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => onApproveWholesaler(wholesaler.id, "approved")}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] rounded animate-pulse cursor-pointer"
                                title="Approuver l'inscription"
                              >
                                Valider
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingWholesaler({ ...wholesaler, password: wholesaler.password || "123456" })}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-[11px] rounded cursor-pointer flex items-center gap-1"
                              title="Modifier les identifiants et mot de passe"
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                              <span>Gérer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal de modification Grossiste */}
              {editingWholesaler && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-lg p-6 bg-white border border-slate-200 rounded-2xl shadow-2xl space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-500" />
                        <span>Gérer le Revendeur : {editingWholesaler.businessName}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingWholesaler(null)}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleEditWholesalerSubmit} className="space-y-4 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 mb-1.5 font-bold font-sans">Nom du Commerce</label>
                          <input
                            type="text"
                            required
                            value={editingWholesaler.businessName}
                            onChange={e => setEditingWholesaler({ ...editingWholesaler, businessName: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1.5 font-bold font-sans">Nom d'utilisateur (Username)</label>
                          <input
                            type="text"
                            required
                            value={editingWholesaler.username}
                            onChange={e => setEditingWholesaler({ ...editingWholesaler, username: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-amber-600 mb-1.5 font-bold font-sans">Mot de Passe (Password)</label>
                          <input
                            type="text"
                            required
                            placeholder="Entrez un nouveau mot de passe"
                            value={editingWholesaler.password || ""}
                            onChange={e => setEditingWholesaler({ ...editingWholesaler, password: e.target.value })}
                            className="w-full bg-white border border-amber-500/30 rounded-xl px-3 py-2 text-amber-600 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1.5 font-bold font-sans">Téléphone WhatsApp</label>
                          <input
                            type="text"
                            required
                            value={editingWholesaler.phone}
                            onChange={e => setEditingWholesaler({ ...editingWholesaler, phone: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-500 mb-1.5 font-bold font-sans">Email</label>
                          <input
                            type="email"
                            required
                            value={editingWholesaler.email}
                            onChange={e => setEditingWholesaler({ ...editingWholesaler, email: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1.5 font-bold font-sans">Solde de Crédit (DA)</label>
                          <input
                            type="number"
                            required
                            value={editingWholesaler.creditBalance}
                            onChange={e => setEditingWholesaler({ ...editingWholesaler, creditBalance: parseInt(e.target.value) || 0 })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1.5 font-bold font-sans">Statut du Compte</label>
                        <select
                          value={editingWholesaler.status}
                          onChange={e => setEditingWholesaler({ ...editingWholesaler, status: e.target.value as any })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                        >
                          <option value="approved">Approuvé (Actif)</option>
                          <option value="pending">En attente</option>
                          <option value="suspended">Suspendu (Inactif)</option>
                        </select>
                      </div>

                      <div className="flex space-x-2 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setEditingWholesaler(null)}
                          className="flex-1 py-2.5 text-sm bg-slate-100 hover:bg-gray-750 text-slate-600 rounded-xl transition-colors font-semibold cursor-pointer text-center"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 text-sm bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition-colors shadow-lg shadow-amber-500/10 cursor-pointer text-center"
                        >
                          Enregistrer les Modifications
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEMANDES DE RECHARGE CREDITS */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className={`p-4 bg-white/60 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm ${
                      req.status === "pending" ? "border-red-300 animate-pending-blink" : "border-slate-200"
                    }`}>
                      <div>
                        <div className="flex items-center space-x-2">
                          <strong className="text-slate-900 text-sm">{req.wholesalerName}</strong>
                          <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <p className="text-slate-600 mt-1">
                          Montant demandé : <strong className="text-amber-600 text-base font-bold font-display">{req.amountDA.toLocaleString()} DA</strong>
                        </p>
                        <p className="text-slate-500 mt-1">
                          Méthode : <span className="uppercase text-slate-900 font-semibold">{req.paymentMethod}</span> | Reçu : <span className="font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">{req.receiptReference}</span>
                        </p>
                      </div>

                      <div>
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                               onClick={() => onProcessCreditRequest(req.id, "approve")}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-xs cursor-pointer"
                            >
                              Valider & Créditer
                            </button>
                            <button
                              onClick={() => onProcessCreditRequest(req.id, "reject")}
                              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-500/20 rounded font-bold text-xs cursor-pointer"
                            >
                              Rejeter
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded font-bold text-xs ${
                            req.status === "approved" 
                              ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                              : "bg-red-500/10 text-red-600 border border-red-500/20"
                          }`}>
                            {req.status === "approved" ? "Approuvée" : "Rejetée"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm">Aucune demande de recharge en attente.</p>
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
                    <div key={order.id} className={`p-4 bg-white/60 rounded-xl border flex flex-col sm:flex-row justify-between items-start gap-4 text-sm ${
                      order.status === "pending" ? "border-red-300 animate-pending-blink" : "border-slate-200"
                    }`}>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
                          <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <p className="text-slate-600">
                          Produit : <strong className="text-slate-900">{order.productName}</strong> ({order.productType === "iptv" ? "IPTV" : "Boîtier"})
                        </p>
                        <p className="text-amber-600 font-bold font-display text-sm">
                          Tarif payé : {order.priceDA.toLocaleString()} DA
                        </p>
                        <p className="text-slate-500">
                          Tél : <span className="font-mono text-slate-700">{order.customerPhone}</span> {order.customerEmail && `| Email: ${order.customerEmail}`}
                        </p>

                        {/* RENDER NEW FIELDS FOR TV MODEL, APP INSTALLED, ANDROID STATUS, DOWNLOADER CODE */}
                        {(order.tvModel || order.installedApp || order.hasAndroidBox || order.downloaderCode) && (
                          <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 text-sm mt-2 grid grid-cols-2 gap-2">
                            {order.tvModel && (
                              <div>
                                <span className="text-xs text-slate-500 block font-semibold">Modèle TV :</span>
                                <span className="text-slate-700 font-medium">{order.tvModel}</span>
                              </div>
                            )}
                            {order.installedApp && (
                              <div>
                                <span className="text-xs text-slate-500 block font-semibold">Application installée :</span>
                                <span className="text-slate-700 font-medium">{order.installedApp}</span>
                              </div>
                            )}
                            {order.hasAndroidBox && (
                              <div>
                                <span className="text-xs text-slate-500 block font-semibold">Box Android :</span>
                                <span className="text-emerald-600 font-bold">Oui</span>
                              </div>
                            )}
                            {order.downloaderCode && (
                              <div>
                                <span className="text-xs text-slate-500 block font-semibold">Code Downloader :</span>
                                <span className="text-amber-600 font-mono font-bold">{order.downloaderCode}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Livraison : wilaya, adresse, mode, prix (produits physiques) */}
                        {order.shippingWilaya && (
                          <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/15 text-sm mt-2 space-y-1.5">
                            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">📦 Livraison</span>
                            <p className="text-slate-700">
                              <strong className="text-slate-900">{order.shippingWilaya}</strong> — {order.shippingType === "domicile" ? "À domicile" : "Au bureau / agence"}
                              {order.shippingDelay && <span className="text-slate-500"> (délai estimé {order.shippingDelay})</span>}
                            </p>
                            {order.shippingAddress && (
                              <p className="text-slate-600">Adresse : {order.shippingAddress}</p>
                            )}
                            {order.shippingPriceDA !== undefined && (
                              <p className="text-emerald-600 font-bold">Frais de livraison : {order.shippingPriceDA.toLocaleString()} DA</p>
                            )}
                          </div>
                        )}

                        {/* Accès IPTV (Dino / 8K / Golden OTT) : à fournir par l'admin/l'équipe */}
                        {isIptvOrderWithAccess(order) && (
                          <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/15 text-sm mt-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">🔑 Accès IPTV Client</span>
                              {order.adultContent !== undefined && (
                                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${order.adultContent ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                  {order.adultContent ? "Adulte" : "Sans Adulte"}
                                </span>
                              )}
                            </div>

                            {editingOrderId === order.id ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Xtream Host (ex: http://line.dino.dndscloud.ru)"
                                    value={orderCredForm.xtreamHost}
                                    onChange={e => setOrderCredForm({ ...orderCredForm, xtreamHost: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs font-mono"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Lien M3U complet"
                                    value={orderCredForm.m3uUrl}
                                    onChange={e => setOrderCredForm({ ...orderCredForm, m3uUrl: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs font-mono"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Username"
                                    value={orderCredForm.xtreamUser}
                                    onChange={e => setOrderCredForm({ ...orderCredForm, xtreamUser: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs font-mono"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Password"
                                    value={orderCredForm.xtreamPass}
                                    onChange={e => setOrderCredForm({ ...orderCredForm, xtreamPass: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs font-mono"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Lien de gestion des bouquets (optionnel)"
                                  value={orderCredForm.bouquetLink}
                                  onChange={e => setOrderCredForm({ ...orderCredForm, bouquetLink: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs font-mono"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveOrderCredentials}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                                  >
                                    Enregistrer et envoyer au client
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingOrderId(null)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg font-bold text-xs cursor-pointer"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-xs">
                                  {order.credentials?.m3uUrl ? "Accès déjà fournis — le client peut les voir via le suivi de commande." : "Aucun accès fourni pour le moment."}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => startEditOrderCredentials(order)}
                                  className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 border border-indigo-500/20 rounded-lg font-bold text-xs cursor-pointer shrink-0 ml-2"
                                >
                                  {order.credentials?.m3uUrl ? "Modifier les Accès" : "Fournir les Accès"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Code Sat / IPTV à code d'activation : puiser un code du stock */}
                        {products.find(p => p.id === order.productId)?.usesCodeStock && (
                          <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/15 text-sm mt-2 space-y-2">
                            <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">🔑 Code Client (Stock)</span>
                            {order.credentials?.satCode ? (
                              <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 font-mono">
                                <span className="text-slate-800 text-sm tracking-wider">{order.credentials.satCode}</span>
                                <span className="text-emerald-600 text-[10px] font-bold">✓ Attribué</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-xs">
                                  {(codeStock.filter(c => c.productId === order.productId && !c.isUsed).length)} code(s) disponible(s) en stock
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setErrorMessage("");
                                    setSuccessMessage("");
                                    try {
                                      const res = await fetch(`/api/admin/orders/${order.id}/draw-stock-code`, { method: "POST" });
                                      const data = await res.json();
                                      if (res.ok) {
                                        setSuccessMessage("Code attribué et visible par le client.");
                                        fetchCodeStock();
                                        refreshAllData();
                                      } else {
                                        setErrorMessage(data.error || "Échec de l'attribution du code.");
                                      }
                                    } catch (err: any) {
                                      setErrorMessage(err.message);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs cursor-pointer shrink-0 ml-2"
                                >
                                  Puiser un Code du Stock
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200 mt-1.5">
                          Mode de paiement : <span className="uppercase text-slate-700 font-semibold">{order.paymentMethod}</span> <br />
                          Preuve : {order.paymentDetails || "Aucune information supplémentaire."}
                        </p>

                        {/* Delivery Assignment and Tracking Section */}
                        <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/40 p-3 rounded-lg border border-slate-200/50">
                          <div>
                            <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider block mb-1.5">Assigner un Livreur</span>
                            <select
                              value={order.assignedLivreurId || ""}
                              onChange={async (e) => {
                                await handleUpdateDelivery(order.id, e.target.value, order.deliveryStatus || "pending");
                              }}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:border-amber-500 cursor-pointer"
                            >
                              <option value="">Non assigné (Attente)</option>
                              {livreurs.filter(l => l.status === "active").map(l => (
                                <option key={l.id} value={l.id}>{l.name} ({l.wilaya})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider block mb-1.5">Suivi de la Commande (Livraison)</span>
                            <select
                              value={order.deliveryStatus || "pending"}
                              onChange={async (e) => {
                                await handleUpdateDelivery(order.id, order.assignedLivreurId || "", e.target.value);
                              }}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:border-amber-500 cursor-pointer"
                            >
                              <option value="pending">⏳ En attente de traitement</option>
                              <option value="preparing">📦 En préparation (Emballage)</option>
                              <option value="shipped">🚚 Expédiée / En cours de route</option>
                              <option value="delivered">✅ Livrée & Encaissée</option>
                              <option value="returned">❌ Retournée au dépôt</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          order.status === "completed" 
                            ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                            : order.status === "cancelled"
                            ? "bg-red-500/10 text-red-600 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
                        }`}>
                          {order.status === "pending" ? "En attente de livraison" : order.status === "completed" ? "Livrée & Activée" : "Annulée"}
                        </span>

                        {order.status === "pending" && (
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, "completed")}
                              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-xs cursor-pointer"
                            >
                              Valider Livraison
                            </button>
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, "cancelled")}
                              className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-500/20 rounded font-bold text-xs cursor-pointer"
                            >
                              Annuler
                            </button>
                          </div>
                        )}

                        {isOwner && onDeleteOrder && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Supprimer définitivement la commande de ${order.customerName} (${order.productName}) ? Cette action est irréversible.`)) {
                                return;
                              }
                              setErrorMessage("");
                              setSuccessMessage("");
                              try {
                                await onDeleteOrder(order.id);
                                setSuccessMessage("Commande supprimée avec succès.");
                              } catch (err: any) {
                                setErrorMessage(err.message || "Échec de la suppression de la commande.");
                              }
                            }}
                            title="Supprimer cette commande"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-600/20 hover:text-red-600 text-slate-500 border border-slate-300 hover:border-red-500/20 rounded font-bold text-xs cursor-pointer mt-1 flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm">Aucune commande détail enregistrée.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MANAGE PRODUCTS (IPTV & BOXES) */}
          {activeTab === "products" && (
            <div className="space-y-6 text-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Catalogue des IPTV & Matériel Android</h3>
                <button
                  onClick={() => {
                    setShowAddProduct(!showAddProduct);
                    setEditingProduct(null);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddProduct ? "Masquer" : "Ajouter un Produit"}</span>
                </button>
              </div>

              {/* Liens de gestion des bouquets IPTV (Dino / 8K / Golden OTT) */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Liens de Gestion des Bouquets (Dino / 8K / Golden OTT)</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Ces liens sont transmis automatiquement au revendeur après chaque activation IPTV, pour qu'il configure les chaînes/bouquets de son client.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-xs">Dino IPTV</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={bouquetLinks.dino}
                      onChange={(e) => setBouquetLinks({ ...bouquetLinks, dino: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-xs">8K Premium</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={bouquetLinks["8k"]}
                      onChange={(e) => setBouquetLinks({ ...bouquetLinks, "8k": e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-xs">Golden OTT</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={bouquetLinks["golden ott"]}
                      onChange={(e) => setBouquetLinks({ ...bouquetLinks, "golden ott": e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveBouquetLinks}
                    disabled={bouquetLinksSaving || !bouquetLinksLoaded}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    {bouquetLinksSaving ? "Enregistrement..." : "Enregistrer les liens"}
                  </button>
                  {bouquetLinksSaved && (
                    <span className="text-emerald-600 text-xs font-semibold">✓ Enregistré</span>
                  )}
                </div>
              </div>

              {/* Stock de codes pré-chargés (Code Sat / IPTV à code d'activation) */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Stock de Codes (Code Sat / IPTV à code d'activation)</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Ajoutez ici vos vrais codes achetés chez votre fournisseur. À chaque activation d'un produit marqué "Utilise un stock de codes", un code est puisé automatiquement et retiré du stock.
                </p>

                {codeStockProducts.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-lg text-xs">
                    Aucun produit n'utilise le stock de codes pour l'instant. Cochez "Utilise un stock de codes pré-chargés" sur un produit Code Sat (ou IPTV à code) ci-dessous pour l'activer.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1 text-xs">Produit</label>
                        <select
                          value={stockProductId}
                          onChange={e => setStockProductId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs"
                        >
                          <option value="">-- Choisir un produit --</option>
                          {codeStockProducts.map(p => {
                            const available = codeStock.filter(c => c.productId === p.id && !c.isUsed).length;
                            return <option key={p.id} value={p.id}>{p.name} ({available} disponible{available > 1 ? "s" : ""})</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-xs">Coller les codes (un par ligne)</label>
                      <textarea
                        value={bulkCodesText}
                        onChange={e => setBulkCodesText(e.target.value)}
                        placeholder={"ABC123\nDEF456\nGHI789..."}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono h-28"
                      />
                    </div>

                    {stockMessage && (
                      <p className="text-xs font-semibold text-indigo-600">{stockMessage}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleAddBulkCodes}
                      disabled={stockLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      {stockLoading ? "Ajout en cours..." : "Ajouter ces codes au stock"}
                    </button>

                    {stockProductId && (
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Codes disponibles pour ce produit ({codeStock.filter(c => c.productId === stockProductId && !c.isUsed).length})
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {codeStock.filter(c => c.productId === stockProductId && !c.isUsed).map(c => (
                            <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
                              <span className="font-mono text-xs text-slate-700">{c.code}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteStockCode(c.id)}
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                title="Supprimer ce code"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          {codeStock.filter(c => c.productId === stockProductId && !c.isUsed).length === 0 && (
                            <p className="text-xs text-slate-400 italic">Aucun code disponible — collez-en ci-dessus.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Add Product Form */}
              {showAddProduct && (
                <form onSubmit={handleAddProductSubmit} className="p-5 bg-white/60 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-blue-600 uppercase">Ajouter un nouveau produit</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Nom du Produit</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Dino OTT 12 Mois"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Type de Produit</label>
                      <div className="flex gap-1.5">
                        <select
                          value={isStandardType(productForm.type) ? productForm.type : "autre"}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === "autre") {
                              setProductForm({ ...productForm, type: "" });
                            } else {
                              setProductForm({ ...productForm, type: val });
                            }
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                        >
                          <option value="code iptv">Code IPTV</option>
                          <option value="abonnement iptv">Abonnement IPTV</option>
                          <option value="televiseur">Téléviseur</option>
                          <option value="boitier android">Boîtier Android</option>
                          <option value="application">Application</option>
                          <option value="demodulateur">Démodulateur</option>
                          <option value="code sat">Code Sat</option>
                          <option value="recharge adsl">Recharge ADSL / Fibre</option>
                          <option value="accessoire">Accessoire</option>
                          <option value="autre">Autre...</option>
                        </select>
                        <button
                          type="button"
                          title="Saisir un type personnalisé"
                          onClick={() => setProductForm({ ...productForm, type: "" })}
                          className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-900 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      {!isStandardType(productForm.type) && (
                        <div className="mt-2 animate-in fade-in duration-200">
                          <input
                            type="text"
                            placeholder="Saisissez un type de produit personnalisé..."
                            value={productForm.type}
                            onChange={e => setProductForm({ ...productForm, type: e.target.value })}
                            className="w-full bg-white border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Catégorie du Catalogue</label>
                      <div className="flex gap-1.5">
                        <select
                          value={productForm.categoryId || ""}
                          onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                        >
                          <option value="">-- Sans catégorie --</option>
                          {catalogCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          title="Ajouter une nouvelle catégorie"
                          onClick={() => setQuickAddCatOpenNew(v => !v)}
                          className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-900 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      {quickAddCatOpenNew && (
                        <div className="mt-2 flex gap-1.5 animate-in fade-in duration-200">
                          <input
                            type="text"
                            placeholder="Nom de la nouvelle catégorie..."
                            value={quickAddCatNameNew}
                            onChange={e => setQuickAddCatNameNew(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickAddCategory(
                                  quickAddCatNameNew,
                                  (id) => setProductForm(f => ({ ...f, categoryId: id })),
                                  setQuickAddCatLoadingNew,
                                  () => { setQuickAddCatOpenNew(false); setQuickAddCatNameNew(""); }
                                );
                              }
                            }}
                            className="flex-1 bg-white border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            disabled={quickAddCatLoadingNew || !quickAddCatNameNew.trim()}
                            onClick={() => handleQuickAddCategory(
                              quickAddCatNameNew,
                              (id) => setProductForm(f => ({ ...f, categoryId: id })),
                              setQuickAddCatLoadingNew,
                              () => { setQuickAddCatOpenNew(false); setQuickAddCatNameNew(""); }
                            )}
                            className="px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-bold cursor-pointer"
                          >
                            {quickAddCatLoadingNew ? "..." : "Ajouter"}
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Image 1 (Uploader / Fichier)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, false, "imageUrl")}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 text-sm mb-1"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Ou coller l'URL de l'image"
                        value={productForm.imageUrl}
                        onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Image 2 (Optionnel - Uploader)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, false, "imageUrl2")}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 text-sm mb-1"
                      />
                      <input
                        type="text"
                        placeholder="Ou coller l'URL de l'image secondaire"
                        value={productForm.imageUrl2 || ""}
                        onChange={e => setProductForm({ ...productForm, imageUrl2: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Prix Détail (DA)</label>
                      <input
                        type="number"
                        required
                        value={productForm.priceRetail}
                        onChange={e => setProductForm({ ...productForm, priceRetail: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Prix Grossiste (DA)</label>
                      <input
                        type="number"
                        required
                        value={productForm.priceWholesale}
                        onChange={e => setProductForm({ ...productForm, priceWholesale: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Caractéristiques (séparées par des virgules)</label>
                      <input
                        type="text"
                        placeholder="Ex: Qualité 4K, 12 Mois, Assistance 24/7"
                        value={productForm.featuresString}
                        onChange={e => setProductForm({ ...productForm, featuresString: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Description courte</label>
                    <textarea
                      required
                      placeholder="Petite description du produit..."
                      value={productForm.description}
                      onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 h-20"
                    />
                  </div>

                  <label className="flex items-center space-x-2.5 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={productForm.usesCodeStock}
                      onChange={e => setProductForm({ ...productForm, usesCodeStock: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-emerald-700 font-semibold">Utilise un stock de codes pré-chargés</span>
                  </label>
                  {productForm.usesCodeStock && (
                    <p className="text-[11px] text-slate-400 -mt-2">
                      À l'activation, un vrai code sera puisé automatiquement dans le stock (onglet "Stock de Codes" une fois le produit créé) au lieu d'en générer un faux.
                    </p>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Ajouter le Produit
                  </button>
                </form>
              )}

              {/* Edit Product Form */}
              {editingProduct && (
                <form onSubmit={handleEditProductSubmit} className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4">
                  <h4 className="font-bold text-amber-600 uppercase">Modifier le produit : {editingProduct.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Nom du Produit</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Type de Produit</label>
                      <div className="flex gap-1.5">
                        <select
                          value={isStandardType(editingProduct.type) ? editingProduct.type : "autre"}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === "autre") {
                              setEditingProduct({ ...editingProduct, type: "" });
                            } else {
                              setEditingProduct({ ...editingProduct, type: val });
                            }
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                        >
                          <option value="code iptv">Code IPTV</option>
                          <option value="abonnement iptv">Abonnement IPTV</option>
                          <option value="televiseur">Téléviseur</option>
                          <option value="boitier android">Boîtier Android</option>
                          <option value="application">Application</option>
                          <option value="demodulateur">Démodulateur</option>
                          <option value="code sat">Code Sat</option>
                          <option value="recharge adsl">Recharge ADSL / Fibre</option>
                          <option value="accessoire">Accessoire</option>
                          <option value="autre">Autre...</option>
                        </select>
                        <button
                          type="button"
                          title="Saisir un type personnalisé"
                          onClick={() => setEditingProduct({ ...editingProduct, type: "" })}
                          className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-900 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      {!isStandardType(editingProduct.type) && (
                        <div className="mt-2 animate-in fade-in duration-200">
                          <input
                            type="text"
                            placeholder="Saisissez un type de produit personnalisé..."
                            value={editingProduct.type}
                            onChange={e => setEditingProduct({ ...editingProduct, type: e.target.value })}
                            className="w-full bg-white border border-amber-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                            required
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Catégorie du Catalogue</label>
                      <div className="flex gap-1.5">
                        <select
                          value={editingProduct.categoryId || ""}
                          onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                        >
                          <option value="">-- Sans catégorie --</option>
                          {catalogCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          title="Ajouter une nouvelle catégorie"
                          onClick={() => setQuickAddCatOpenEdit(v => !v)}
                          className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-900 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      {quickAddCatOpenEdit && (
                        <div className="mt-2 flex gap-1.5 animate-in fade-in duration-200">
                          <input
                            type="text"
                            placeholder="Nom de la nouvelle catégorie..."
                            value={quickAddCatNameEdit}
                            onChange={e => setQuickAddCatNameEdit(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickAddCategory(
                                  quickAddCatNameEdit,
                                  (id) => setEditingProduct(p => p ? ({ ...p, categoryId: id }) : p),
                                  setQuickAddCatLoadingEdit,
                                  () => { setQuickAddCatOpenEdit(false); setQuickAddCatNameEdit(""); }
                                );
                              }
                            }}
                            className="flex-1 bg-white border border-amber-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            disabled={quickAddCatLoadingEdit || !quickAddCatNameEdit.trim()}
                            onClick={() => handleQuickAddCategory(
                              quickAddCatNameEdit,
                              (id) => setEditingProduct(p => p ? ({ ...p, categoryId: id }) : p),
                              setQuickAddCatLoadingEdit,
                              () => { setQuickAddCatOpenEdit(false); setQuickAddCatNameEdit(""); }
                            )}
                            className="px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-bold cursor-pointer"
                          >
                            {quickAddCatLoadingEdit ? "..." : "Ajouter"}
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Image 1 (Uploader / Fichier)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, true, "imageUrl")}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 text-sm mb-1"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Ou coller l'URL de l'image"
                        value={editingProduct.imageUrl}
                        onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Image 2 (Optionnel - Uploader)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, true, "imageUrl2")}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 text-sm mb-1"
                      />
                      <input
                        type="text"
                        placeholder="Ou coller l'URL de l'image secondaire"
                        value={editingProduct.imageUrl2 || ""}
                        onChange={e => setEditingProduct({ ...editingProduct, imageUrl2: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Prix Détail (DA)</label>
                      <input
                        type="number"
                        required
                        value={editingProduct.priceRetail}
                        onChange={e => setEditingProduct({ ...editingProduct, priceRetail: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Prix Grossiste (DA)</label>
                      <input
                        type="number"
                        required
                        value={editingProduct.priceWholesale}
                        onChange={e => setEditingProduct({ ...editingProduct, priceWholesale: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Caractéristiques (séparées par des virgules)</label>
                      <input
                        type="text"
                        placeholder="Qualité 4K, 12 Mois, etc."
                        value={(editingProduct as any).featuresString !== undefined ? (editingProduct as any).featuresString : editingProduct.features.join(", ")}
                        onChange={e => setEditingProduct({ ...editingProduct, featuresString: e.target.value } as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Description courte</label>
                    <textarea
                      required
                      value={editingProduct.description}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 h-20"
                    />
                  </div>

                  <label className="flex items-center space-x-2.5 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={!!editingProduct.usesCodeStock}
                      onChange={e => setEditingProduct({ ...editingProduct, usesCodeStock: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-emerald-700 font-semibold">Utilise un stock de codes pré-chargés</span>
                  </label>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg cursor-pointer"
                    >
                      Enregistrer les modifications
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {/* Products List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(p => (
                  <div key={p.id} className="p-4 bg-white/40 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <span className="px-1.5 py-0.2 text-[8px] bg-slate-100 text-slate-500 rounded uppercase">
                          {p.type}
                        </span>
                        {p.categoryId && (
                          <span className="px-1.5 py-0.2 text-[8px] bg-blue-950 text-blue-600 border border-blue-900 rounded uppercase font-bold">
                            {catalogCategories.find(c => c.id === p.categoryId)?.name || "Catégorie inconnue"}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-1">{p.description}</p>
                      <div className="text-xs space-x-3 mt-1.5">
                        <span className="text-amber-600">Détail: <strong>{p.priceRetail.toLocaleString()} DA</strong></span>
                        <span className="text-indigo-600">Gros: <strong>{p.priceWholesale.toLocaleString()} DA</strong></span>
                      </div>
                    </div>
                    <div className="flex space-x-1.5 shrink-0 pl-4">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setShowAddProduct(false);
                        }}
                        className="p-1.5 hover:bg-amber-500/10 text-amber-600 rounded-lg transition-colors cursor-pointer"
                        title="Modifier le produit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer le produit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MANAGE TUTORIALS */}
          {activeTab === "tutorials" && (
            <div className="space-y-6 text-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tutoriels d'Installation Vidéo</h3>
                <button
                  onClick={() => {
                    setShowAddTutorial(!showAddTutorial);
                    setEditingTutorial(null);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddTutorial ? "Masquer" : "Ajouter un Tutoriel"}</span>
                </button>
              </div>

              {/* Add Tutorial Form */}
              {showAddTutorial && (
                <form onSubmit={handleAddTutorialSubmit} className="p-5 bg-white/60 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-blue-600 uppercase">Ajouter un nouveau tutoriel</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Titre du Guide</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Configuration Dino sur Smart TV LG"
                        value={tutorialForm.title}
                        onChange={e => setTutorialForm({ ...tutorialForm, title: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Catégorie</label>
                      <select
                        value={tutorialForm.category}
                        onChange={e => setTutorialForm({ ...tutorialForm, category: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      >
                        <option value="smart_tv">Smart TV</option>
                        <option value="android">Box/Mobile Android</option>
                        <option value="firestick">Amazon Firestick</option>
                        <option value="other">Autre / PC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">YouTube Embed URL (Lien d'intégration)</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: https://www.youtube.com/embed/dQw4w9WgXcQ"
                        value={tutorialForm.url}
                        onChange={e => setTutorialForm({ ...tutorialForm, url: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Code Downloader AFTVnews (Optionnel)</label>
                      <input
                        type="text"
                        placeholder="Ex: 283749"
                        value={tutorialForm.downloaderCode}
                        onChange={e => setTutorialForm({ ...tutorialForm, downloaderCode: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Description explicative</label>
                    <textarea
                      required
                      placeholder="Décrivez les étapes d'installation..."
                      value={tutorialForm.description}
                      onChange={e => setTutorialForm({ ...tutorialForm, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 h-20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Ajouter le Tutoriel
                  </button>
                </form>
              )}

              {/* Edit Tutorial Form */}
              {editingTutorial && (
                <form onSubmit={handleEditTutorialSubmit} className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4">
                  <h4 className="font-bold text-amber-600 uppercase">Modifier le tutoriel : {editingTutorial.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Titre</label>
                      <input
                        type="text"
                        required
                        value={editingTutorial.title}
                        onChange={e => setEditingTutorial({ ...editingTutorial, title: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Catégorie</label>
                      <select
                        value={editingTutorial.category}
                        onChange={e => setEditingTutorial({ ...editingTutorial, category: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      >
                        <option value="smart_tv">Smart TV</option>
                        <option value="android">Box/Mobile Android</option>
                        <option value="firestick">Amazon Firestick</option>
                        <option value="other">Autre / PC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">YouTube Embed URL</label>
                      <input
                        type="text"
                        required
                        value={editingTutorial.url}
                        onChange={e => setEditingTutorial({ ...editingTutorial, url: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Code Downloader AFTVnews (Optionnel)</label>
                      <input
                        type="text"
                        value={editingTutorial.downloaderCode || ""}
                        onChange={e => setEditingTutorial({ ...editingTutorial, downloaderCode: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Description explicative</label>
                    <textarea
                      required
                      value={editingTutorial.description}
                      onChange={e => setEditingTutorial({ ...editingTutorial, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 h-20"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg cursor-pointer"
                    >
                      Enregistrer les modifications
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTutorial(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {/* Tutorials list */}
              <div className="space-y-3">
                {tutorials.map(tut => (
                  <div key={tut.id} className="p-4 bg-white/40 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{tut.title}</span>
                        <span className="px-1.5 py-0.2 text-[8px] bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded font-bold uppercase tracking-wider scale-90">
                          {tut.category.replace("_", " ")}
                        </span>
                        {tut.downloaderCode && (
                          <span className="px-1.5 py-0.2 text-[8px] bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-bold uppercase tracking-wider scale-90 font-mono">
                            Downloader: {tut.downloaderCode}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 mt-1">{tut.description}</p>
                      <span className="text-xs text-slate-400 font-mono block mt-1">{tut.url}</span>
                    </div>
                    <div className="flex space-x-1.5 shrink-0 pl-4">
                      <button
                        onClick={() => {
                          setEditingTutorial(tut);
                          setShowAddTutorial(false);
                        }}
                        className="p-1.5 hover:bg-amber-500/10 text-amber-600 rounded-lg transition-colors cursor-pointer"
                        title="Modifier le tutoriel"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTutorial(tut.id)}
                        className="p-1.5 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer le tutoriel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: MANAGE WHOLESALER CLIENTS (ABONNEMENTS) */}
          {activeTab === "clients" && (
            <div className="space-y-6 text-sm animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {isOwner ? "Abonnements Activés par les Grossistes" : "Mes Activations"}
                </h3>
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl font-bold text-xs">
                  {clients.length} Abonnements au total
                </span>
              </div>

              {/* Auto-activation pour les membres de l'équipe (avec leur propre crédit) */}
              {!isOwner && (
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Votre Crédit</span>
                      <p className="text-2xl font-black text-emerald-700">{adminCreditBalance.toLocaleString()} DA</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowStaffActivate(!showStaffActivate); setStaffError(""); }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{showStaffActivate ? "Masquer" : "Activer un Client"}</span>
                    </button>
                  </div>

                  {showStaffActivate && (
                    <form onSubmit={handleStaffActivateSubmit} className="space-y-4 pt-2 border-t border-emerald-100">
                      {staffError && (
                        <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium">{staffError}</div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "iptv", label: "IPTV" },
                          { key: "sat", label: "Code Sat" },
                          { key: "box", label: "Box Android" }
                        ] as const).map(opt => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => { setStaffServiceType(opt.key); setStaffForm({ ...staffForm, productId: "" }); }}
                            className={`py-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              staffServiceType === opt.key
                                ? "bg-emerald-500/15 border-emerald-500 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Nom du Client</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Mohamed Belkaid"
                          value={staffForm.clientName}
                          onChange={e => setStaffForm({ ...staffForm, clientName: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>

                      {staffServiceType === "iptv" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-600 font-semibold mb-1">Serveur IPTV</label>
                              <select
                                value={staffForm.server}
                                onChange={e => setStaffForm({ ...staffForm, server: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                              >
                                <option value="Dino">Dino IPTV</option>
                                <option value="8K">8K Premium</option>
                                <option value="V12">V12 IPTV Pro</option>
                                <option value="Golden OTT">Golden OTT</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-600 font-semibold mb-1">Durée</label>
                              <select
                                value={staffForm.durationMonths}
                                onChange={e => setStaffForm({ ...staffForm, durationMonths: Number(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                              >
                                <option value={1}>1 Mois</option>
                                <option value={6}>6 Mois</option>
                                <option value={12}>12 Mois</option>
                              </select>
                            </div>
                          </div>
                          {["Dino", "8K", "Golden OTT"].includes(staffForm.server) && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                              <label className="text-slate-600 font-semibold">Contenu Adulte</label>
                              <div className="flex rounded-lg overflow-hidden border border-slate-300 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setStaffForm({ ...staffForm, adultContent: false })}
                                  className={`px-3 py-1.5 font-bold transition-colors cursor-pointer ${!staffForm.adultContent ? "bg-slate-700 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                                >
                                  Non
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStaffForm({ ...staffForm, adultContent: true })}
                                  className={`px-3 py-1.5 font-bold transition-colors cursor-pointer ${staffForm.adultContent ? "bg-red-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                                >
                                  Adulte
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {staffServiceType === "sat" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Produit Code Sat</label>
                            <select
                              value={staffForm.productId}
                              onChange={e => setStaffForm({ ...staffForm, productId: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                            >
                              <option value="">-- Choisir --</option>
                              {staffSatProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.priceWholesale.toLocaleString()} DA)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Durée</label>
                            <select
                              value={staffForm.durationMonths}
                              onChange={e => setStaffForm({ ...staffForm, durationMonths: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                            >
                              <option value={6}>6 Mois</option>
                              <option value={12}>12 Mois</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {staffServiceType === "box" && (
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Modèle de Box Android</label>
                          <select
                            value={staffForm.productId}
                            onChange={e => setStaffForm({ ...staffForm, productId: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                          >
                            <option value="">-- Choisir --</option>
                            {staffBoxProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.priceWholesale.toLocaleString()} DA)</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Notes (Optionnel)</label>
                        <input
                          type="text"
                          value={staffForm.notes}
                          onChange={e => setStaffForm({ ...staffForm, notes: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={staffLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm cursor-pointer"
                      >
                        {staffLoading ? "Activation en cours..." : "Confirmer l'activation"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Résultat de l'activation (codes générés) */}
              {staffActivationResult && (
                <div className="p-5 bg-white border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      <span>Activation réussie : {staffActivationResult.clientName}</span>
                    </h4>
                    <button onClick={() => setStaffActivationResult(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {staffActivationResult.credentials?.m3uUrl && (
                    <div className="text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <p><span className="text-slate-400">Host:</span> {staffActivationResult.credentials.xtreamHost}</p>
                      <p><span className="text-slate-400">User:</span> {staffActivationResult.credentials.xtreamUser}</p>
                      <p><span className="text-slate-400">Pass:</span> {staffActivationResult.credentials.xtreamPass}</p>
                      <p className="break-all"><span className="text-slate-400">M3U:</span> {staffActivationResult.credentials.m3uUrl}</p>
                    </div>
                  )}
                  {staffActivationResult.credentials?.satCode && (
                    <div className="text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-400">Code Sat:</span> {staffActivationResult.credentials.satCode}
                    </div>
                  )}
                </div>
              )}

              {/* Edit Client Form */}
              {editingClient && (
                <form onSubmit={handleEditClientSubmit} className="p-5 bg-white/60 rounded-2xl border border-amber-500/20 space-y-4">
                  <h4 className="font-bold text-amber-600 uppercase flex items-center gap-1.5">
                    <Edit2 className="h-4 w-4" />
                    <span>Attribuer les Accès / Modifier l'Abonnement de {editingClient.clientName}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Nom du Client</label>
                      <input
                        type="text"
                        required
                        value={clientForm.clientName}
                        onChange={e => setClientForm({ ...clientForm, clientName: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Serveur IPTV</label>
                      <select
                        value={clientForm.server}
                        onChange={e => setClientForm({ ...clientForm, server: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      >
                        <option value="Dino">Dino</option>
                        <option value="8K">8K Premium</option>
                        <option value="V12">V12 IPTV Pro</option>
                        <option value="Golden OTT">Golden OTT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Statut de l'Abonnement</label>
                      <select
                        value={clientForm.status}
                        onChange={e => setClientForm({ ...clientForm, status: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      >
                        <option value="active">Actif</option>
                        <option value="expired">Expiré</option>
                      </select>
                    </div>
                  </div>

                  {["Dino", "8K", "Golden OTT"].includes(clientForm.server) && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <label className="text-slate-600 font-semibold">Contenu Adulte</label>
                      <div className="flex rounded-lg overflow-hidden border border-slate-300 shrink-0">
                        <button
                          type="button"
                          onClick={() => setClientForm({ ...clientForm, adultContent: false })}
                          className={`px-3 py-1.5 font-bold transition-colors cursor-pointer ${!clientForm.adultContent ? "bg-slate-700 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                        >
                          Non
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientForm({ ...clientForm, adultContent: true })}
                          className={`px-3 py-1.5 font-bold transition-colors cursor-pointer ${clientForm.adultContent ? "bg-red-600 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}
                        >
                          Adulte
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Lien M3U Complet (Attribué par l'Admin)</label>
                      <input
                        type="text"
                        placeholder="Ex: http://dino-server.xyz:8080/get.php?username=..."
                        value={clientForm.m3uUrl}
                        onChange={e => setClientForm({ ...clientForm, m3uUrl: e.target.value })}
                        className="w-full bg-white border border-amber-500/20 focus:border-amber-500 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Xtream Host (Serveur)</label>
                      <input
                        type="text"
                        placeholder="Ex: http://dino-server.xyz:8080"
                        value={clientForm.xtreamHost}
                        onChange={e => setClientForm({ ...clientForm, xtreamHost: e.target.value })}
                        className="w-full bg-white border border-amber-500/20 focus:border-amber-500 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Xtream Username (Identifiant)</label>
                      <input
                        type="text"
                        placeholder="Ex: user123"
                        value={clientForm.xtreamUser}
                        onChange={e => setClientForm({ ...clientForm, xtreamUser: e.target.value })}
                        className="w-full bg-white border border-amber-500/20 focus:border-amber-500 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-600 font-bold mb-1">Xtream Password (Mot de passe)</label>
                      <input
                        type="text"
                        placeholder="Ex: pass123"
                        value={clientForm.xtreamPass}
                        onChange={e => setClientForm({ ...clientForm, xtreamPass: e.target.value })}
                        className="w-full bg-white border border-amber-500/20 focus:border-amber-500 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Notes / MAC Address</label>
                    <input
                      type="text"
                      value={clientForm.notes}
                      onChange={e => setClientForm({ ...clientForm, notes: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg cursor-pointer flex items-center space-x-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Enregistrer les Accès</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingClient(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {/* Clients List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse data-table-ltr">
                  <thead>
                    <tr className="bg-white/40 text-slate-500 border-b border-slate-200">
                      <th className="p-3 font-semibold">Client</th>
                      <th className="p-3 font-semibold">Revendeur (Grossiste)</th>
                      <th className="p-3 font-semibold">Serveur IPTV</th>
                      <th className="p-3 font-semibold">Durée / Expiration</th>
                      <th className="p-3 font-semibold">Identifiants Actuels</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40">
                    {clients.map((client) => {
                      const clientWholesaler = wholesalers.find(w => w.id === client.wholesalerId);
                      const isExpired = new Date(client.expirationDate) < new Date();
                      return (
                        <tr key={client.id} className={`hover:bg-slate-50 ${client.status === "pending" ? "animate-pending-blink" : ""}`}>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{client.clientName}</span>
                            <span className="text-xs text-slate-400 font-mono">ID : {client.id}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-indigo-600 block">{clientWholesaler?.businessName || "Inconnu"}</span>
                            <span className="text-xs text-slate-400 font-mono">@{clientWholesaler?.username}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded font-semibold text-[11px]">
                              {client.server}
                            </span>
                            {client.adultContent !== undefined && (
                              <span className={`ml-1.5 px-2 py-0.5 rounded font-semibold text-[11px] ${client.adultContent ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                {client.adultContent ? "Adulte" : "Sans Adulte"}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="block font-medium text-slate-600">{client.durationMonths} Mois</span>
                            <span className="text-xs text-slate-400 block">Exp : {new Date(client.expirationDate).toLocaleDateString("fr-FR")}</span>
                            {isExpired ? (
                              <span className="text-[11px] text-red-600 font-bold uppercase">Expiré</span>
                            ) : (
                              <span className="text-[11px] text-green-600 font-bold uppercase animate-pulse">Actif</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs space-y-1 max-w-xs">
                            <div className="truncate text-slate-600"><span className="text-slate-400 font-sans font-bold">M3U :</span> {client.credentials?.m3uUrl || "Non attribué"}</div>
                            <div className="text-slate-600">
                              <span className="text-slate-400 font-sans font-bold">Host :</span> {client.credentials?.xtreamHost || "Non attribué"} <br />
                              <span className="text-slate-400 font-sans font-bold">User :</span> {client.credentials?.xtreamUser || "-"} | <span className="text-slate-400 font-sans font-bold">Pass :</span> {client.credentials?.xtreamPass || "-"}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditClient(client)}
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 rounded font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Attribuer Accès</span>
                              </button>
                              {isOwner && onDeleteClient && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm(`Supprimer définitivement l'abonnement de ${client.clientName} ? Cette action est irréversible.`)) return;
                                    setErrorMessage("");
                                    setSuccessMessage("");
                                    try {
                                      await onDeleteClient(client.id);
                                      setSuccessMessage("Abonnement supprimé.");
                                    } catch (err: any) {
                                      setErrorMessage(err.message || "Échec de la suppression.");
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm">Aucun abonnement activé par les grossistes pour le moment.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: MANAGE DELIVERERS (LIVREURS) */}
          {activeTab === "livreurs" && (
            <div className="space-y-6 text-sm animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span>Gestion des Livreurs & Suivi des Colis</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Enregistrez vos livreurs partenaires et suivez les expéditions de matériel (Box, Firestick, Cartes ADSL).</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLivreur(!showAddLivreur);
                    setEditingLivreur(null);
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{showAddLivreur ? "Fermer le formulaire" : "Ajouter un Livreur"}</span>
                </button>
              </div>

              {/* Form to Add Livreur */}
              {showAddLivreur && (
                <form onSubmit={handleAddLivreurSubmit} className="p-4 bg-white/60 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-900 uppercase text-xs">➕ Nouveau Livreur Algérie</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Nom complet</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Yalidine Chéraga / Mohamed"
                        value={livreurForm.name}
                        onChange={e => setLivreurForm({ ...livreurForm, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Numéro de téléphone</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 0550112233"
                        value={livreurForm.phone}
                        onChange={e => setLivreurForm({ ...livreurForm, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Wilayas de livraison</label>
                      <input
                        type="text"
                        placeholder="Ex: Alger, Blida, Tipaza"
                        value={livreurForm.wilaya}
                        onChange={e => setLivreurForm({ ...livreurForm, wilaya: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-black font-bold rounded cursor-pointer"
                    >
                      Créer le Livreur
                    </button>
                  </div>
                </form>
              )}

              {/* Form to Edit Livreur */}
              {editingLivreur && (
                <form onSubmit={handleEditLivreurSubmit} className="p-4 bg-white/60 rounded-xl border border-amber-500/20 space-y-4">
                  <h4 className="font-bold text-amber-600 uppercase text-xs">✏️ Modifier le Livreur</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Nom complet</label>
                      <input
                        type="text"
                        required
                        value={editingLivreur.name}
                        onChange={e => setEditingLivreur({ ...editingLivreur, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Téléphone</label>
                      <input
                        type="text"
                        required
                        value={editingLivreur.phone}
                        onChange={e => setEditingLivreur({ ...editingLivreur, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Wilayas</label>
                      <input
                        type="text"
                        value={editingLivreur.wilaya}
                        onChange={e => setEditingLivreur({ ...editingLivreur, wilaya: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Statut</label>
                      <select
                        value={editingLivreur.status}
                        onChange={e => setEditingLivreur({ ...editingLivreur, status: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-900"
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-black font-bold rounded cursor-pointer"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLivreur(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {/* List of Livreurs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {livreurs.map(l => (
                  <div key={l.id} className="p-4 bg-white/40 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{l.name}</span>
                        <span className={`px-2 py-0.2 text-[8px] rounded font-bold uppercase ${
                          l.status === "active" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-gray-500/10 text-slate-500 border border-slate-200"
                        }`}>
                          {l.status === "active" ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">📞 Tél : <span className="font-semibold text-slate-900">{l.phone}</span></p>
                      <p className="text-slate-500 mt-1">📍 Secteurs/Wilayas : <span className="text-slate-700">{l.wilaya || "Algérie Entière"}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLivreur(l);
                          setShowAddLivreur(false);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-amber-600 rounded cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLivreur(l.id)}
                        className="p-1.5 bg-slate-100 hover:bg-red-500/20 text-red-600 rounded cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {livreurs.length === 0 && (
                  <div className="p-8 text-center text-slate-400 md:col-span-2">
                    <Truck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm">Aucun livreur enregistré.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: PANEL REQUESTS MANAGEMENT */}
          {activeTab === "panels" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">Demandes de Panels Revendeur</h3>
                  <p className="text-sm text-slate-500 mt-1">Validez et configurez les demandes de panels grossistes (10 codes minimum).</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-500 border-collapse data-table-ltr">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-xs uppercase font-bold tracking-wider text-slate-500">
                      <th className="p-4">Date / ID</th>
                      <th className="p-4">Revendeur</th>
                      <th className="p-4">Serveur</th>
                      <th className="p-4">Codes</th>
                      <th className="p-4 text-center">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panelRequests.map((req) => (
                      <tr key={req.id} className={`border-b hover:bg-slate-50 ${
                        req.status === "pending" ? "border-red-300 animate-pending-blink" : "border-slate-200"
                      }`}>
                        <td className="p-4 font-mono text-xs">
                          <span className="text-slate-500 block">{new Date(req.createdAt).toLocaleString("fr-FR")}</span>
                          <span className="text-slate-400">ID: {req.id}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{req.wholesalerName}</span>
                          <span className="text-slate-400">ID Revendeur: {req.wholesalerId}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded font-bold text-xs bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                            {req.server}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900 text-sm">
                          {req.codesCount} codes
                        </td>
                        <td className="p-4 text-center">
                          {req.status === "pending" && (
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded font-semibold text-xs">
                              En attente
                            </span>
                          )}
                          {req.status === "approved" && (
                            <span className="px-2.5 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded font-semibold text-xs">
                              Panel Activé
                            </span>
                          )}
                          {req.status === "rejected" && (
                            <span className="px-2.5 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded font-semibold text-xs">
                              Rejeté
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {req.status === "pending" ? (
                            <div className="flex flex-col items-end gap-2">
                              <input
                                type="text"
                                placeholder="Note admin (ex: Vos accès sont...)"
                                value={panelActionNotes[req.id] || ""}
                                onChange={(e) => setPanelActionNotes({ ...panelActionNotes, [req.id]: e.target.value })}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 w-48 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onProcessPanelRequest) {
                                      onProcessPanelRequest(req.id, "approved", panelActionNotes[req.id] || "Panel créé et configuré avec succès.");
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-green-500 hover:bg-green-400 text-black font-extrabold rounded text-xs cursor-pointer"
                                >
                                  Approuver & Activer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onProcessPanelRequest) {
                                      onProcessPanelRequest(req.id, "rejected", panelActionNotes[req.id] || "Demande refusée par l'administrateur.");
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-600 hover:text-black font-bold rounded text-xs cursor-pointer"
                                >
                                  Rejeter
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Traité (Note: {req.notes || "Aucune note"})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {panelRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Aucune demande de panel de revendeur en attente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: CATALOG CATEGORIES MANAGEMENT */}
          {activeTab === "categories" && (
            <div className="space-y-6 animate-in fade-in duration-300 text-left">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">Gestion des Catégories du Catalogue</h3>
                  <p className="text-sm text-slate-500 mt-1">Créez des catégories personnalisées pour votre boutique avec icône, couleur et description.</p>
                </div>
              </div>

              {/* Ready-to-use Predefined Templates (Grand Choix) */}
              <div className="p-5 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 rounded-2xl border border-indigo-200">
                <h4 className="font-bold text-indigo-700 uppercase text-xs tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>Grand Choix de Catégories Prêtes à l'Emploi (Ajout en 1 clic)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: "Abonnements IPTV", description: "Abonnements Premium 12 mois, 6 mois et 3 mois.", icon: "Tv", color: "indigo" },
                    { name: "Codes de Recharge", description: "Codes de recharge et d'activation instantanés.", icon: "Key", color: "amber" },
                    { name: "Boîtiers & Box Android", description: "Matériel, clés Fire TV Stick et accessoires.", icon: "Box", color: "emerald" },
                    { name: "Serveurs Satellite", description: "Décryptage satellite (Cccam, G-Share, Orca).", icon: "Flame", color: "rose" },
                    { name: "Applications & APKs", description: "Lecteurs officiels Premium et APK de visionnage.", icon: "Sparkles", color: "blue" },
                    { name: "Abonnement VIP Premium", description: "Haute performance 4K sans latence avec serveurs dédiés.", icon: "Zap", color: "purple" }
                  ].map((tpl) => {
                    // check color styles
                    const isAmber = tpl.color === "amber";
                    const isEmerald = tpl.color === "emerald";
                    const isBlue = tpl.color === "blue";
                    const isRose = tpl.color === "rose";
                    const isPurple = tpl.color === "purple";
                    const colorStyles = 
                      isAmber ? { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" } :
                      isEmerald ? { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" } :
                      isBlue ? { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" } :
                      isRose ? { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/20" } :
                      isPurple ? { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/20" } :
                      { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20" };

                    return (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={async () => {
                          if (onAddCategory) {
                            await onAddCategory({
                              name: tpl.name,
                              description: tpl.description,
                              icon: tpl.icon,
                              color: tpl.color
                            });
                          }
                        }}
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 hover:border-indigo-500/30 text-left transition-all cursor-pointer flex items-start gap-3 group"
                      >
                        <div className={`p-2 rounded-lg ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border} border group-hover:scale-105 transition-transform shrink-0`}>
                          {tpl.icon === "Key" && <Key className="h-4 w-4" />}
                          {tpl.icon === "Box" && <Box className="h-4 w-4" />}
                          {tpl.icon === "Flame" && <Flame className="h-4 w-4" />}
                          {tpl.icon === "Sparkles" && <Sparkles className="h-4 w-4" />}
                          {tpl.icon === "Zap" && <Zap className="h-4 w-4" />}
                          {tpl.icon === "Tv" && <Tv className="h-4 w-4" />}
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{tpl.name}</span>
                            <span className="text-[8px] bg-indigo-500/10 text-indigo-600 px-1 rounded uppercase font-semibold">Pret</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{tpl.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Advanced Form to Add Category */}
                <div className="lg:col-span-1 p-5 bg-white/60 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider text-indigo-600">➕ Créer Catégorie sur-mesure</h4>
                  
                  <div className="space-y-3.5 text-sm">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Nom de la catégorie</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Serveur 8K Premium"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Description courte</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Serveur haute définition idéal pour Smart TV..."
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 placeholder-slate-400 resize-none"
                      />
                    </div>

                    {/* Icon Selection */}
                    <div>
                      <label className="block text-slate-500 mb-1.5 font-semibold">Icône de la catégorie</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: "Tv", label: "Tv" },
                          { val: "Key", label: "Clef" },
                          { val: "Box", label: "Box" },
                          { val: "Flame", label: "Feu" },
                          { val: "Sparkles", label: "Nouv" },
                          { val: "Zap", label: "Vip" },
                          { val: "FolderOpen", label: "Doss" }
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setNewCategoryIcon(item.val)}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                              newCategoryIcon === item.val
                                ? "bg-indigo-600/20 border-indigo-500 text-indigo-600 font-bold"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                            }`}
                          >
                            {item.val === "Tv" && <Tv className="h-4 w-4" />}
                            {item.val === "Key" && <Key className="h-4 w-4" />}
                            {item.val === "Box" && <Box className="h-4 w-4" />}
                            {item.val === "Flame" && <Flame className="h-4 w-4" />}
                            {item.val === "Sparkles" && <Sparkles className="h-4 w-4" />}
                            {item.val === "Zap" && <Zap className="h-4 w-4" />}
                            {item.val === "FolderOpen" && <FolderOpen className="h-4 w-4" />}
                            <span className="text-[8px] truncate max-w-full">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Accent Selection */}
                    <div>
                      <label className="block text-slate-500 mb-1.5 font-semibold">Couleur d'accentuation</label>
                      <div className="flex gap-2">
                        {[
                          { val: "indigo", bg: "bg-indigo-500" },
                          { val: "amber", bg: "bg-amber-500" },
                          { val: "emerald", bg: "bg-emerald-500" },
                          { val: "blue", bg: "bg-blue-500" },
                          { val: "rose", bg: "bg-rose-500" },
                          { val: "purple", bg: "bg-purple-500" }
                        ].map((col) => (
                          <button
                            key={col.val}
                            type="button"
                            onClick={() => setNewCategoryColor(col.val)}
                            className={`w-6 h-6 rounded-full ${col.bg} relative transition-all cursor-pointer ${
                              newCategoryColor === col.val
                                ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
                                : "opacity-60 hover:opacity-100"
                            }`}
                            title={col.val}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCategoryName.trim()) return;
                        if (onAddCategory) {
                          await onAddCategory({
                            name: newCategoryName,
                            description: newCategoryDescription,
                            icon: newCategoryIcon,
                            color: newCategoryColor
                          });
                          setNewCategoryName("");
                          setNewCategoryDescription("");
                          setNewCategoryIcon("Tv");
                          setNewCategoryColor("indigo");
                        }
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer mt-2"
                    >
                      Ajouter au Catalogue
                    </button>
                  </div>
                </div>

                {/* Categories Grid List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm">Catégories existantes ({catalogCategories.length})</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catalogCategories.map((cat) => {
                        // check color styles
                        const isAmber = cat.color === "amber";
                        const isEmerald = cat.color === "emerald";
                        const isBlue = cat.color === "blue";
                        const isRose = cat.color === "rose";
                        const isPurple = cat.color === "purple";
                        const colorStyles = 
                          isAmber ? { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" } :
                          isEmerald ? { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" } :
                          isBlue ? { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" } :
                          isRose ? { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/20" } :
                          isPurple ? { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/20" } :
                          { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20" };

                        return (
                          <div key={cat.id} className="p-4 bg-white/40 rounded-xl border border-slate-200 hover:border-slate-300/80 transition-all flex justify-between items-start text-sm gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`p-2 rounded-lg ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border} border shrink-0`}>
                                {cat.icon === "Key" && <Key className="h-4 w-4" />}
                                {cat.icon === "Box" && <Box className="h-4 w-4" />}
                                {cat.icon === "Flame" && <Flame className="h-4 w-4" />}
                                {cat.icon === "Sparkles" && <Sparkles className="h-4 w-4" />}
                                {cat.icon === "Zap" && <Zap className="h-4 w-4" />}
                                {cat.icon === "FolderOpen" && <FolderOpen className="h-4 w-4" />}
                                {(!cat.icon || cat.icon === "Tv") && <Tv className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate">{cat.name}</span>
                                {cat.description && (
                                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{cat.description}</p>
                                )}
                                <span className="text-[11px] text-slate-400 block mt-1 font-mono">ID: {cat.id}</span>
                              </div>
                            </div>

                            <div className="flex gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingCategory(cat)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-amber-600 rounded cursor-pointer transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?") && onDeleteCategory) {
                                    onDeleteCategory(cat.id);
                                  }
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-red-500/20 text-red-600 rounded cursor-pointer transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {catalogCategories.length === 0 && (
                        <p className="text-sm text-slate-400 col-span-2 text-center py-6">Aucune catégorie personnalisée dans votre catalogue.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Category Modal */}
              {editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 text-left">
                  <div className="w-full max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-amber-500" />
                        <span>Modifier la Catégorie</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (editingCategory && onUpdateCategory) {
                          await onUpdateCategory(editingCategory.id, {
                            name: editingCategory.name,
                            description: editingCategory.description || "",
                            icon: editingCategory.icon || "Tv",
                            color: editingCategory.color || "indigo"
                          });
                          setEditingCategory(null);
                        }
                      }}
                      className="space-y-4 text-sm"
                    >
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Nom de la catégorie</label>
                        <input
                          type="text"
                          required
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Description courte</label>
                        <textarea
                          rows={2}
                          value={editingCategory.description || ""}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>

                      {/* Icon Selection */}
                      <div>
                        <label className="block text-slate-500 mb-1.5 font-semibold">Icône de la catégorie</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { val: "Tv", label: "Tv" },
                            { val: "Key", label: "Clef" },
                            { val: "Box", label: "Box" },
                            { val: "Flame", label: "Feu" },
                            { val: "Sparkles", label: "Nouv" },
                            { val: "Zap", label: "Vip" },
                            { val: "FolderOpen", label: "Doss" }
                          ].map((item) => (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => setEditingCategory({ ...editingCategory, icon: item.val })}
                              className={`p-2 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                                editingCategory.icon === item.val
                                  ? "bg-amber-500/20 border-amber-500 text-amber-600 font-bold"
                                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                              }`}
                            >
                              {item.val === "Tv" && <Tv className="h-4 w-4" />}
                              {item.val === "Key" && <Key className="h-4 w-4" />}
                              {item.val === "Box" && <Box className="h-4 w-4" />}
                              {item.val === "Flame" && <Flame className="h-4 w-4" />}
                              {item.val === "Sparkles" && <Sparkles className="h-4 w-4" />}
                              {item.val === "Zap" && <Zap className="h-4 w-4" />}
                              {item.val === "FolderOpen" && <FolderOpen className="h-4 w-4" />}
                              <span className="text-[8px] truncate max-w-full">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Accent Selection */}
                      <div>
                        <label className="block text-slate-500 mb-1.5 font-semibold">Couleur d'accentuation</label>
                        <div className="flex gap-2">
                          {[
                            { val: "indigo", bg: "bg-indigo-500" },
                            { val: "amber", bg: "bg-amber-500" },
                            { val: "emerald", bg: "bg-emerald-500" },
                            { val: "blue", bg: "bg-blue-500" },
                            { val: "rose", bg: "bg-rose-500" },
                            { val: "purple", bg: "bg-purple-500" }
                          ].map((col) => (
                            <button
                              key={col.val}
                              type="button"
                              onClick={() => setEditingCategory({ ...editingCategory, color: col.val })}
                              className={`w-6 h-6 rounded-full ${col.bg} relative transition-all cursor-pointer ${
                                editingCategory.color === col.val
                                  ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                              title={col.val}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-gray-750 text-slate-600 rounded-xl transition-colors font-semibold cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- BANNIÈRES ACCUEIL (Carrousel) --- */}
          {activeTab === "slides" && (
            <div className="space-y-6 text-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Bannières du Carrousel d'Accueil</h3>
                  <p className="text-slate-400 text-xs mt-1">Ces bannières défilent automatiquement en haut de la page d'accueil de la boutique.</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddSlide(!showAddSlide);
                    setEditingSlide(null);
                    resetSlideForm();
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddSlide ? "Masquer" : "Ajouter une Bannière"}</span>
                </button>
              </div>

              {(showAddSlide || editingSlide) && (
                <form onSubmit={editingSlide ? handleEditSlideSubmit : handleAddSlideSubmit} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-blue-600 uppercase">{editingSlide ? "Modifier la bannière" : "Ajouter une nouvelle bannière"}</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Badge (Optionnel)</label>
                      <input
                        type="text"
                        placeholder="Ex: Google TV Box:"
                        value={slideForm.badge}
                        onChange={e => setSlideForm({ ...slideForm, badge: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Texte du Bouton</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Acheter Maintenant"
                        value={slideForm.buttonText}
                        onChange={e => setSlideForm({ ...slideForm, buttonText: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Titre de la Bannière</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Stream BoxTV 4K Google TV RJ45 2/32GB"
                      value={slideForm.title}
                      onChange={e => setSlideForm({ ...slideForm, title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Mot à Mettre en Avant (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="Doit être recopié exactement depuis le titre ci-dessus, ex: BoxTV 4K"
                      value={slideForm.highlightWord}
                      onChange={e => setSlideForm({ ...slideForm, highlightWord: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Ce mot sera affiché en couleur dans le titre. Laissez vide pour un titre uni.</p>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Image de la Bannière</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlideImageUpload}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 mb-1.5"
                    />
                    <input
                      type="text"
                      required
                      placeholder="...ou collez une URL d'image ici"
                      value={slideForm.imageUrl}
                      onChange={e => setSlideForm({ ...slideForm, imageUrl: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                    />
                    {slideForm.imageUrl && (
                      <img src={slideForm.imageUrl} alt="Aperçu" className="mt-2 h-24 rounded-lg border border-slate-200 object-cover" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Produit Lié (Optionnel)</label>
                      <select
                        value={slideForm.productId}
                        onChange={e => setSlideForm({ ...slideForm, productId: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      >
                        <option value="">-- Aucun (voir lien externe) --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">Clic sur le bouton = ouvre directement la commande de ce produit.</p>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Ou Lien Externe (Optionnel)</label>
                      <input
                        type="text"
                        placeholder="https://... (ignoré si produit lié)"
                        value={slideForm.linkUrl}
                        onChange={e => setSlideForm({ ...slideForm, linkUrl: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                  </div>

                  <label className="flex items-center space-x-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={slideForm.isNew}
                      onChange={e => setSlideForm({ ...slideForm, isNew: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-slate-600 font-semibold">Afficher le badge "NEW"</span>
                  </label>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddSlide(false);
                        setEditingSlide(null);
                        resetSlideForm();
                      }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-colors shadow-lg cursor-pointer"
                    >
                      {editingSlide ? "Enregistrer" : "Ajouter la Bannière"}
                    </button>
                  </div>
                </form>
              )}

              {/* Liste des bannières existantes */}
              <div className="space-y-3">
                {heroSlides.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">Aucune bannière configurée. La page d'accueil affiche le contenu par défaut.</p>
                  </div>
                ) : (
                  heroSlides.sort((a, b) => a.order - b.order).map((slide) => (
                    <div key={slide.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200">
                      <img src={slide.imageUrl} alt={slide.title} className="h-16 w-16 rounded-lg object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        {slide.badge && <span className="text-[10px] text-blue-600 font-semibold block">{slide.badge}</span>}
                        <p className="font-bold text-slate-900 truncate">{slide.title}</p>
                        <p className="text-xs text-slate-400">
                          Bouton : "{slide.buttonText}"
                          {slide.productId && <span className="text-emerald-600"> · lié à un produit</span>}
                          {slide.linkUrl && <span className="text-indigo-600"> · lien externe</span>}
                          {slide.isNew && <span className="text-amber-600"> · badge NEW</span>}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => { startEditSlide(slide); setShowAddSlide(false); }}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlide(slide.id, slide.title)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* --- ÉQUIPE (comptes admin secondaires) --- */}
          {activeTab === "team" && (
            <div className="space-y-6 text-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Comptes de l'Équipe</h3>
                  <p className="text-slate-400 text-xs mt-1">Donnez à un membre de votre équipe son propre accès au panel admin, sans partager votre mot de passe principal.</p>
                </div>
                <button
                  onClick={() => setShowAddTeamMember(!showAddTeamMember)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddTeamMember ? "Masquer" : "Ajouter un Membre"}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-xs">
                ⚠️ Ces comptes ont un accès complet au panel admin (revendeurs, commandes, crédits, catalogue...). N'ajoutez que des personnes de confiance.
              </div>

              {showAddTeamMember && (
                <form onSubmit={handleAddTeamMember} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-blue-600 uppercase">Nouveau membre de l'équipe</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Nom complet</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Yacine Support"
                        value={teamForm.name}
                        onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Nom d'utilisateur</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: yacine"
                        value={teamForm.username}
                        onChange={e => setTeamForm({ ...teamForm, username: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Mot de passe</label>
                      <input
                        type="text"
                        required
                        minLength={6}
                        placeholder="6 caractères minimum"
                        value={teamForm.password}
                        onChange={e => setTeamForm({ ...teamForm, password: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-3">
                    <h5 className="font-bold text-indigo-700 text-xs uppercase tracking-wider">Alertes personnelles (Optionnel)</h5>
                    <p className="text-[11px] text-slate-500">Ce membre recevra aussi un email/notification à chaque nouvel événement (commande, revendeur...), en plus de vous.</p>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="Ex: yacine@gmail.com"
                        value={teamForm.alertEmail}
                        onChange={e => setTeamForm({ ...teamForm, alertEmail: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900"
                      />
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <label className="block text-emerald-700 font-semibold mb-1">Telegram Chat ID <span className="font-normal text-emerald-600">(recommandé, plus fiable)</span></label>
                      <input
                        type="text"
                        placeholder="Ex: 123456789"
                        value={teamForm.alertTelegramChatId}
                        onChange={e => setTeamForm({ ...teamForm, alertTelegramChatId: e.target.value })}
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                      />
                      <p className="text-[10px] text-emerald-600 mt-1">Ce membre doit d'abord envoyer un message au bot Telegram, puis vous transmettre son Chat ID.</p>
                    </div>
                    <details className="text-[11px] text-slate-400">
                      <summary className="cursor-pointer text-slate-500 font-semibold">WhatsApp (optionnel, moins fiable)</summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Numéro WhatsApp</label>
                          <input
                            type="text"
                            placeholder="Ex: +213xxxxxxxxx"
                            value={teamForm.alertWhatsappPhone}
                            onChange={e => setTeamForm({ ...teamForm, alertWhatsappPhone: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Clé CallMeBot</label>
                          <input
                            type="text"
                            placeholder="Reçue par ce membre sur son WhatsApp"
                            value={teamForm.alertWhatsappApiKey}
                            onChange={e => setTeamForm({ ...teamForm, alertWhatsappApiKey: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono"
                          />
                        </div>
                      </div>
                    </details>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-2">Tâches autorisées <span className="text-slate-400 font-normal">(cochez ce qu'il/elle pourra gérer)</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PERMISSION_TAB_LABELS.map(p => (
                        <label key={p.key} className="flex items-center space-x-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                          <input
                            type="checkbox"
                            checked={teamForm.permissions.includes(p.key)}
                            onChange={() => toggleFormPermission(p.key)}
                            className="rounded"
                          />
                          <span className="text-slate-700 text-xs font-medium">{p.label}</span>
                        </label>
                      ))}
                    </div>
                    {teamForm.permissions.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1.5">⚠️ Aucune tâche cochée : ce compte ne pourra rien faire tant que vous n'en cochez pas au moins une.</p>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTeamMember(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-colors shadow-lg cursor-pointer"
                    >
                      Créer le Compte
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {teamMembers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">Aucun membre de l'équipe pour le moment. Vous êtes seul(e) à avoir accès au panel admin.</p>
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-400">
                            Utilisateur : <span className="font-mono text-slate-600">{member.username}</span> · Ajouté le {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-xs font-bold text-emerald-600 mt-0.5">
                            💰 Crédit : {(member.creditBalance ?? 0).toLocaleString()} DA
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {editingPermissionsFor !== member.id && (
                            <button
                              onClick={() => startEditPermissions(member)}
                              className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 border border-indigo-500/20 rounded-lg font-bold text-xs cursor-pointer"
                            >
                              Modifier les Tâches / Alertes
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTeamMember(member.id, member.name)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg cursor-pointer"
                            title="Retirer l'accès"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {editingPermissionsFor === member.id ? (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                            <label className="block text-emerald-700 font-semibold mb-1 text-xs">Crédit accordé (DA)</label>
                            <input
                              type="number"
                              value={editCreditDraft}
                              onChange={e => setEditCreditDraft(e.target.value)}
                              className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-slate-900 text-sm font-bold"
                            />
                            <p className="text-[10px] text-emerald-600 mt-1">Ce membre peut activer des abonnements IPTV/Sat/Box avec ce crédit, comme un revendeur.</p>
                          </div>
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <label className="block text-amber-700 font-semibold mb-1 text-xs">Nouveau mot de passe</label>
                            <input
                              type="text"
                              value={editPasswordDraft}
                              onChange={e => setEditPasswordDraft(e.target.value)}
                              placeholder="Laisser vide pour ne pas changer"
                              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-slate-900 text-sm font-mono"
                            />
                            <p className="text-[10px] text-amber-600 mt-1">6 caractères minimum. Communiquez-le au membre concerné une fois enregistré.</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="email"
                              placeholder="Email d'alerte"
                              value={editAlertDraft.alertEmail}
                              onChange={e => setEditAlertDraft({ ...editAlertDraft, alertEmail: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Telegram Chat ID (recommandé)"
                              value={editAlertDraft.alertTelegramChatId}
                              onChange={e => setEditAlertDraft({ ...editAlertDraft, alertTelegramChatId: e.target.value })}
                              className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-slate-900 text-xs font-mono"
                            />
                            <input
                              type="text"
                              placeholder="Numéro WhatsApp (+213...)"
                              value={editAlertDraft.alertWhatsappPhone}
                              onChange={e => setEditAlertDraft({ ...editAlertDraft, alertWhatsappPhone: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs font-mono"
                            />
                            <input
                              type="text"
                              placeholder="Clé CallMeBot du membre"
                              value={editAlertDraft.alertWhatsappApiKey}
                              onChange={e => setEditAlertDraft({ ...editAlertDraft, alertWhatsappApiKey: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {PERMISSION_TAB_LABELS.map(p => (
                              <label key={p.key} className="flex items-center space-x-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100">
                                <input
                                  type="checkbox"
                                  checked={editPermissionsDraft.includes(p.key)}
                                  onChange={() => toggleEditPermission(p.key)}
                                  className="rounded"
                                />
                                <span className="text-slate-700 text-xs font-medium">{p.label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingPermissionsFor(null)}
                              className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg font-bold text-xs cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => handleSaveMemberPermissions(member.id)}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                            >
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {(member.permissions || []).length === 0 ? (
                              <span className="text-[11px] text-amber-600 italic">Aucune tâche assignée — ce compte ne peut rien faire pour l'instant.</span>
                            ) : (
                              PERMISSION_TAB_LABELS.filter(p => (member.permissions || []).includes(p.key)).map(p => (
                                <span key={p.key} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded font-semibold text-[11px]">
                                  {p.label}
                                </span>
                              ))
                            )}
                          </div>
                          {(member.alertEmail || member.alertWhatsappPhone || member.alertTelegramChatId) && (
                            <div className="flex flex-wrap gap-1.5">
                              {member.alertEmail && (
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 rounded font-semibold text-[11px]">
                                  📧 {member.alertEmail}
                                </span>
                              )}
                              {member.alertTelegramChatId && (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded font-semibold text-[11px]">
                                  ✈️ Telegram configuré
                                </span>
                              )}
                              {member.alertWhatsappPhone && (
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 rounded font-semibold text-[11px]">
                                  📱 {member.alertWhatsappPhone} {!member.alertWhatsappApiKey && "(clé manquante)"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
