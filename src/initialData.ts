import { Dress, TeamMember, Testimonial, AppSettings, DefileVideo } from './types';

export const INITIAL_DRESSES: Dress[] = [
  {
    id: 'mari-01',
    name: 'Robe Céleste - Princesse Dentelle',
    description: 'Une somptueuse robe de mariée coupe princesse avec un bustier en dentelle fine de Calais, brodée de perles discrètes et une traîne royale en tulle scintillant. Un choix romantique absolu pour briller le jour de votre vie.',
    category: 'Robes de mariée',
    pricePerDay: 45000, // Prix en Dinars Algériens (DZD)
    depositAmount: 15000,
    sizes: ['36', '38', '40', '42'],
    images: [
      'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bride-in-her-wedding-dress-outdoors-39912-large.mp4',
    available: true
  },
  {
    id: 'mari-02',
    name: 'Robe Sirène Impériale',
    description: 'Robe de mariée silhouette sirène soulignant délicatement la silhouette. Confectionnée en crêpe de soie blanche de haute qualité avec un dos nu plongeant orné de dentelle florale 3D.',
    category: 'Robes de mariée',
    pricePerDay: 50000,
    depositAmount: 20000,
    sizes: ['34', '36', '38', '40'],
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: '',
    available: true
  },
  {
    id: 'kab-01',
    name: 'Robe Kabyle Royale d\'Iwajit',
    description: 'Une œuvre d\'art moderne inspirée de l\'héritage de Tizi Ouzou. Confectionnée avec de la soie rouge vibrante, ornée de zigzags (fardas) traditionnels faits main aux couleurs vives (jaune, orange, vert) et accompagnée de son burnous assorti.',
    category: 'Robes kabyles',
    pricePerDay: 30000,
    depositAmount: 10000,
    sizes: ['38', '40', '42', '44'],
    images: [
      'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-wearing-traditional-oriental-clothing-40742-large.mp4',
    available: true
  },
  {
    id: 'kab-02',
    name: 'Robe Kabyle Blanche de Fiançailles',
    description: 'Robe kabyle contemporaine blanc satiné. Brodée de motifs géométriques berbères argentés et de coraux authentiques. Parfaite pour le "Teqlil" ou la cérémonie de fiançailles.',
    category: 'Robes kabyles',
    pricePerDay: 25000,
    depositAmount: 8000,
    sizes: ['36', '38', '40', '42'],
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: '',
    available: true
  },
  {
    id: 'caf-01',
    name: 'Caftan Vert Émeraude Impérial',
    description: 'Un caftan majestueux en velours de soie émeraude doublé de brocart doré. Travaillé minutieusement par nos artisans de Tlemcen avec de la "Sfifa" dorée fine et une ceinture (mdehba) ornée de cristaux scintillants.',
    category: 'Caftans',
    pricePerDay: 35000,
    depositAmount: 12000,
    sizes: ['38', '40', '42', '46'],
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: '',
    available: true
  },
  {
    id: 'caf-02',
    name: 'Caftan Rose Poudré Majestueux',
    description: 'Un caftan romantique et moderne en mousseline de soie rose poudré avec de magnifiques broderies florales perlées et une coupe fluide évasée.',
    category: 'Caftans',
    pricePerDay: 32000,
    depositAmount: 10000,
    sizes: ['36', '38', '40'],
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: '',
    available: true
  },
  {
    id: 'soir-01',
    name: 'Robe Sirène Satinée Dorée',
    description: 'Une somptueuse robe de soirée sirène drapée en satin de soie champagne. Un dos nu spectaculaire agrémenté de chaînes dorées amovibles pour faire sensation lors de vos mariages et galas.',
    category: 'Robes de soirée',
    pricePerDay: 20000,
    depositAmount: 7000,
    sizes: ['36', '38', '40'],
    images: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: '',
    available: true
  },
  {
    id: 'acc-01',
    name: 'Parure Traditionnelle Berbère en Argent',
    description: 'Ensemble comprenant un diadème (taj), des fibules et des boucles d\'oreilles traditionnelles kabyles en argent massif incrusté de corail et d\'émaux colorés bleus, jaunes et verts.',
    category: 'Accessoires',
    pricePerDay: 10000,
    depositAmount: 3000,
    sizes: ['Taille Unique'],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=75&fm=webp',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=75&fm=webp'
    ],
    videoUrl: '',
    available: true
  }
];

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'team-01',
    name: 'Kahina Hamdad',
    role: 'Fondatrice & Styliste Principal',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=75&fm=webp',
    description: 'Passionnée par la couture traditionnelle berbère et la haute couture occidentale. Kahina sélectionne et retouche chaque robe pour garantir une expérience impériale.'
  },
  {
    id: 'team-02',
    name: 'Sonia Ait-Oumeziane',
    role: 'Conseillère en Image & Accueil',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&h=300&q=75&fm=webp',
    description: 'Avec son sourire chaleureux, Sonia vous guide avec bienveillance pour trouver LA robe coup de cœur idéale selon votre morphologie et votre teint.'
  },
  {
    id: 'team-03',
    name: 'Meriem Belkacemi',
    role: 'Maître Couturière',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=75&fm=webp',
    description: 'Experte en broderies d\'art et ajustements de luxe. Elle veille à ce que votre robe soit parfaitement cintrée et ajustée à vos mesures.'
  }
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-01',
    name: 'Amel G.',
    rating: 5,
    comment: 'J\'ai loué la Robe Kabyle Royale pour mon Teqlil et mes invités ont été émerveillés ! La qualité du tissu et de la broderie est incroyable. Merci à Kahina pour son accueil d\'une extrême gentillesse.',
    date: '12 Juin 2026',
    dressCategory: 'Robes kabyles'
  },
  {
    id: 'test-02',
    name: 'Lydia B.',
    rating: 5,
    comment: 'Une expérience magique ! Sonia a tout de suite compris mon style. La robe de mariée Princesse était ajustée à la perfection. La propreté des robes est exemplaire.',
    date: '04 Juillet 2026',
    dressCategory: 'Robes de mariée'
  },
  {
    id: 'test-03',
    name: 'Feriel K.',
    rating: 5,
    comment: 'Le caftan émeraude a fait fureur au mariage de mon frère. Très confortable et d\'un luxe absolu. Le paiement de l\'acompte en ligne a rendu la réservation simple et rapide !',
    date: '15 Juillet 2026',
    dressCategory: 'Caftans'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  homepageBg: 'https://assets.mixkit.co/videos/preview/mixkit-bride-in-her-wedding-dress-outdoors-39912-large.mp4',
  backgroundMusicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  musicTitle: 'Serenade Romantique d\'Amour (Instrumental)',
  // Aucun identifiant par défaut n'est fourni : au premier lancement, l'admin
  // doit créer son propre compte via l'écran "Créer votre compte admin".
  adminUsername: '',
  adminPasswordHash: '',
  notificationEmail: 'karimchabni395@gmail.com',
  notificationWhatsapp: '00213553318195'
};

export const INITIAL_DEFILES: DefileVideo[] = [
  {
    id: 'defile-1',
    title: 'Robe Céleste - Collection Princesse',
    category: 'Robes de mariée',
    description: 'Aperçu cinématographique en mouvement de notre somptueuse robe de mariée coupe princesse avec dentelle fine de Calais.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-bride-in-her-wedding-dress-outdoors-39912-large.mp4',
    coverImage: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=75&fm=webp',
    aspectRatio: 'portrait'
  },
  {
    id: 'defile-2',
    title: 'Robe Kabyle Royale d\'Iwajit',
    category: 'Robes kabyles',
    description: 'Défilé de notre création kabyle royale en mouvement, mettant en valeur ses fardas traditionnels brodés main.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-wearing-traditional-oriental-clothing-40742-large.mp4',
    coverImage: 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&w=600&q=75&fm=webp',
    aspectRatio: 'portrait'
  }
];

