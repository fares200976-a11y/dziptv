// Dictionnaire de traduction FR/AR. Clé plate -> { fr, ar }.
// Utilisé via useTranslation() / t('cle'). Si une clé est absente pour la
// langue active, on retombe automatiquement sur le français (voir LanguageContext).
export type Lang = "fr" | "ar";

export const translations: Record<string, { fr: string; ar: string }> = {
  // --- Navigation / Header générale ---
  "nav.home": { fr: "Accueil", ar: "الرئيسية" },
  "nav.shop": { fr: "Boutique Détail", ar: "المتجر بالتفصيل" },
  "nav.wholesaler_space": { fr: "Espace Grossiste", ar: "فضاء تجار الجملة" },
  "nav.wholesaler_login": { fr: "Espace Client / Grossiste", ar: "دخول العملاء / تجار الجملة" },
  "nav.admin": { fr: "Administration", ar: "الإدارة" },
  "nav.language": { fr: "Langue", ar: "اللغة" },

  // --- Hero / accueil boutique ---
  "hero.badge": { fr: "N°1 de l'IPTV Premium & Grossiste en Algérie", ar: "الرقم 1 في IPTV المتميز وتجارة الجملة في الجزائر" },
  "hero.title_1": { fr: "Abonnements", ar: "اشتراكات" },
  "hero.title_2": { fr: "IPTV Stables", ar: "IPTV مستقرة" },
  "hero.title_3": { fr: "& Matériel Haute Qualité", ar: "ومعدات عالية الجودة" },
  "hero.subtitle": {
    fr: "Profitez du meilleur du divertissement sans coupures. Vente au détail et tarifs préférentiels pour revendeurs (grossistes) avec serveurs Dino, 8K, V12 et Golden OTT.",
    ar: "استمتع بأفضل ترفيه بدون انقطاع. بيع بالتفصيل وأسعار تفضيلية لتجار الجملة مع خوادم Dino و8K وV12 وGolden OTT."
  },
  "hero.cta_buy": { fr: "Acheter un abonnement (Détail)", ar: "شراء اشتراك (تفصيل)" },
  "hero.cta_wholesaler": { fr: "Devenir Revendeur (Gros)", ar: "كن تاجر جملة" },
  "hero.stat_activation": { fr: "Activation Rapide", ar: "تفعيل سريع" },
  "hero.stat_stability": { fr: "Stabilité Serveur", ar: "استقرار الخادم" },
  "hero.stat_support": { fr: "Support Technique", ar: "الدعم الفني" },
  "hero.stat_secure": { fr: "Sûr", ar: "آمن" },

  // --- Boutique / Catalogue ---
  "shop.title": { fr: "Nos Offres & Produits", ar: "عروضنا ومنتجاتنا" },
  "shop.subtitle": { fr: "Abonnements IPTV, recharges ADSL Idoom et boîtiers de streaming de dernière génération.", ar: "اشتراكات IPTV وشحن ADSL Idoom وأجهزة بث من أحدث جيل." },
  "shop.filter_all": { fr: "Tout Voir", ar: "عرض الكل" },
  "shop.filter_iptv": { fr: "Abonnements IPTV", ar: "اشتراكات IPTV" },
  "shop.filter_device": { fr: "Boîtiers Android & Firestick", ar: "أجهزة أندرويد وفايرستيك" },
  "shop.filter_box": { fr: "Box Android", ar: "بوكس أندرويد" },
  "shop.filter_led": { fr: "TV / LED", ar: "تلفزيون / LED" },
  "shop.filter_codesat": { fr: "Code Sat", ar: "كود سات" },
  "shop.filter_accessoire": { fr: "Accessoires", ar: "إكسسوارات" },
  "shop.filter_adsl": { fr: "Cartes ADSL Idoom", ar: "بطاقات ADSL Idoom" },
  "shop.categories_title": { fr: "Catégories", ar: "الفئات" },
  "shop.view_details": { fr: "Voir le descriptif", ar: "عرض التفاصيل" },
  "shop.track_order": { fr: "Suivi de Commande", ar: "تتبع الطلب" },
  "shop.order_button": { fr: "Commander", ar: "اطلب الآن" },
  "shop.price_retail": { fr: "Tarif Détail", ar: "سعر التفصيل" },
  "shop.per_year": { fr: "/ 12 Mois", ar: "/ 12 شهر" },
  "shop.badge_material": { fr: "Matériel (Livraison)", ar: "معدات (توصيل)" },
  "shop.badge_popular": { fr: "Recommandé", ar: "موصى به" },
  "shop.click_to_enlarge": { fr: "Cliquer pour agrandir", ar: "انقر للتكبير" },

  // --- Checkout ---
  "checkout.title": { fr: "Finaliser votre commande", ar: "إتمام طلبك" },
  "checkout.total": { fr: "Total à payer :", ar: "المبلغ الإجمالي:" },
  "checkout.name": { fr: "Nom & Prénom", ar: "الاسم الكامل" },
  "checkout.phone": { fr: "Numéro de Téléphone", ar: "رقم الهاتف" },
  "checkout.email": { fr: "Adresse Email (Optionnel)", ar: "البريد الإلكتروني (اختياري)" },
  "checkout.delivery_info": { fr: "Informations de Livraison", ar: "معلومات التوصيل" },
  "checkout.wilaya": { fr: "Wilaya de livraison", ar: "الولاية" },
  "checkout.delivery_mode": { fr: "Mode de livraison", ar: "طريقة التوصيل" },
  "checkout.home_delivery": { fr: "À domicile", ar: "إلى المنزل" },
  "checkout.office_delivery": { fr: "Au bureau / agence", ar: "إلى المكتب / الوكالة" },
  "checkout.address": { fr: "Adresse complète", ar: "العنوان الكامل" },
  "checkout.payment_method": { fr: "Méthode de Paiement Préférée :", ar: "طريقة الدفع المفضلة:" },
  "checkout.confirm": { fr: "Confirmer ma Commande", ar: "تأكيد الطلب" },
  "checkout.close": { fr: "Fermer la fenêtre", ar: "إغلاق" },

  // --- Espace revendeur ---
  "wholesaler.login_title": { fr: "Connexion Revendeur", ar: "دخول تاجر الجملة" },
  "wholesaler.username": { fr: "Nom d'utilisateur", ar: "اسم المستخدم" },
  "wholesaler.password": { fr: "Mot de passe", ar: "كلمة المرور" },
  "wholesaler.login_button": { fr: "Se connecter", ar: "تسجيل الدخول" },
  "wholesaler.register_link": { fr: "Créer un Compte", ar: "إنشاء حساب" },
  "wholesaler.dashboard_title": { fr: "Tableau de Bord Revendeur", ar: "لوحة تحكم تاجر الجملة" },
  "wholesaler.credit_balance": { fr: "Crédit Disponible", ar: "الرصيد المتاح" },
  "wholesaler.clients_list": { fr: "Liste de vos Clients Activés", ar: "قائمة عملائك المفعّلين" },
  "wholesaler.add_client": { fr: "Activer un Client", ar: "تفعيل عميل" },
  "wholesaler.recharge": { fr: "Recharger le Solde", ar: "شحن الرصيد" },
  "wholesaler.leave_panel": { fr: "Quitter le panneau", ar: "مغادرة اللوحة" },
  "wholesaler.settings": { fr: "Paramètres du compte", ar: "إعدادات الحساب" },
  "wholesaler.full_logout": { fr: "Déconnexion complète", ar: "تسجيل خروج كامل" },
  "wholesaler.service_type": { fr: "Type de Service", ar: "نوع الخدمة" },
  "wholesaler.client_name": { fr: "Nom du Client", ar: "اسم العميل" },
  "wholesaler.duration": { fr: "Durée d'abonnement", ar: "مدة الاشتراك" },
  "wholesaler.confirm_activation": { fr: "Confirmer l'activation", ar: "تأكيد التفعيل" },

  // --- Panel admin ---
  "admin.dashboard_title": { fr: "KURTAL IPTV Controller Hub", ar: "لوحة تحكم KURTAL IPTV" },
  "admin.total_revenue": { fr: "Chiffre d'Affaire Total", ar: "إجمالي الإيرادات" },
  "admin.retail_sales": { fr: "Ventes Boutique Détail", ar: "مبيعات المتجر بالتفصيل" },
  "admin.wholesale_sales": { fr: "Ventes Grossistes", ar: "مبيعات الجملة" },
  "admin.wholesale_partners": { fr: "Partenaires Grossistes", ar: "شركاء الجملة" },
  "admin.tab_emails": { fr: "Emails", ar: "الرسائل" },
  "admin.tab_wholesalers": { fr: "Revendeurs", ar: "تجار الجملة" },
  "admin.tab_recharges": { fr: "Recharges", ar: "الشحن" },
  "admin.tab_orders": { fr: "Commandes", ar: "الطلبات" },
  "admin.tab_products": { fr: "Catalogue Produits", ar: "كتالوج المنتجات" },
  "admin.tab_tutorials": { fr: "Tutoriels Vidéo", ar: "دروس الفيديو" },
  "admin.tab_panels": { fr: "Demandes Panels", ar: "طلبات اللوحات" },
  "admin.tab_livreurs": { fr: "Livreurs & Suivi", ar: "الموصلون والتتبع" },
  "admin.tab_categories": { fr: "Catégories", ar: "الفئات" },
  "admin.delete": { fr: "Supprimer", ar: "حذف" },
  "admin.validate": { fr: "Valider", ar: "تأكيد" },
  "admin.cancel": { fr: "Annuler", ar: "إلغاء" },
  "admin.logout": { fr: "Se déconnecter", ar: "تسجيل الخروج" },
  "admin.reset_db": { fr: "Réinitialiser BDD", ar: "إعادة تعيين القاعدة" },

  // --- Statuts génériques ---
  "status.pending": { fr: "En attente", ar: "قيد الانتظار" },
  "status.active": { fr: "Actif", ar: "نشط" },
  "status.completed": { fr: "Terminé", ar: "مكتمل" },
  "status.cancelled": { fr: "Annulé", ar: "ملغى" },
  "status.suspended": { fr: "Suspendu", ar: "موقوف" },
  "status.approved": { fr: "Approuvé", ar: "موافق عليه" }
};
