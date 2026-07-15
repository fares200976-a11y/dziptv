// Tarifs de livraison par wilaya (produits physiques : Box Android, Démodulateur, TV...)
// Source : grille tarifaire Anderson E-Commerce Logistics, départ Tizi-Ouzou.
// domicile / bureau en DA. delai au format Yalidine-like (ex: "J+1", "J+5").

export interface WilayaTariff {
  wilaya: string;
  delai: string;
  domicile: number;
  bureau: number;
}

export const DELIVERY_TARIFFS: WilayaTariff[] = [
  { wilaya: "Adrar", delai: "J+5", domicile: 1400, bureau: 750 },
  { wilaya: "Chlef", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Laghouat", delai: "J+1", domicile: 950, bureau: 550 },
  { wilaya: "Oum El Bouaghi", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Batna", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Béjaïa", delai: "J+1", domicile: 750, bureau: 450 },
  { wilaya: "Biskra", delai: "J+1", domicile: 950, bureau: 550 },
  { wilaya: "Béchar", delai: "J+3", domicile: 1100, bureau: 600 },
  { wilaya: "Blida", delai: "J+1", domicile: 750, bureau: 450 },
  { wilaya: "Bouira", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Tamanrasset", delai: "J+5", domicile: 1500, bureau: 750 },
  { wilaya: "Tébessa", delai: "J+1", domicile: 900, bureau: 450 },
  { wilaya: "Tlemcen", delai: "J+1", domicile: 850, bureau: 450 },
  { wilaya: "Tiaret", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Tizi Ouzou", delai: "J/J+1", domicile: 500, bureau: 300 },
  { wilaya: "Alger", delai: "J+1", domicile: 700, bureau: 450 },
  { wilaya: "Djelfa", delai: "J+1", domicile: 950, bureau: 450 },
  { wilaya: "Jijel", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Sétif", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Saïda", delai: "J+1", domicile: 850, bureau: 450 },
  { wilaya: "Skikda", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Sidi Bel Abbès", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Annaba", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Guelma", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Constantine", delai: "J+1", domicile: 900, bureau: 450 },
  { wilaya: "Médéa", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Mostaganem", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "M'Sila", delai: "J+1", domicile: 850, bureau: 450 },
  { wilaya: "Mascara", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Ouargla", delai: "J+2", domicile: 950, bureau: 500 },
  { wilaya: "Oran", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "El Bayadh", delai: "J+2", domicile: 1050, bureau: 600 },
  { wilaya: "Illizi", delai: "J+9", domicile: 1750, bureau: 800 },
  { wilaya: "Bordj Bou Arreridj", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Boumerdès", delai: "J+1", domicile: 750, bureau: 450 },
  { wilaya: "El Tarf", delai: "J+1", domicile: 850, bureau: 450 },
  { wilaya: "Tindouf", delai: "J+5", domicile: 1750, bureau: 800 },
  { wilaya: "Tissemsilt", delai: "J+1", domicile: 900, bureau: 450 },
  { wilaya: "El Oued", delai: "J+2", domicile: 950, bureau: 550 },
  { wilaya: "Khenchela", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Souk Ahras", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Tipaza", delai: "J+1", domicile: 850, bureau: 450 },
  { wilaya: "Mila", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Aïn Defla", delai: "J+1", domicile: 800, bureau: 450 },
  { wilaya: "Naâma", delai: "J+2", domicile: 1100, bureau: 550 },
  { wilaya: "Aïn Témouchent", delai: "J+1", domicile: 850, bureau: 450 },
  { wilaya: "Ghardaïa", delai: "J+2", domicile: 900, bureau: 600 },
  { wilaya: "Relizane", delai: "J+1", domicile: 850, bureau: 450 },
  { wilaya: "Timimoun", delai: "J+5", domicile: 1400, bureau: 700 },
  { wilaya: "Bordj Badji Mokhtar", delai: "J+10", domicile: 1500, bureau: 700 },
  { wilaya: "Ouled Djellal", delai: "J+2", domicile: 950, bureau: 550 },
  { wilaya: "Béni Abbès", delai: "J+3", domicile: 1000, bureau: 550 },
  { wilaya: "In Salah", delai: "J+5", domicile: 1600, bureau: 800 },
  { wilaya: "In Guezzam", delai: "J+5", domicile: 1600, bureau: 800 },
  { wilaya: "Touggourt", delai: "J+2", domicile: 950, bureau: 550 },
  { wilaya: "Djanet", delai: "J+9", domicile: 1750, bureau: 800 },
  { wilaya: "El M'Ghair", delai: "J+5", domicile: 900, bureau: 550 },
  { wilaya: "El Meniaa", delai: "J+5", domicile: 1000, bureau: 550 }
];

export function getTariffForWilaya(wilaya: string): WilayaTariff | undefined {
  return DELIVERY_TARIFFS.find(t => t.wilaya === wilaya);
}
