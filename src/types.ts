export type SubscriptionServer = 'Dino' | '8K' | 'V12' | 'Golden OTT';

export interface Product {
  id: string;
  name: string;
  type: 'iptv' | 'device' | 'adsl';
  priceRetail: number; // in DA (Algerian Dinar)
  priceWholesale: number; // in DA
  description: string;
  features: string[];
  imageUrl: string;
  imageUrl2?: string; // Second product image for gallery
  isPopular?: boolean;
}

export interface Wholesaler {
  id: string;
  username: string;
  businessName: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'suspended';
  creditBalance: number; // in DA
  createdAt: string;
}

export interface IptvClient {
  id: string;
  wholesalerId: string;
  clientName: string;
  server: SubscriptionServer;
  durationMonths: number;
  pricePaid: number; // Wholesaler's cost
  activationDate: string;
  expirationDate: string;
  status: 'active' | 'expired';
  notes?: string;
  credentials?: {
    m3uUrl?: string;
    xtreamUser?: string;
    xtreamPass?: string;
    xtreamHost?: string;
  };
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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productId: string;
  productName: string;
  productType: 'iptv' | 'device' | 'adsl';
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
  type: 'new_wholesaler' | 'new_order' | 'credit_request' | 'client_activation';
}

export interface AppStats {
  totalRetailSales: number;
  totalWholesaleSales: number;
  totalRevenueDA: number;
  activeWholesalers: number;
  totalClientsActivated: number;
}
