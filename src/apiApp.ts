import express from "express";
import "express-async-errors";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { getTariffForWilaya } from "./data/deliveryTariffs.js";
import {
  Product,
  Wholesaler,
  IptvClient,
  Order,
  CreditRequest,
  EmailNotification,
  VideoTutorial,
  Livreur,
  CatalogCategory,
  PanelRequest,
  ServerBouquetLinks
} from "./types.js";

const app = express();

// IMPORTANT: On Vercel, the filesystem is read-only except for /tmp, and /tmp
// is wiped between cold starts / deployments — so it is NOT persistent
// storage in production. It's used ONLY as a local dev fallback below.
const DB_FILE = process.env.VERCEL
  ? path.join("/tmp", "db.json")
  : path.join(process.cwd(), "db.json");

// Stockage persistant : Upstash Redis (via l'intégration Vercel Marketplace).
// Toute la base est stockée sous une seule clé, sous forme de JSON — la
// structure de données (DBStructure) ne change pas, seule l'IO change.
const UPSTASH_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = (UPSTASH_URL && UPSTASH_TOKEN)
  ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN, automaticDeserialization: false })
  : null;
const REDIS_DB_KEY = "dziptv:db";

if (!redis) {
  console.warn(
    "[DB WARNING] Aucune base Upstash Redis détectée (variables KV_REST_API_URL / " +
    "KV_REST_API_TOKEN ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absentes). " +
    "Utilisation du fichier local db.json en secours — sur Vercel, cela signifie que " +
    "les données NE SERONT PAS persistantes. Installez l'intégration Upstash depuis " +
    "le Vercel Marketplace pour activer le stockage persistant."
  );
}

async function storageReadRaw(): Promise<string | null> {
  if (redis) {
    const value = await redis.get<string>(REDIS_DB_KEY);
    if (value === null || value === undefined) return null;
    // Sécurité : si le SDK renvoie malgré tout un objet déjà désérialisé
    // (plutôt que la chaîne JSON brute attendue), on le re-sérialise.
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  if (!fs.existsSync(DB_FILE)) return null;
  return fs.readFileSync(DB_FILE, "utf-8");
}

async function storageWriteRaw(json: string): Promise<void> {
  if (redis) {
    await redis.set(REDIS_DB_KEY, json);
    return;
  }
  fs.writeFileSync(DB_FILE, json, "utf-8");
}

async function storageDeleteRaw(): Promise<void> {
  if (redis) {
    await redis.del(REDIS_DB_KEY);
    return;
  }
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ============================================================================
// AUTH: JWT + Cookie HttpOnly pour l'espace revendeur (grossiste)
// ============================================================================
// - Le JWT est valable 2 jours et vit dans un cookie HttpOnly ("wholesaler_token").
// - "Quitter le panneau" (bouton Déconnexion du dashboard) ne touche PAS au cookie :
//   c'est juste une navigation front-end vers la boutique. Le revendeur reste connecté.
// - "Déconnexion complète" (paramètres du compte) supprime le cookie ET révoque le
//   token (jti) côté serveur, pour empêcher sa réutilisation même s'il a été copié.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
if (!process.env.JWT_SECRET) {
  console.warn(
    "[AUTH WARNING] JWT_SECRET n'est pas défini dans les variables d'environnement. " +
    "Une clé de développement non sécurisée est utilisée. Définissez JWT_SECRET en production."
  );
}
const WHOLESALER_TOKEN_COOKIE = "wholesaler_token";
const WHOLESALER_TOKEN_TTL_SECONDS = 2 * 24 * 60 * 60; // 2 jours

function signWholesalerToken(wholesalerId: string): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { sub: wholesalerId, jti },
    JWT_SECRET,
    { expiresIn: WHOLESALER_TOKEN_TTL_SECONDS }
  );
}

function wholesalerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
    sameSite: "lax" as const,
    maxAge: WHOLESALER_TOKEN_TTL_SECONDS * 1000,
    path: "/"
  };
}

async function isTokenRevoked(jti: string): Promise<boolean> {
  const db = await readDB();
  const list = db.revokedTokens || [];
  const nowSeconds = Math.floor(Date.now() / 1000);
  return list.some(t => t.jti === jti && t.exp > nowSeconds);
}

async function revokeToken(jti: string, exp: number) {
  const db = await readDB();
  if (!db.revokedTokens) db.revokedTokens = [];
  const nowSeconds = Math.floor(Date.now() / 1000);
  // On profite de l'opération pour nettoyer les entrées déjà expirées.
  db.revokedTokens = db.revokedTokens.filter(t => t.exp > nowSeconds);
  db.revokedTokens.push({ jti, exp });
  await writeDB(db);
}

// Middleware : protège les routes de l'espace revendeur.
// Si le cookie JWT est valide et non révoqué, la session est restaurée
// automatiquement (pas de ressaisie des identifiants).
async function requireWholesalerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies?.[WHOLESALER_TOKEN_COOKIE];
  if (!token) {
    return res.status(401).json({ error: "Non autorisé." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; jti: string; exp: number };
    if (await isTokenRevoked(payload.jti)) {
      res.clearCookie(WHOLESALER_TOKEN_COOKIE, wholesalerCookieOptions());
      return res.status(401).json({ error: "Session invalidée. Veuillez vous reconnecter." });
    }
    (req as any).wholesalerId = payload.sub;
    (req as any).tokenJti = payload.jti;
    (req as any).tokenExp = payload.exp;
    next();
  } catch (err) {
    res.clearCookie(WHOLESALER_TOKEN_COOKIE, wholesalerCookieOptions());
    return res.status(401).json({ error: "Session expirée. Veuillez vous reconnecter." });
  }
}

function sanitizeWholesaler(w: Wholesaler): Wholesaler {
  const { password, ...safe } = w as any;
  return safe;
}

// ============================================================================
// AUTH: JWT + Cookie HttpOnly pour le PANNEAU ADMINISTRATEUR
// ============================================================================
// Remplace l'ancien système où le mot de passe admin était écrit en clair
// dans le code envoyé au navigateur (visible par n'importe qui via les
// DevTools) et où AUCUNE route /api/admin/* ne vérifiait quoi que ce soit
// côté serveur. Maintenant : identifiants dans des variables d'environnement
// (jamais exposées au client), JWT signé + cookie HttpOnly, et chaque route
// admin passe par le middleware requireAdminAuth ci-dessous.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn(
    "[ADMIN AUTH WARNING] ADMIN_USERNAME / ADMIN_PASSWORD ne sont pas définis dans les " +
    "variables d'environnement. La connexion au panneau administrateur sera refusée " +
    "tant qu'elles ne sont pas configurées. Définissez-les dans les paramètres Vercel."
  );
}
const ADMIN_TOKEN_COOKIE = "admin_token";
const ADMIN_TOKEN_TTL_SECONDS = 2 * 24 * 60 * 60; // 2 jours

function signAdminToken(): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { role: "admin", jti },
    JWT_SECRET,
    { expiresIn: ADMIN_TOKEN_TTL_SECONDS }
  );
}

function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
    sameSite: "lax" as const,
    maxAge: ADMIN_TOKEN_TTL_SECONDS * 1000,
    path: "/"
  };
}

// Protège toutes les routes /api/admin/*. Sans cookie admin_token valide
// et non révoqué, la requête est rejetée AVANT d'atteindre la logique métier.
async function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies?.[ADMIN_TOKEN_COOKIE];
  if (!token) {
    return res.status(401).json({ error: "Accès administrateur non autorisé." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role: string; jti: string; exp: number };
    if (payload.role !== "admin" || await isTokenRevoked(payload.jti)) {
      res.clearCookie(ADMIN_TOKEN_COOKIE, adminCookieOptions());
      return res.status(401).json({ error: "Session administrateur invalidée. Veuillez vous reconnecter." });
    }
    next();
  } catch (err) {
    res.clearCookie(ADMIN_TOKEN_COOKIE, adminCookieOptions());
    return res.status(401).json({ error: "Session administrateur expirée. Veuillez vous reconnecter." });
  }
}

// ----------------------------------------------------------------------------
// RATE LIMITING (anti brute-force) — protège les routes de login (admin +
// revendeur) contre les tentatives répétées de deviner un mot de passe.
// Utilise Redis (partagé entre toutes les instances serverless) ; si Redis
// n'est pas configuré (dev local sans Upstash), la limitation est ignorée.
// ----------------------------------------------------------------------------
function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

async function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!redis) return { allowed: true, retryAfterSeconds: 0 }; // pas de Redis en dev local : pas de limitation
  const rlKey = `ratelimit:${key}`;
  try {
    const current = await redis.incr(rlKey);
    if (current === 1) {
      await redis.expire(rlKey, windowSeconds);
    }
    if (current > maxAttempts) {
      const ttl = await redis.ttl(rlKey);
      return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.error("Rate limit check failed, allowing request:", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

// Default Seed Data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "dino",
    name: "Dino IPTV",
    type: "iptv",
    priceRetail: 4900,
    priceWholesale: 4200,
    description: "Le serveur incontournable pour les foyers algériens. Excellent rapport qualité/prix avec toutes les chaînes françaises, arabes, beIN Sports, et Canal+.",
    features: [
      "Plus de 12,000 chaînes Live",
      "Qualité FHD / HD / SD stable",
      "VOD Films & Séries incluses (Mises à jour)",
      "Chaînes Algériennes et Arabes complètes",
      "Idéal pour connexions moyennes (à partir de 8 Mbps)"
    ],
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=300",
    isPopular: false
  },
  {
    id: "8k",
    name: "8K Premium IPTV",
    type: "iptv",
    priceRetail: 7500,
    priceWholesale: 6800,
    description: "Le serveur ultime pour les connexions ultra-rapides (Fibre/ADSL 20M+). Bitrate extrêmement élevé, latence minimale, idéal pour les grands matchs en direct.",
    features: [
      "Chaînes sportives en 50 FPS (sans saccades)",
      "Qualité Ultra HD (4K authentique)",
      "Système anti-buffering de pointe",
      "Assistance VIP et serveurs de secours",
      "Recommandé pour Smart TV haut de gamme"
    ],
    imageUrl: "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=300",
    isPopular: true
  },
  {
    id: "v12",
    name: "V12 IPTV Pro",
    type: "iptv",
    priceRetail: 5000,
    priceWholesale: 4300,
    description: "Un serveur très populaire en Algérie réputé pour sa rapidité de zapping et son immense catalogue de films et séries en français et arabe.",
    features: [
      "Zapping ultra-rapide (< 1 seconde)",
      "VOD gigantesque (Netflix, Disney, Amazon Prime clones)",
      "Multi-langues audio et sous-titres",
      "Compatible tous boîtiers et applications",
      "Support technique 24/7"
    ],
    imageUrl: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=300",
    isPopular: false
  },
  {
    id: "golden-ott",
    name: "Golden OTT IPTV",
    type: "iptv",
    priceRetail: 7000,
    priceWholesale: 6200,
    description: "Le serveur haut de gamme par excellence. Très stable lors des grands événements sportifs avec un panel de chaînes internationales unique.",
    features: [
      "Stabilité absolue pendant la Coupe du Monde / Ligue des Champions",
      "Chaînes VIP et d'autres pays d'Europe",
      "Espace VOD premium en qualité Blu-ray",
      "Replay de 7 jours sur les chaînes majeures",
      "Fichiers M3U, codes Xtream et portail MAG"
    ],
    imageUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=300",
    isPopular: false
  },
  {
    id: "mibox-s",
    name: "Xiaomi Mi Box S 2nd Gen 4K",
    type: "device",
    priceRetail: 9500,
    priceWholesale: 8900,
    description: "La box Android officielle certifiée par Google et Netflix. Transforme n'importe quelle télévision en Smart TV ultra performante.",
    features: [
      "Système d'exploitation Google TV",
      "Résolution 4K Ultra HD & Dolby Vision",
      "2 Go RAM + 8 Go Stockage",
      "Télécommande vocale avec Google Assistant",
      "Idéal pour installer les applications IPTV"
    ],
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1605464315542-bda3e2f4e605?auto=format&fit=crop&q=80&w=300",
    isPopular: true
  },
  {
    id: "firestick-4k",
    name: "Amazon Fire TV Stick 4K",
    type: "device",
    priceRetail: 11000,
    priceWholesale: 10200,
    description: "La clé de streaming d'Amazon compacte et extrêmement fluide. Profitez d'une rapidité d'affichage exceptionnelle.",
    features: [
      "Format clé HDMI discret",
      "Processeur ultra-rapide optimisé IPTV",
      "Compatible Wi-Fi 6 pour moins de saccades",
      "Télécommande avec boutons de raccourcis",
      "Téléchargement d'applications tiers facile (Downloader)"
    ],
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=300",
    isPopular: false
  },
  {
    id: "carte-adsl-500",
    name: "Carte ADSL Idoom 500 DA",
    type: "adsl",
    priceRetail: 500,
    priceWholesale: 480,
    description: "Recharge internet haut débit Algérie Télécom Idoom ADSL/Fibre. Obtenez votre code de recharge instantanément après validation par l'administrateur.",
    features: [
      "Compatible ADSL / VDSL / Fibre Idoom",
      "Valeur de recharge : 500 DA",
      "Livraison ultra rapide du code secret (5 minutes)",
      "Recharge par téléphone ou site officiel Algérie Télécom"
    ],
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=300",
    isPopular: false
  },
  {
    id: "carte-adsl-1000",
    name: "Carte ADSL Idoom 1000 DA",
    type: "adsl",
    priceRetail: 1000,
    priceWholesale: 950,
    description: "Recharge internet haut débit Algérie Télécom Idoom ADSL/Fibre. Augmentez votre volume et prolongez votre abonnement en quelques minutes.",
    features: [
      "Compatible ADSL / VDSL / Fibre Idoom",
      "Valeur de recharge : 1000 DA",
      "Code secret envoyé directement par SMS/Email",
      "Aucun frais supplémentaire"
    ],
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=300",
    isPopular: true
  },
  {
    id: "carte-adsl-2000",
    name: "Carte ADSL Idoom 2000 DA",
    type: "adsl",
    priceRetail: 2000,
    priceWholesale: 1900,
    description: "Idéal pour les recharges mensuelles Idoom ADSL/Fibre. Profitez d'une connexion continue sans coupure.",
    features: [
      "Compatible ADSL / VDSL / Fibre Idoom",
      "Valeur de recharge : 2000 DA",
      "Support technique gratuit pour la recharge",
      "Paiement simple via BaridiMob ou CCP"
    ],
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=300",
    imageUrl2: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=300",
    isPopular: false
  }
];

const DEFAULT_TUTORIALS: VideoTutorial[] = [
  {
    id: "tut-1",
    title: "Comment Installer Dino IPTV sur Smart TV (NetIPTV/SmartOne)",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Tutoriel pas-à-pas pour configurer votre abonnement Dino IPTV sur n'importe quelle Smart TV LG ou Samsung en utilisant l'application SmartOne ou NetIPTV.",
    category: "smart_tv",
    downloaderCode: "283749",
    createdAt: new Date().toISOString()
  },
  {
    id: "tut-2",
    title: "Configuration de V12 IPTV sur Firestick via Downloader",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Utilisez l'application Downloader pour installer notre application officielle sur Firestick. Code Downloader AFTVnews fourni ci-dessous.",
    category: "firestick",
    downloaderCode: "719361",
    createdAt: new Date().toISOString()
  },
  {
    id: "tut-3",
    title: "Installation sur Boîtier Android Box (Mi Box / Xiaomi)",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Comment configurer votre abonnement en installant l'application IPTV Smarters Pro sur votre Xiaomi Mi Box S.",
    category: "android",
    downloaderCode: "948231",
    createdAt: new Date().toISOString()
  }
];

interface DBStructure {
  products: Product[];
  wholesalers: Wholesaler[];
  clients: IptvClient[];
  orders: Order[];
  creditRequests: CreditRequest[];
  notifications: EmailNotification[];
  tutorials: VideoTutorial[];
  livreurs: Livreur[];
  catalogCategories: CatalogCategory[];
  panelRequests: PanelRequest[];
  revokedTokens?: { jti: string; exp: number }[];
  bouquetLinks?: ServerBouquetLinks;
}

// Read database
async function readDB(): Promise<DBStructure> {
  try {
    const raw = await storageReadRaw();
    if (!raw) {
      const initialDB: DBStructure = {
        products: DEFAULT_PRODUCTS,
        wholesalers: [
          {
            id: "w-dino-pro",
            username: "dino_pro",
            businessName: "Dino Pro Oran",
            phone: "0550123456",
            email: "dino.oran@gmail.com",
            status: "approved",
            creditBalance: 15400,
            createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: "w-kamal-sat",
            username: "kamal_sat",
            businessName: "Kamal Sat Alger",
            phone: "0661987654",
            email: "kamal.sat@yahoo.fr",
            status: "pending",
            creditBalance: 0,
            createdAt: new Date().toISOString()
          }
        ],
        clients: [
          {
            id: "c-1",
            wholesalerId: "w-dino-pro",
            clientName: "Mohamed Belkaid",
            server: "Dino",
            durationMonths: 12,
            pricePaid: 4200,
            activationDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
            expirationDate: new Date(Date.now() + 360 * 24 * 3600 * 1000).toISOString(),
            status: "active",
            notes: "Configuré sur Smart TV Samsung via SmartOne",
            credentials: {
              m3uUrl: "http://dino-server.xyz:8080/get.php?auth=demo1&pass=test1",
              xtreamUser: "demo1",
              xtreamPass: "test1",
              xtreamHost: "http://dino-server.xyz:8080"
            }
          }
        ],
        orders: [
          {
            id: "o-1",
            customerName: "Sofiane Yahiaoui",
            customerEmail: "sofiane.yah@gmail.com",
            customerPhone: "0770554433",
            productId: "mibox-s",
            productName: "Xiaomi Mi Box S 2nd Gen 4K",
            productType: "device",
            priceDA: 9500,
            paymentMethod: "baridimob",
            paymentDetails: "Virement BaridiMob RIP: 007999990022334455, ID trans: 450123",
            status: "pending",
            createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
            deliveryStatus: "pending"
          },
          {
            id: "o-2",
            customerName: "Riad Mahrez",
            customerEmail: "riad.m@outlook.com",
            customerPhone: "0555221199",
            productId: "8k",
            productName: "8K Premium IPTV (12 Mois)",
            productType: "iptv",
            priceDA: 7500,
            paymentMethod: "card",
            paymentDetails: "Payé par Carte CIB / Dahabia",
            status: "completed",
            createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
          }
        ],
        creditRequests: [
          {
            id: "cr-1",
            wholesalerId: "w-dino-pro",
            wholesalerName: "Dino Pro Oran",
            amountDA: 20000,
            paymentMethod: "baridimob",
            receiptReference: "BaridiMob Trans #881290",
            status: "approved",
            createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: "cr-2",
            wholesalerId: "w-dino-pro",
            wholesalerName: "Dino Pro Oran",
            amountDA: 15000,
            paymentMethod: "ccp",
            receiptReference: "Mandat CCP #99120",
            status: "pending",
            createdAt: new Date().toISOString()
          }
        ],
        notifications: [
          {
            id: "n-1",
            to: "fares200976@gmail.com",
            subject: "Nouveau grossiste inscrit : Kamal Sat Alger",
            body: "Le grossiste 'Kamal Sat Alger' (Kamal Sat Alger) s'est inscrit. Téléphone: 0661987654. Veuillez vérifier ses informations et approuver son compte.",
            sentAt: new Date().toISOString(),
            read: false,
            type: "new_wholesaler"
          },
          {
            id: "n-2",
            to: "fares200976@gmail.com",
            subject: "Nouvelle commande détail reçue : Xiaomi Mi Box S",
            body: "Client Sofiane Yahiaoui (0770554433) a commandé : Xiaomi Mi Box S 2nd Gen 4K. Mode de paiement: BaridiMob. Détails: Virement BaridiMob RIP: 007999990022334455, ID trans: 450123",
            sentAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
            read: true,
            type: "new_order"
          }
        ],
        tutorials: DEFAULT_TUTORIALS,
        livreurs: [
          {
            id: "liv-1",
            name: "Sofiane Livreur Alger",
            phone: "0550112233",
            wilaya: "Alger, Blida, Boumerdes",
            status: "active",
            createdAt: new Date().toISOString()
          },
          {
            id: "liv-2",
            name: "Amine Livreur Oran",
            phone: "0661998877",
            wilaya: "Oran, Tlemcen, Mostaganem",
            status: "active",
            createdAt: new Date().toISOString()
          }
        ],
        catalogCategories: [
          { id: "cat-iptv", name: "Abonnements IPTV Premium" },
          { id: "cat-device", name: "Boîtiers Android & Récepteurs" },
          { id: "cat-adsl", name: "Recharges ADSL & Fibre" }
        ],
        panelRequests: [],
        revokedTokens: [],
        bouquetLinks: {}
      };
      await storageWriteRaw(JSON.stringify(initialDB, null, 2));
      return initialDB;
    }
    const parsed = JSON.parse(raw);
    let changed = false;
    if (!parsed.tutorials) {
      parsed.tutorials = DEFAULT_TUTORIALS;
      changed = true;
    }
    if (!parsed.livreurs) {
      parsed.livreurs = [
        {
          id: "liv-1",
          name: "Sofiane Livreur Alger",
          phone: "0550112233",
          wilaya: "Alger, Blida, Boumerdes",
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: "liv-2",
          name: "Amine Livreur Oran",
          phone: "0661998877",
          wilaya: "Oran, Tlemcen, Mostaganem",
          status: "active",
          createdAt: new Date().toISOString()
        }
      ];
      changed = true;
    }
    if (!parsed.catalogCategories) {
      parsed.catalogCategories = [
        { id: "cat-iptv", name: "Abonnements IPTV Premium" },
        { id: "cat-device", name: "Boîtiers Android & Récepteurs" },
        { id: "cat-adsl", name: "Recharges ADSL & Fibre" }
      ];
      changed = true;
    }
    if (!parsed.panelRequests) {
      parsed.panelRequests = [];
      changed = true;
    }
    if (!parsed.revokedTokens) {
      parsed.revokedTokens = [];
      changed = true;
    }
    if (!parsed.bouquetLinks) {
      parsed.bouquetLinks = {};
      changed = true;
    }
    if (changed) {
      await storageWriteRaw(JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error("Error reading database, using fallback mock database:", err);
    return {
      products: DEFAULT_PRODUCTS,
      wholesalers: [],
      clients: [],
      orders: [],
      creditRequests: [],
      notifications: [],
      tutorials: DEFAULT_TUTORIALS,
      livreurs: [],
      catalogCategories: [
        { id: "cat-iptv", name: "Abonnements IPTV Premium" },
        { id: "cat-device", name: "Boîtiers Android & Récepteurs" },
        { id: "cat-adsl", name: "Recharges ADSL & Fibre" }
      ],
      panelRequests: [],
      revokedTokens: [],
      bouquetLinks: {}
    };
  }
}

// Write database
async function writeDB(data: DBStructure) {
  try {
    await storageWriteRaw(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

const ALERT_EMAIL = "fares200976@gmail.com";
const ALERT_WHATSAPP = "00213667719761";

// Send Admin Email and WhatsApp Simulation Helper
async function sendAdminEmail(subject: string, body: string, type: EmailNotification['type']) {
  const db = await readDB();
  const fullBody = `${body}\n\n[Notification WhatsApp envoyée automatiquement au numéro ${ALERT_WHATSAPP}]`;

  const newEmail: EmailNotification = {
    id: "n-" + Math.random().toString(36).substr(2, 9),
    to: ALERT_EMAIL,
    subject,
    body: fullBody,
    sentAt: new Date().toISOString(),
    read: false,
    type
  };
  db.notifications.unshift(newEmail);
  await writeDB(db);
  console.log(`[ALERT SYSTEM] Email alert sent to ${ALERT_EMAIL}\nSubject: ${subject}\nBody: ${fullBody}\n---`);
  console.log(`[WHATSAPP ALERT] WhatsApp alert dispatched to ${ALERT_WHATSAPP} successfully.\n---`);
}

// ==========================================
// API ROUTES
// ==========================================

// Get Products
app.get("/api/products", async (req, res) => {
  const db = await readDB();
  res.json(db.products);
});

// --- CATALOG CATEGORY ENDPOINTS ---
app.get("/api/catalog-categories", async (req, res) => {
  const db = await readDB();
  res.json(db.catalogCategories || []);
});

app.post("/api/admin/catalog-categories", requireAdminAuth, async (req, res) => {
  const { name, description, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom du catalogue est requis." });
  const db = await readDB();
  const newCat: CatalogCategory = {
    id: "cat-" + Math.random().toString(36).substr(2, 9),
    name,
    description: description || "",
    icon: icon || "Tv",
    color: color || "indigo"
  };
  if (!db.catalogCategories) db.catalogCategories = [];
  db.catalogCategories.push(newCat);
  await writeDB(db);
  res.json(newCat);
});

app.put("/api/admin/catalog-categories/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom du catalogue est requis." });
  const db = await readDB();
  const cat = db.catalogCategories?.find(c => c.id === id);
  if (!cat) return res.status(404).json({ error: "Catalogue introuvable." });
  cat.name = name;
  if (description !== undefined) cat.description = description;
  if (icon !== undefined) cat.icon = icon;
  if (color !== undefined) cat.color = color;
  await writeDB(db);
  res.json(cat);
});

app.delete("/api/admin/catalog-categories/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.catalogCategories = (db.catalogCategories || []).filter(c => c.id !== id);
  await writeDB(db);
  res.json({ success: true });
});

// --- PANEL REQUEST ENDPOINTS ---
app.get("/api/wholesaler/panel-requests", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;
  const db = await readDB();
  const reqs = (db.panelRequests || []).filter(r => r.wholesalerId === wholesalerId);
  res.json(reqs);
});

app.post("/api/wholesaler/panel-requests", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;
  const { server, codesCount, notes } = req.body;
  if (!server || !codesCount) return res.status(400).json({ error: "Serveur et quantité requis." });

  const count = Number(codesCount);
  if (count < 10) {
    return res.status(400).json({ error: "Le nombre de codes minimum requis pour la création d'un panel est de 10 codes." });
  }

  const db = await readDB();
  const wholesaler = db.wholesalers.find(w => w.id === wholesalerId);
  if (!wholesaler) return res.status(404).json({ error: "Revendeur introuvable." });

  const newRequest: PanelRequest = {
    id: "pr-" + Math.random().toString(36).substr(2, 9),
    wholesalerId,
    wholesalerName: wholesaler.businessName,
    server,
    codesCount: count,
    notes: notes || "",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  if (!db.panelRequests) db.panelRequests = [];
  db.panelRequests.push(newRequest);
  await writeDB(db);

  try {
    await sendAdminEmail(
      `Nouvelle demande de panel revendeur par ${wholesaler.businessName}`,
      `Le revendeur grossiste '${wholesaler.businessName}' a soumis une demande de création de panel revendeur.\n\n` +
      `- Serveur IPTV: ${server}\n` +
      `- Quantité de codes demandés (min 10): ${count} codes\n` +
      `- Notes / Message: ${notes || "Aucun message"}\n\n` +
      `Veuillez vous connecter à l'administration de KURTAL IPTV pour valider et configurer ce panel.`,
      "panel_request"
    );
  } catch (err) {
    console.error("Error sending admin email notification:", err);
  }

  res.json(newRequest);
});

app.get("/api/admin/panel-requests", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.panelRequests || []);
});

app.put("/api/admin/panel-requests/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  if (!status) return res.status(400).json({ error: "Le statut est requis." });

  const db = await readDB();
  const reqItem = db.panelRequests?.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: "Demande de panel introuvable." });

  reqItem.status = status;
  if (notes !== undefined) reqItem.notes = notes;

  await writeDB(db);
  res.json(reqItem);
});

// Reset database to default
app.post("/api/admin/reset", requireAdminAuth, async (req, res) => {
  try {
    await storageDeleteRaw();
    const db = await readDB();
    res.json({ message: "Base de données réinitialisée avec succès.", db });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wholesaler Registration
app.post("/api/auth/wholesaler/register", async (req, res) => {
  try {
    const { username, password, businessName, phone, email } = req.body;
    if (!username || !password || !businessName || !phone || !email) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const db = await readDB();
    if (!db.wholesalers) {
      db.wholesalers = [];
    }

    const exists = db.wholesalers.some(
      w => (w.username || "").toLowerCase() === username.toLowerCase() || (w.email || "").toLowerCase() === email.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({ error: "Ce nom d'utilisateur ou cet email est déjà enregistré." });
    }

    const newWholesaler: any = {
      id: "w-" + Math.random().toString(36).substr(2, 9),
      username,
      password: bcrypt.hashSync(password, 10),
      businessName,
      phone,
      email,
      status: "pending",
      creditBalance: 0,
      createdAt: new Date().toISOString()
    };

    db.wholesalers.push(newWholesaler);
    await writeDB(db);

    try {
      await sendAdminEmail(
        `Nouveau grossiste inscrit : ${businessName}`,
        `Un nouveau grossiste s'est inscrit sur la plateforme !\n\n` +
        `- Nom d'utilisateur: ${username}\n` +
        `- Nom de l'entreprise: ${businessName}\n` +
        `- Téléphone: ${phone}\n` +
        `- Email: ${email}\n` +
        `- Statut: En attente d'approbation\n\n` +
        `Veuillez vous connecter à l'administration pour valider son compte et lui accorder ses premiers crédits.`,
        "new_wholesaler"
      );
    } catch (emailErr) {
      console.error("Error sending admin notification email:", emailErr);
    }

    res.json({
      message: "Inscription réussie ! Votre compte est en attente d'approbation par l'administrateur.",
      wholesaler: sanitizeWholesaler(newWholesaler)
    });
  } catch (err: any) {
    console.error("Error in wholesaler register:", err);
    res.status(500).json({ error: err.message || "Une erreur est survenue lors de l'inscription." });
  }
});

// Wholesaler Login
app.post("/api/auth/wholesaler/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
    }

    // Anti brute-force : max 8 tentatives / 10 minutes, par IP + nom d'utilisateur.
    const rl = await checkRateLimit(`wholesaler-login:${getClientIp(req)}:${username.toLowerCase()}`, 8, 10 * 60);
    if (!rl.allowed) {
      return res.status(429).json({ error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` });
    }

    const db = await readDB();
    if (!db.wholesalers) {
      db.wholesalers = [];
    }

    const wholesaler = db.wholesalers.find(
      w => (w.username || "").toLowerCase() === username.toLowerCase()
    );

    if (!wholesaler) {
      return res.status(401).json({ error: "Identifiants invalides." });
    }

    if (wholesaler.password) {
      const isBcryptHash = wholesaler.password.startsWith("$2a$") || wholesaler.password.startsWith("$2b$") || wholesaler.password.startsWith("$2y$");
      if (isBcryptHash) {
        if (!bcrypt.compareSync(password, wholesaler.password)) {
          return res.status(401).json({ error: "Mot de passe incorrect." });
        }
      } else {
        // Compte créé avant la mise en place du hash : on compare en clair une
        // dernière fois, puis on migre silencieusement vers un hash bcrypt.
        if (wholesaler.password !== password) {
          return res.status(401).json({ error: "Mot de passe incorrect." });
        }
        wholesaler.password = bcrypt.hashSync(password, 10);
        await writeDB(db);
      }
    }

    if (wholesaler.status === "pending") {
      return res.status(403).json({ error: "Votre compte est toujours en attente d'approbation par l'administrateur." });
    }

    if (wholesaler.status === "suspended") {
      return res.status(403).json({ error: "Votre compte grossiste a été suspendu par l'administration." });
    }

    const token = signWholesalerToken(wholesaler.id);
    res.cookie(WHOLESALER_TOKEN_COOKIE, token, wholesalerCookieOptions());

    res.json({
      message: "Connexion réussie.",
      wholesaler: sanitizeWholesaler(wholesaler)
    });
  } catch (err: any) {
    console.error("Error in wholesaler login:", err);
    res.status(500).json({ error: err.message || "Une erreur est survenue lors de la connexion." });
  }
});

// Vérifie si une session revendeur valide existe déjà (cookie JWT) et restaure
// automatiquement le profil, sans ressaisie des identifiants. Utilisé au
// chargement de l'app pour reconnecter silencieusement le revendeur.
app.get("/api/auth/wholesaler/session", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;
  const db = await readDB();
  const wholesaler = db.wholesalers.find(w => w.id === wholesalerId);
  if (!wholesaler) {
    return res.status(404).json({ error: "Grossiste introuvable." });
  }
  res.json({ wholesaler: sanitizeWholesaler(wholesaler) });
});

// Déconnexion COMPLÈTE : révoque le token et supprime le cookie.
// À la différence de "quitter le panneau" (front-end only), ceci force une
// reconnexion avec identifiant + mot de passe.
app.post("/api/auth/wholesaler/logout-complete", async (req, res) => {
  const token = req.cookies?.[WHOLESALER_TOKEN_COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { jti: string; exp: number };
      await revokeToken(payload.jti, payload.exp);
    } catch (err) {
      // Token déjà invalide/expiré : rien à révoquer, on nettoie simplement le cookie.
    }
  }
  res.clearCookie(WHOLESALER_TOKEN_COOKIE, wholesalerCookieOptions());
  res.json({ message: "Déconnexion complète effectuée." });
});

// ============================================================================
// AUTH ADMIN — remplace l'ancien contrôle d'accès purement client-side.
// ============================================================================
app.post("/api/auth/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
  }

  // Anti brute-force : max 5 tentatives / 15 minutes, par IP.
  const rl = await checkRateLimit(`admin-login:${getClientIp(req)}`, 5, 15 * 60);
  if (!rl.allowed) {
    return res.status(429).json({ error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).` });
  }

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res.status(503).json({ error: "Le panneau administrateur n'est pas configuré (identifiants manquants côté serveur)." });
  }

  if (username.trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase() || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
  }

  const token = signAdminToken();
  res.cookie(ADMIN_TOKEN_COOKIE, token, adminCookieOptions());
  res.json({ message: "Connexion administrateur réussie." });
});

// Reconnexion automatique au panneau admin tant que le cookie est valide
// (même logique que pour l'espace revendeur).
app.get("/api/auth/admin/session", requireAdminAuth, async (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/admin/logout-complete", async (req, res) => {
  const token = req.cookies?.[ADMIN_TOKEN_COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { jti: string; exp: number };
      await revokeToken(payload.jti, payload.exp);
    } catch (err) {
      // Token déjà invalide/expiré : rien à révoquer.
    }
  }
  res.clearCookie(ADMIN_TOKEN_COOKIE, adminCookieOptions());
  res.json({ message: "Déconnexion administrateur effectuée." });
});

// Get Wholesaler Profile
app.get("/api/wholesaler/profile", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;

  const db = await readDB();
  const wholesaler = db.wholesalers.find(w => w.id === wholesalerId);
  if (!wholesaler) {
    return res.status(404).json({ error: "Grossiste introuvable." });
  }

  res.json(sanitizeWholesaler(wholesaler));
});

// Get Wholesaler Clients
app.get("/api/wholesaler/clients", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;

  const db = await readDB();
  const clients = db.clients.filter(c => c.wholesalerId === wholesalerId);
  res.json(clients);
});

// Wholesaler Activate / Add Client (INSTANT ACTIVATION) — IPTV, Code Sat ou Box Android
app.post("/api/wholesaler/clients", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;
  const { clientName, server, durationMonths, notes, serviceType, productId, adultContent } = req.body;
  const type: "iptv" | "sat" | "box" = serviceType === "sat" || serviceType === "box" ? serviceType : "iptv";

  if (!clientName) {
    return res.status(400).json({ error: "Le nom du client est requis." });
  }

  const db = await readDB();
  const wholesaler = db.wholesalers.find(w => w.id === wholesalerId);
  if (!wholesaler) {
    return res.status(404).json({ error: "Grossiste introuvable." });
  }

  // ------------------------------------------------------------------
  // IPTV : comportement historique inchangé (serveur parmi Dino/8K/V12/Golden OTT)
  // ------------------------------------------------------------------
  if (type === "iptv") {
    if (!server || !durationMonths) {
      return res.status(400).json({ error: "Nom, serveur et durée requis." });
    }

    const product = db.products.find(p => p.name.toLowerCase().includes(server.toLowerCase()) && p.type === "iptv");
    if (!product) {
      return res.status(400).json({ error: "Serveur IPTV invalide." });
    }

    let pricePaid = product.priceWholesale;
    if (durationMonths === 1) {
      pricePaid = Math.round(product.priceWholesale * 0.15);
    } else if (durationMonths === 6) {
      pricePaid = Math.round(product.priceWholesale * 0.60);
    } else if (durationMonths === 12) {
      pricePaid = product.priceWholesale;
    }

    if (wholesaler.creditBalance < pricePaid) {
      return res.status(400).json({
        error: `Crédit insuffisant. Cette activation coûte ${pricePaid} DA. Votre solde actuel est de ${wholesaler.creditBalance} DA. Veuillez recharger votre solde.`
      });
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const username = `kt_${server.toLowerCase().replace(/[^a-z0-9]/g, "")}_${randomSuffix}`;
    const password = Math.random().toString(36).substring(2, 10);

    let host = "http://kurtal-server.xyz:8080";
    // Clé de lookup pour bouquetLinks : "dino", "8k" ou "golden ott" (cf. ADULT_CONTENT_SERVERS ci-dessous)
    let bouquetKey = "";
    if (server.toLowerCase().includes("dino")) {
      host = "http://line.dino.dndscloud.ru";
      bouquetKey = "dino";
    } else if (server.toLowerCase().includes("8k")) {
      host = "http://tv.business-cnd-8k.com";
      bouquetKey = "8k";
    } else if (server.toLowerCase().includes("v12")) {
      host = "http://ulimate.cx";
    } else if (server.toLowerCase().includes("golden")) {
      host = "http://ejzce.aldoccecelai.org";
      bouquetKey = "golden ott";
    }

    // Option "Contenu Adulte" : uniquement pertinente pour Dino / 8K / Golden OTT.
    const supportsAdultToggle = !!bouquetKey;
    const finalAdultContent = supportsAdultToggle ? !!adultContent : undefined;
    const bouquetLink = bouquetKey ? (db.bouquetLinks?.[bouquetKey] || "") : "";

    const m3uUrl = `${host}/get.php?username=${username}&password=${password}&output=ts`;

    const activationDate = new Date();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + Number(durationMonths));

    const newClient: IptvClient = {
      id: "c-" + Math.random().toString(36).substr(2, 9),
      wholesalerId,
      clientName,
      serviceType: "iptv",
      server: server as any,
      durationMonths: Number(durationMonths),
      pricePaid,
      activationDate: activationDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      status: "active",
      notes: notes || "",
      adultContent: finalAdultContent,
      credentials: {
        m3uUrl,
        xtreamUser: username,
        xtreamPass: password,
        xtreamHost: host,
        bouquetLink: bouquetLink || undefined
      }
    };

    wholesaler.creditBalance -= pricePaid;
    db.clients.push(newClient);
    await writeDB(db);

    try {
      await sendAdminEmail(
        `Activation IPTV instantanée par ${wholesaler.businessName} : ${clientName}`,
        `Le revendeur grossiste '${wholesaler.businessName}' a activé instantanément un abonnement IPTV.\n\n` +
        `- Client: ${clientName}\n` +
        `- Serveur: ${server}\n` +
        `- Durée: ${durationMonths} Mois\n` +
        `- Prix: ${pricePaid} DA (déduit de son solde)\n` +
        `- Identifiant: ${username}\n` +
        `- Mot de passe: ${password}\n` +
        `- Lien M3U: ${m3uUrl}\n` +
        (supportsAdultToggle ? `- Contenu Adulte: ${finalAdultContent ? "Oui" : "Non"}\n` : ``) +
        (bouquetLink ? `- Lien gestion des bouquets: ${bouquetLink}\n` : ``) +
        `- Nouveau solde du revendeur: ${wholesaler.creditBalance} DA\n\n` +
        `L'activation a été effectuée de manière 100% autonome et instantanée. Les codes d'accès ont été générés pour le revendeur.`,
        "client_activation"
      );
    } catch (err) {
      console.error("Error sending admin notification email:", err);
    }

    return res.json({
      message: `Activation effectuée de manière 100% autonome et instantanée ! Les codes d'accès ont été générés avec succès. ${pricePaid} DA ont été déduits de votre crédit.`,
      client: newClient,
      newBalance: wholesaler.creditBalance
    });
  }

  // ------------------------------------------------------------------
  // CODE SAT / BOX ANDROID : sélection d'un produit du catalogue (ajouté
  // par l'admin), prix fixe du tarif grossiste, pas de multiplicateur de durée.
  // ------------------------------------------------------------------
  if (!productId) {
    return res.status(400).json({ error: "Veuillez sélectionner un produit dans le catalogue." });
  }

  const expectedCatalogType = type === "sat" ? "code sat" : "boitier android";
  const product = db.products.find(p => p.id === productId && (p.type === expectedCatalogType || p.type === "device"));
  if (!product) {
    return res.status(400).json({ error: "Produit introuvable ou type invalide." });
  }

  const pricePaid = product.priceWholesale;
  if (wholesaler.creditBalance < pricePaid) {
    return res.status(400).json({
      error: `Crédit insuffisant. Cette activation coûte ${pricePaid} DA. Votre solde actuel est de ${wholesaler.creditBalance} DA. Veuillez recharger votre solde.`
    });
  }

  const activationDate = new Date();
  const expirationDate = new Date();
  // Code Sat : durée choisie (par défaut 12 mois). Box Android : pas d'expiration
  // réelle (vente matérielle), on fixe une échéance très lointaine pour ne pas
  // apparaître comme "expiré" dans les tableaux de suivi.
  if (type === "sat") {
    expirationDate.setMonth(expirationDate.getMonth() + Number(durationMonths || 12));
  } else {
    expirationDate.setFullYear(expirationDate.getFullYear() + 50);
  }

  const newClient: IptvClient = {
    id: "c-" + Math.random().toString(36).substr(2, 9),
    wholesalerId,
    clientName,
    serviceType: type,
    server: product.name,
    durationMonths: type === "sat" ? Number(durationMonths || 12) : 0,
    pricePaid,
    activationDate: activationDate.toISOString(),
    expirationDate: expirationDate.toISOString(),
    status: "active",
    notes: notes || "",
    credentials: type === "sat" ? {
      satCode: Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase()
    } : undefined
  };

  wholesaler.creditBalance -= pricePaid;
  db.clients.push(newClient);
  await writeDB(db);

  try {
    await sendAdminEmail(
      `Activation ${type === "sat" ? "Code Sat" : "Box Android"} par ${wholesaler.businessName} : ${clientName}`,
      `Le revendeur grossiste '${wholesaler.businessName}' a activé un ${type === "sat" ? "code satellite" : "boîtier Android"}.\n\n` +
      `- Client: ${clientName}\n` +
      `- Produit: ${product.name}\n` +
      `- Prix: ${pricePaid} DA (déduit de son solde)\n` +
      (type === "sat" ? `- Code: ${newClient.credentials?.satCode}\n` : ``) +
      `- Nouveau solde du revendeur: ${wholesaler.creditBalance} DA`,
      "client_activation"
    );
  } catch (err) {
    console.error("Error sending admin notification email:", err);
  }

  res.json({
    message: `Activation effectuée avec succès ! ${pricePaid} DA ont été déduits de votre crédit.`,
    client: newClient,
    newBalance: wholesaler.creditBalance
  });
});

// Wholesaler Credit Recharge Request
app.post("/api/wholesaler/credit-requests", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;
  const { amountDA, paymentMethod, receiptReference } = req.body;

  if (!amountDA || !paymentMethod || !receiptReference) {
    return res.status(400).json({ error: "Tous les champs de recharge sont requis." });
  }

  const db = await readDB();
  const wholesaler = db.wholesalers.find(w => w.id === wholesalerId);
  if (!wholesaler) {
    return res.status(404).json({ error: "Grossiste introuvable." });
  }

  const newRequest: CreditRequest = {
    id: "cr-" + Math.random().toString(36).substr(2, 9),
    wholesalerId,
    wholesalerName: wholesaler.businessName,
    amountDA: Number(amountDA),
    paymentMethod,
    receiptReference,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  db.creditRequests.push(newRequest);
  await writeDB(db);

  await sendAdminEmail(
    `Demande de recharge crédit : ${wholesaler.businessName} (${amountDA} DA)`,
    `Le grossiste '${wholesaler.businessName}' a envoyé une demande de recharge de crédit.\n\n` +
    `- Montant: ${amountDA} DA\n` +
    `- Mode de paiement: ${paymentMethod.toUpperCase()}\n` +
    `- Référence/Reçu: ${receiptReference}\n\n` +
    `Veuillez vérifier votre compte CCP ou BaridiMob, puis approuver la demande dans l'administration pour créditer son compte.`,
    "credit_request"
  );

  res.json({
    message: "Demande de recharge soumise avec succès. Elle sera validée dès réception du paiement.",
    request: newRequest
  });
});

// Get wholesaler's own credit requests
app.get("/api/wholesaler/credit-requests", requireWholesalerAuth, async (req, res) => {
  const wholesalerId = (req as any).wholesalerId as string;

  const db = await readDB();
  const requests = db.creditRequests.filter(r => r.wholesalerId === wholesalerId);
  res.json(requests);
});

// Submit Retail (Détail) User Order
app.post("/api/orders", async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    productId,
    paymentMethod,
    paymentDetails,
    tvModel,
    installedApp,
    hasAndroidBox,
    downloaderCode,
    shippingWilaya,
    shippingType,
    shippingAddress,
    adultContent
  } = req.body;

  if (!customerName || !customerPhone || !productId || !paymentMethod) {
    return res.status(400).json({ error: "Les champs nom, téléphone, produit et méthode de paiement sont obligatoires." });
  }

  const db = await readDB();
  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Produit ou abonnement introuvable." });
  }

  // Produits physiques (Box Android, Démodulateur, TV...) : wilaya + adresse requises.
  // Le prix de livraison est TOUJOURS recalculé côté serveur à partir de la grille
  // tarifaire (jamais confiance dans une valeur envoyée par le client).
  const PHYSICAL_PRODUCT_TYPES = ["device", "demodulateur", "televiseur", "boitier android", "accessoire"];
  const isPhysical = PHYSICAL_PRODUCT_TYPES.includes(product.type);

  // Contenu adulte : pertinent uniquement pour les abonnements IPTV Dino / 8K / Golden OTT.
  const ADULT_TOGGLE_NAMES = ["dino", "8k", "golden"];
  const supportsAdultToggle = (product.type === "iptv" || product.type === "code iptv")
    && ADULT_TOGGLE_NAMES.some(n => product.name.toLowerCase().includes(n));

  let shippingPriceDA = 0;
  let shippingDelay = "";
  if (isPhysical) {
    if (!shippingWilaya || !shippingAddress || (shippingType !== "domicile" && shippingType !== "bureau")) {
      return res.status(400).json({ error: "Wilaya, adresse et mode de livraison sont obligatoires pour ce produit." });
    }
    const tariff = getTariffForWilaya(shippingWilaya);
    if (!tariff) {
      return res.status(400).json({ error: "Wilaya de livraison invalide." });
    }
    shippingPriceDA = shippingType === "domicile" ? tariff.domicile : tariff.bureau;
    shippingDelay = tariff.delai;
  }

  const totalPrice = product.priceRetail + shippingPriceDA;

  const newOrder: Order = {
    id: "o-" + Math.random().toString(36).substr(2, 9),
    customerName,
    customerEmail: customerEmail || "",
    customerPhone,
    productId,
    productName: product.name,
    productType: product.type,
    priceDA: totalPrice,
    paymentMethod,
    paymentDetails: paymentDetails || "",
    status: "pending",
    createdAt: new Date().toISOString(),
    tvModel: tvModel || "",
    installedApp: installedApp || "",
    hasAndroidBox: !!hasAndroidBox,
    downloaderCode: downloaderCode || "",
    ...(isPhysical ? {
      shippingWilaya,
      shippingType: shippingType as "domicile" | "bureau",
      shippingAddress,
      shippingPriceDA,
      shippingDelay
    } : {}),
    ...(supportsAdultToggle ? { adultContent: !!adultContent } : {})
  };

  db.orders.unshift(newOrder);
  await writeDB(db);

  await sendAdminEmail(
    `Nouvelle commande Client : ${product.name} (${totalPrice} DA)`,
    `Nouvelle commande reçue au détail !\n\n` +
    `- Client: ${customerName}\n` +
    `- Téléphone: ${customerPhone}\n` +
    `- Email: ${customerEmail || 'Non fourni'}\n` +
    `- Produit: ${product.name} (${product.type === "iptv" ? "Abonnement IPTV" : "Matériel Box/Firestick"})\n` +
    `- Prix produit: ${product.priceRetail} DA\n` +
    (supportsAdultToggle ? `- Contenu Adulte: ${adultContent ? "Oui" : "Non"}\n` : ``) +
    (isPhysical ? `- Livraison (${shippingType === "domicile" ? "domicile" : "bureau"}) vers ${shippingWilaya}: ${shippingPriceDA} DA (délai ${shippingDelay})\n- Adresse: ${shippingAddress}\n` : ``) +
    `- Total: ${totalPrice} DA\n` +
    `- Méthode de paiement: ${paymentMethod.toUpperCase()}\n` +
    `- Détails paiement: ${paymentDetails || 'Aucun'}\n\n` +
    `Informations Configuration Client :\n` +
    `- Modèle de TV: ${tvModel || 'Non spécifié'}\n` +
    `- Application installée: ${installedApp || 'Non spécifié'}\n` +
    `- Possède une Box Android ?: ${hasAndroidBox ? 'Oui' : 'Non'}\n` +
    `- Code Downloader AFTVnews: ${downloaderCode || 'Aucun'}\n\n` +
    `Veuillez contacter le client au téléphone pour livrer l'abonnement ou expédier l'article par Yalidine.`,
    "new_order"
  );

  res.json({
    message: "Votre commande a été enregistrée avec succès ! Notre équipe va vous contacter par téléphone pour finaliser l'activation.",
    order: newOrder
  });
});

// Track Retail Order Status
app.get("/api/orders/track", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Veuillez fournir un numéro de téléphone ou un ID de commande." });
  }

  const searchStr = (query as string).trim().toLowerCase();
  const db = await readDB();

  const foundOrders = db.orders.filter(o =>
    o.id.toLowerCase() === searchStr ||
    o.customerPhone.trim() === searchStr ||
    o.customerPhone.replace(/\s+/g, '') === searchStr.replace(/\s+/g, '')
  );

  const ordersWithLivreurs = foundOrders.map(order => {
    let assignedLivreur = null;
    if (order.assignedLivreurId && db.livreurs) {
      assignedLivreur = db.livreurs.find(l => l.id === order.assignedLivreurId) || null;
    }
    return {
      ...order,
      livreur: assignedLivreur
    };
  });

  res.json({ orders: ordersWithLivreurs });
});

// ==========================================
// ADMIN API ROUTES
// ==========================================

// Liens de gestion des bouquets (Dino / 8K / Golden OTT) — configurés par
// l'admin, affichés au revendeur après activation IPTV pour qu'il règle les
// chaînes de son client.
app.get("/api/admin/bouquet-links", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.bouquetLinks || {});
});

app.put("/api/admin/bouquet-links", requireAdminAuth, async (req, res) => {
  const { dino, "8k": eightK, "golden ott": goldenOtt } = req.body;
  const db = await readDB();
  db.bouquetLinks = {
    ...(db.bouquetLinks || {}),
    ...(dino !== undefined ? { dino } : {}),
    ...(eightK !== undefined ? { "8k": eightK } : {}),
    ...(goldenOtt !== undefined ? { "golden ott": goldenOtt } : {})
  };
  await writeDB(db);
  res.json(db.bouquetLinks);
});

app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
  const db = await readDB();

  const totalRetailSales = db.orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.priceDA, 0);

  const totalWholesaleSales = db.clients
    .reduce((sum, c) => sum + c.pricePaid, 0);

  const activeWholesalers = db.wholesalers.filter(w => w.status === "approved").length;
  const totalClientsActivated = db.clients.length;

  res.json({
    totalRetailSales,
    totalWholesaleSales,
    totalRevenueDA: totalRetailSales + totalWholesaleSales,
    activeWholesalers,
    totalClientsActivated
  });
});

app.get("/api/admin/wholesalers", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.wholesalers.map(sanitizeWholesaler));
});

app.put("/api/admin/wholesalers/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, creditBalance, username, password, businessName, email, phone } = req.body;

  const db = await readDB();
  const wholesalerIndex = db.wholesalers.findIndex(w => w.id === id);

  if (wholesalerIndex === -1) {
    return res.status(404).json({ error: "Grossiste introuvable." });
  }

  const updated = { ...db.wholesalers[wholesalerIndex] };
  if (status !== undefined) updated.status = status;
  if (creditBalance !== undefined) updated.creditBalance = Number(creditBalance);
  if (username !== undefined) updated.username = username;
  if (password !== undefined) updated.password = bcrypt.hashSync(password, 10);
  if (businessName !== undefined) updated.businessName = businessName;
  if (email !== undefined) updated.email = email;
  if (phone !== undefined) updated.phone = phone;

  db.wholesalers[wholesalerIndex] = updated;
  await writeDB(db);

  res.json({ message: "Compte grossiste mis à jour.", wholesaler: sanitizeWholesaler(updated) });
});

app.get("/api/admin/orders", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.orders);
});

app.put("/api/admin/orders/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, credentials, adultContent } = req.body;

  const db = await readDB();
  const orderIndex = db.orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Commande introuvable." });
  }

  if (status !== undefined) db.orders[orderIndex].status = status;
  if (adultContent !== undefined) db.orders[orderIndex].adultContent = !!adultContent;
  if (credentials !== undefined) {
    db.orders[orderIndex].credentials = {
      ...db.orders[orderIndex].credentials,
      ...credentials
    };
  }
  await writeDB(db);

  res.json({ message: "Commande mise à jour.", order: db.orders[orderIndex] });
});

app.get("/api/admin/credit-requests", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.creditRequests);
});

app.put("/api/admin/credit-requests/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (action !== "approve" && action !== "reject") {
    return res.status(400).json({ error: "Action invalide. Doit être 'approve' ou 'reject'." });
  }

  const db = await readDB();
  const requestIndex = db.creditRequests.findIndex(r => r.id === id);

  if (requestIndex === -1) {
    return res.status(404).json({ error: "Demande de recharge introuvable." });
  }

  const request = db.creditRequests[requestIndex];

  if (request.status !== "pending") {
    return res.status(400).json({ error: "Cette demande a déjà été traitée." });
  }

  if (action === "approve") {
    const wholesalerIndex = db.wholesalers.findIndex(w => w.id === request.wholesalerId);
    if (wholesalerIndex === -1) {
      return res.status(404).json({ error: "Le grossiste émetteur de la demande n'existe plus." });
    }

    db.wholesalers[wholesalerIndex].creditBalance += request.amountDA;
    request.status = "approved";
  } else {
    request.status = "rejected";
  }

  await writeDB(db);
  res.json({
    message: action === "approve" ? "Recharge crédit approuvée et crédit ajouté au grossiste." : "Demande de recharge rejetée.",
    request
  });
});

app.get("/api/admin/notifications", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.notifications);
});

app.put("/api/admin/notifications/:id/read", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    await writeDB(db);
  }
  res.json({ success: true });
});

app.delete("/api/admin/notifications/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.notifications = db.notifications.filter(n => n.id !== id);
  await writeDB(db);
  res.json({ success: true });
});

app.get("/api/admin/clients", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.clients || []);
});

app.put("/api/admin/clients/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { credentials, clientName, server, notes, status, durationMonths, adultContent } = req.body;

  const db = await readDB();
  const clientIndex = db.clients.findIndex(c => c.id === id);

  if (clientIndex === -1) {
    return res.status(404).json({ error: "Client introuvable." });
  }

  const client = db.clients[clientIndex];
  const oldStatus = client.status;

  if (clientName !== undefined) client.clientName = clientName;
  if (server !== undefined) client.server = server;
  if (notes !== undefined) client.notes = notes;
  if (status !== undefined) client.status = status;
  if (durationMonths !== undefined) client.durationMonths = Number(durationMonths);
  if (adultContent !== undefined) client.adultContent = !!adultContent;

  if (credentials !== undefined) {
    client.credentials = {
      ...client.credentials,
      ...credentials
    };
  }

  if (client.status === "active" && (!client.activationDate || oldStatus === "pending")) {
    const activationDate = new Date();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + Number(client.durationMonths));
    client.activationDate = activationDate.toISOString();
    client.expirationDate = expirationDate.toISOString();
  }

  await writeDB(db);
  res.json({ message: "Informations d'abonnement du client mises à jour.", client });
});

// --- DELIVERERS (LIVREURS) ENDPOINTS ---
app.get("/api/admin/livreurs", requireAdminAuth, async (req, res) => {
  const db = await readDB();
  res.json(db.livreurs || []);
});

app.post("/api/admin/livreurs", requireAdminAuth, async (req, res) => {
  const { name, phone, wilaya, status } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Le nom et le numéro de téléphone sont requis." });
  }
  const db = await readDB();
  const newLivreur = {
    id: "liv-" + Math.random().toString(36).substr(2, 9),
    name,
    phone,
    wilaya: wilaya || "",
    status: status || "active",
    createdAt: new Date().toISOString()
  };
  if (!db.livreurs) db.livreurs = [];
  db.livreurs.push(newLivreur);
  await writeDB(db);
  res.json(newLivreur);
});

app.put("/api/admin/livreurs/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, phone, wilaya, status } = req.body;
  const db = await readDB();
  const index = db.livreurs.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Livreur introuvable." });
  }
  db.livreurs[index] = {
    ...db.livreurs[index],
    name: name !== undefined ? name : db.livreurs[index].name,
    phone: phone !== undefined ? phone : db.livreurs[index].phone,
    wilaya: wilaya !== undefined ? wilaya : db.livreurs[index].wilaya,
    status: status !== undefined ? status : db.livreurs[index].status
  };
  await writeDB(db);
  res.json(db.livreurs[index]);
});

app.delete("/api/admin/livreurs/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.livreurs = (db.livreurs || []).filter(l => l.id !== id);
  await writeDB(db);
  res.json({ success: true });
});

app.put("/api/admin/orders/:id/delivery", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { assignedLivreurId, deliveryStatus, status } = req.body;
  const db = await readDB();
  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Commande introuvable." });
  }
  const order = db.orders[index];
  if (assignedLivreurId !== undefined) order.assignedLivreurId = assignedLivreurId;
  if (deliveryStatus !== undefined) order.deliveryStatus = deliveryStatus;
  if (status !== undefined) order.status = status;
  await writeDB(db);
  res.json({ message: "Livraison de la commande mise à jour.", order });
});

// --- TUTORIALS ENDPOINTS ---
app.get("/api/tutorials", async (req, res) => {
  const db = await readDB();
  res.json(db.tutorials || []);
});

app.post("/api/admin/tutorials", requireAdminAuth, async (req, res) => {
  const { title, url, description, category, downloaderCode } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Le titre et le lien sont obligatoires." });
  }
  const db = await readDB();
  const newTutorial: VideoTutorial = {
    id: "tut-" + Math.random().toString(36).substr(2, 9),
    title,
    url,
    description: description || "",
    category: category || "smart_tv",
    downloaderCode: downloaderCode || "",
    createdAt: new Date().toISOString()
  };
  if (!db.tutorials) db.tutorials = [];
  db.tutorials.push(newTutorial);
  await writeDB(db);
  res.json(newTutorial);
});

app.put("/api/admin/tutorials/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { title, url, description, category, downloaderCode } = req.body;
  const db = await readDB();
  const index = db.tutorials.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Tutoriel introuvable." });
  }
  db.tutorials[index] = {
    ...db.tutorials[index],
    title: title !== undefined ? title : db.tutorials[index].title,
    url: url !== undefined ? url : db.tutorials[index].url,
    description: description !== undefined ? description : db.tutorials[index].description,
    category: category !== undefined ? category : db.tutorials[index].category,
    downloaderCode: downloaderCode !== undefined ? downloaderCode : db.tutorials[index].downloaderCode
  };
  await writeDB(db);
  res.json(db.tutorials[index]);
});

app.delete("/api/admin/tutorials/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.tutorials = (db.tutorials || []).filter(t => t.id !== id);
  await writeDB(db);
  res.json({ success: true });
});

// --- PRODUCTS MANAGEMENT (CRUD) ---
// SÉCURITÉ : ces routes créent/modifient/suppriment le catalogue — protégées
// par requireAdminAuth. L'alias public "/api/products" est retiré ici : il ne
// doit rester accessible qu'en LECTURE (voir la route GET plus haut), jamais
// en écriture.
app.post("/api/admin/products", requireAdminAuth, async (req, res) => {
  const { name, type, priceRetail, priceWholesale, description, features, imageUrl, imageUrl2, isPopular } = req.body;
  if (!name || !type || priceRetail === undefined || priceWholesale === undefined) {
    return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
  }
  const db = await readDB();
  const newProduct: Product = {
    id: "p-" + Math.random().toString(36).substr(2, 9),
    name,
    type,
    priceRetail: Number(priceRetail),
    priceWholesale: Number(priceWholesale),
    description: description || "",
    features: Array.isArray(features) ? features : [],
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=300",
    imageUrl2: imageUrl2 || "",
    isPopular: !!isPopular
  };
  db.products.push(newProduct);
  await writeDB(db);
  res.json(newProduct);
});

app.put("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, type, priceRetail, priceWholesale, description, features, imageUrl, imageUrl2, isPopular } = req.body;
  const db = await readDB();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  db.products[index] = {
    ...db.products[index],
    name: name !== undefined ? name : db.products[index].name,
    type: type !== undefined ? type : db.products[index].type,
    priceRetail: priceRetail !== undefined ? Number(priceRetail) : db.products[index].priceRetail,
    priceWholesale: priceWholesale !== undefined ? Number(priceWholesale) : db.products[index].priceWholesale,
    description: description !== undefined ? description : db.products[index].description,
    features: features !== undefined ? (Array.isArray(features) ? features : []) : db.products[index].features,
    imageUrl: imageUrl !== undefined ? imageUrl : db.products[index].imageUrl,
    imageUrl2: imageUrl2 !== undefined ? imageUrl2 : db.products[index].imageUrl2,
    isPopular: isPopular !== undefined ? !!isPopular : db.products[index].isPopular
  };
  await writeDB(db);
  res.json(db.products[index]);
});

app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.products = db.products.filter(p => p.id !== id);
  await writeDB(db);
  res.json({ success: true });
});

// --- ORDERS: suppression individuelle (admin) ---
app.delete("/api/admin/orders/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const existed = db.orders.some(o => o.id === id);
  if (!existed) {
    return res.status(404).json({ error: "Commande introuvable." });
  }
  db.orders = db.orders.filter(o => o.id !== id);
  await writeDB(db);
  res.json({ success: true });
});

// --- DIRECT WHOLESALER CREATION BY ADMIN ---
app.post("/api/admin/wholesalers", requireAdminAuth, async (req, res) => {
  const { username, password, businessName, phone, email, creditBalance } = req.body;
  if (!username || !businessName || !phone || !email) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }
  const db = await readDB();
  const exists = db.wholesalers.some(
    w => w.username.toLowerCase() === username.toLowerCase() || w.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: "Ce nom d'utilisateur ou email existe déjà." });
  }
  const newWholesaler: any = {
    id: "w-" + Math.random().toString(36).substr(2, 9),
    username,
    password: bcrypt.hashSync(password || "123456", 10),
    businessName,
    phone,
    email,
    status: "approved",
    creditBalance: creditBalance ? Number(creditBalance) : 0,
    createdAt: new Date().toISOString()
  };
  db.wholesalers.push(newWholesaler);
  await writeDB(db);
  res.json(sanitizeWholesaler(newWholesaler));
});

// Filet de sécurité global : capture toute erreur non gérée dans une route
// async (ex: panne réseau Redis) et répond proprement au lieu de laisser la
// requête du client rester bloquée indéfiniment. Nécessite "express-async-errors"
// importé en haut du fichier, car Express 4 ne route pas nativement les
// rejets de promesses vers ce middleware.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Une erreur serveur est survenue. Veuillez réessayer dans un instant." });
});

export default app;
