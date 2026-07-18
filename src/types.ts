export type SubscriptionServer = 'Dino' | '8K' | 'V12' | 'Golden OTT';

// Liens de gestion des bouquets par serveur (fournis/édités par l'admin),
// affichés au revendeur/client pour configurer ses chaînes après activation.
// Clé = nom du serveur en minuscules ("dino", "8k", "golden ott").
export type ServerBouquetLinks = Record<string, string>;

// Compte membre de l'équipe (accès admin secondaire, en plus du compte
// principal ADMIN_USERNAME/ADMIN_PASSWORD).
export interface TeamMember {
  id: string;
  username: string;
  password?: string; // hashé (bcrypt) côté serveur, jamais renvoyé au client
  name: string;
  createdAt: string;
  // Sections du panel admin auxquelles ce membre a accès (voir ADMIN_TABS).
  // Vide = aucun accès (sauf le compte principal, qui a toujours accès à tout).
  permissions?: string[];
  // Crédit accordé par l'admin, utilisé par ce membre pour activer lui-même
  // des abonnements IPTV/Sat/Box (comme un revendeur, mais en interne).
  creditBalance?: number;
  // Alertes personnelles (en plus de celles de l'administrateur principal).
  alertEmail?: string;
  // Clé CallMeBot du membre : chacun doit l'obtenir lui-même en envoyant
  // "I allow callmebot to send me messages" depuis SON propre WhatsApp
  // (une clé n'est valable que pour le numéro qui l'a générée).
  alertWhatsappPhone?: string;
  alertWhatsappApiKey?: string;
  // Chat ID Telegram du membre (obtenu en lui faisant envoyer un message au
  // bot puis en consultant /getUpdates) — canal recommandé, plus fiable que WhatsApp.
  alertTelegramChatId?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

// Bannière/slide du carrousel d'accueil, gérée par l'admin.
export interface HeroSlide {
  id: string;
  badge?: string; // ex: "Google TV Box:"
  title: string; // ex: "Stream BoxTV 4K Google TV RJ45 2/32GB"
  highlightWord?: string; // mot mis en avant dans le titre (couleur d'accent), doit être une sous-chaîne exacte de "title"
  buttonText: string; // ex: "Acheter Maintenant"
  imageUrl: string;
  productId?: string; // si défini, le bouton ouvre le formulaire de commande de ce produit
  linkUrl?: string; // sinon, lien externe/interne optionnel
  isNew?: boolean; // affiche un badge "NEW"
  order: number; // ordre d'affichage dans le carrousel
}

export interface Product {
  id: string;
  name: string;
  type: string;
  priceRetail: number; // in DA (Algerian Dinar)
  priceWholesale: number; // in DA
  description: string;
  features: string[];
  imageUrl: string;
  imageUrl2?: string; // Second product image for gallery
  isPopular?: boolean;
  categoryId?: string; // category link
  // Si vrai, ce produit puise un code depuis un stock pré-chargé par l'admin
  // (au lieu de générer des identifiants automatiquement) — pour Code Sat et
  // certains produits IPTV vendus avec un simple "code d'activation".
  usesCodeStock?: boolean;
  // Nom de l'application recommandée pour ce produit (ex: "IPTV Smarters Pro"),
  // affiché sur la page dédiée du produit.
  appName?: string;
}

// Un code du stock pré-chargé, rattaché à un produit précis.
export interface StockCode {
  id: string;
  productId: string;
  code: string;
  isUsed: boolean;
  usedByClientId?: string;
  addedAt: string;
  usedAt?: string;
}

export interface Wholesaler {
  id: string;
  username: string;
  password?: string;
  businessName: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'suspended';
  creditBalance: number; // in DA
  createdAt: string;
  // Membre de l'équipe qui gère ce revendeur (créé par lui, ou pris en charge
  // à la première action sur une inscription auto). Absent = pas encore assigné,
  // visible par tous les membres ayant la permission "wholesalers" jusqu'à prise en charge.
  handledByTeamMemberId?: string;
}

export interface IptvClient {
  id: string;
  // Un client est créé SOIT par un revendeur (wholesalerId), SOIT par un
  // membre de l'équipe (createdByTeamMemberId) — jamais les deux.
  wholesalerId?: string;
  createdByTeamMemberId?: string;
  clientName: string;
  // Type de service activé. Absent = 'iptv' (rétrocompatibilité avec les
  // activations existantes créées avant l'ajout de Code Sat / Box Android).
  serviceType?: 'iptv' | 'sat' | 'box';
  server: SubscriptionServer | string; // élargi : nom de produit libre pour Code Sat / Box Android
  durationMonths: number;
  pricePaid: number; // Wholesaler's cost
  activationDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'pending';
  notes?: string;
  credentials?: {
    m3uUrl?: string;
    xtreamUser?: string;
    xtreamPass?: string;
    xtreamHost?: string;
    satCode?: string; // pour les activations Code Sat
    bouquetLink?: string; // lien de gestion des bouquets (Dino/8K/Golden OTT), fourni par l'admin
  };
  // Contenu adulte inclus ou non (Dino / 8K / Golden OTT uniquement)
  adultContent?: boolean;
}

export interface Livreur {
  id: string;
  name: string;
  phone: string;
  wilaya: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Order {
  id: string;
  // Membre de l'équipe qui a pris en charge cette commande (assigné
  // automatiquement dès la première action). Absent = pas encore prise en main.
  handledByTeamMemberId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  productType: string;
  priceDA: number;
  paymentMethod: 'baridimob' | 'ccp' | 'card' | 'hand';
  paymentDetails?: string; // proof ID, transaction ID, etc.
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  tvModel?: string;
  installedApp?: string;
  hasAndroidBox?: boolean;
  downloaderCode?: string;
  assignedLivreurId?: string; // assigned deliverer ID
  deliveryStatus?: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned';
  // Livraison (produits physiques uniquement : box android, démodulateur, TV...)
  shippingWilaya?: string;
  shippingType?: 'domicile' | 'bureau';
  shippingAddress?: string;
  shippingPriceDA?: number;
  shippingDelay?: string; // ex: "J+1"
  // IPTV (Dino / 8K / Golden OTT) : choix contenu adulte, fait par le client au
  // moment de la commande. Les accès (credentials) sont saisis par l'admin une
  // fois la commande validée, et affichés au client via le suivi de commande.
  adultContent?: boolean;
  credentials?: {
    m3uUrl?: string;
    xtreamUser?: string;
    xtreamPass?: string;
    xtreamHost?: string;
    bouquetLink?: string;
    satCode?: string; // Code Sat / IPTV à code d'activation, puisé du stock
  };
}

export interface VideoTutorial {
  id: string;
  title: string;
  url: string;
  description: string;
  category: 'smart_tv' | 'android' | 'firestick' | 'other';
  downloaderCode?: string;
  createdAt: string;
}

export interface CreditRequest {
  id: string;
  wholesalerId: string;
  wholesalerName: string;
  amountDA: number;
  paymentMethod: 'baridimob' | 'ccp' | 'hand';
  receiptReference: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
  type: 'new_wholesaler' | 'new_order' | 'credit_request' | 'client_activation' | 'panel_request';
}

export interface PanelRequest {
  id: string;
  wholesalerId: string;
  wholesalerName: string;
  server: SubscriptionServer;
  codesCount: number; // minimum 10
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AppStats {
  totalRetailSales: number;
  totalWholesaleSales: number;
  totalRevenueDA: number;
  activeWholesalers: number;
  totalClientsActivated: number;
}
