export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bike: string;
  level: number;
  totalKm: number;
  isOnline?: boolean;
  speed?: number;
  location?: { lat: number; lng: number };
}

export interface Post {
  id: string;
  user: User;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  distance: number;
  duration: string;
  location: string;
  timestamp: string;
  isLiked?: boolean;
}

export interface Story {
  id: string;
  user: User;
  thumbnail: string;
  isViewed: boolean;
}

export interface Group {
  id: string;
  name: string;
  cover: string;
  members: number;
  category: string;
  description: string;
  isJoined?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export const currentUser: User = {
  id: '1',
  name: 'João Silva',
  username: 'joao_rider',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  bike: 'Harley-Davidson Iron 883',
  level: 42,
  totalKm: 28450,
};

export const users: User[] = [
  currentUser,
  {
    id: '2',
    name: 'Maria Santos',
    username: 'maria_moto',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    bike: 'Kawasaki Ninja 650',
    level: 35,
    totalKm: 18200,
    isOnline: true,
    speed: 78,
    location: { lat: -23.5505, lng: -46.6333 },
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    username: 'pedro_ride',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bike: 'BMW R1250GS',
    level: 58,
    totalKm: 45600,
    isOnline: true,
    speed: 92,
    location: { lat: -23.5605, lng: -46.6533 },
  },
  {
    id: '4',
    name: 'Ana Costa',
    username: 'ana_bikelife',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bike: 'Ducati Monster 821',
    level: 29,
    totalKm: 12800,
    isOnline: true,
    speed: 65,
    location: { lat: -23.5405, lng: -46.6433 },
  },
  {
    id: '5',
    name: 'Lucas Ferreira',
    username: 'lucas_thunder',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bike: 'Triumph Street Triple',
    level: 47,
    totalKm: 32100,
    isOnline: false,
  },
];

export const posts: Post[] = [
  {
    id: '1',
    user: users[1],
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&h=600&fit=crop',
    caption: 'Nascer do sol na Serra do Rio do Rastro! 🌅 Uma das melhores estradas do Brasil. A curva 84 é simplesmente surreal!',
    likes: 847,
    comments: 56,
    distance: 342,
    duration: '4h 23min',
    location: 'Serra do Rio do Rastro, SC',
    timestamp: '2h',
    isLiked: true,
  },
  {
    id: '2',
    user: users[2],
    image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&h=600&fit=crop',
    caption: 'Rolê da galera até Campos do Jordão! Frio de 8°C mas valeu muito a pena. Próximo destino: Monte Verde 🏔️',
    likes: 1203,
    comments: 89,
    distance: 186,
    duration: '2h 45min',
    location: 'Campos do Jordão, SP',
    timestamp: '5h',
  },
  {
    id: '3',
    user: users[3],
    image: 'https://images.unsplash.com/photo-1568772585407-9361bd955bf3?w=800&h=600&fit=crop',
    caption: 'Primeira vez pilotando na Dutra! Adrenalina pura 🔥 O pôr do sol compensou todo o cansaço.',
    likes: 532,
    comments: 34,
    distance: 420,
    duration: '5h 10min',
    location: 'Rod. Presidente Dutra',
    timestamp: '8h',
    isLiked: true,
  },
  {
    id: '4',
    user: users[4],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    caption: 'Final de semana épico em Gramado! A estrada pela Serra Gaúcha é sensacional. Quem mais já fez essa rota?',
    likes: 2100,
    comments: 156,
    distance: 580,
    duration: '7h 30min',
    location: 'Gramado, RS',
    timestamp: '1d',
  },
];

export const stories: Story[] = [
  {
    id: '1',
    user: { ...currentUser, name: 'Seu Story' },
    thumbnail: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&h=300&fit=crop',
    isViewed: false,
  },
  {
    id: '2',
    user: users[1],
    thumbnail: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=200&h=300&fit=crop',
    isViewed: false,
  },
  {
    id: '3',
    user: users[2],
    thumbnail: 'https://images.unsplash.com/photo-1568772585407-9361bd955bf3?w=200&h=300&fit=crop',
    isViewed: true,
  },
  {
    id: '4',
    user: users[3],
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=300&fit=crop',
    isViewed: false,
  },
  {
    id: '5',
    user: users[4],
    thumbnail: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=200&h=300&fit=crop',
    isViewed: true,
  },
];

export const groups: Group[] = [
  {
    id: '1',
    name: 'Harley Owners SP',
    cover: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=400&h=200&fit=crop',
    members: 2847,
    category: 'Marca',
    description: 'Grupo oficial dos proprietários de Harley-Davidson em São Paulo',
    isJoined: true,
  },
  {
    id: '2',
    name: 'Serra da Mantiqueira Riders',
    cover: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=400&h=200&fit=crop',
    members: 1523,
    category: 'Região',
    description: 'Rolês semanais pela Serra da Mantiqueira',
  },
  {
    id: '3',
    name: 'Café Racers Brasil',
    cover: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&h=200&fit=crop',
    members: 4210,
    category: 'Estilo',
    description: 'Comunidade de entusiastas de Café Racers',
    isJoined: true,
  },
  {
    id: '4',
    name: 'Adventure Touring BR',
    cover: 'https://images.unsplash.com/photo-1568772585407-9361bd955bf3?w=400&h=200&fit=crop',
    members: 3892,
    category: 'Estilo',
    description: 'Big trails e aventura pelo Brasil',
  },
  {
    id: '5',
    name: 'Noturno SP',
    cover: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400&h=200&fit=crop',
    members: 987,
    category: 'Região',
    description: 'Rolês noturnos por São Paulo',
  },
];

export const badges: Badge[] = [
  { id: '1', name: 'Iniciante', icon: '🏍️', description: 'Primeiro rolê registrado', unlocked: true },
  { id: '2', name: '1.000 km', icon: '🛣️', description: 'Rodou 1.000 km', unlocked: true },
  { id: '3', name: '10.000 km', icon: '🌟', description: 'Rodou 10.000 km', unlocked: true },
  { id: '4', name: 'Madrugador', icon: '🌅', description: 'Rolê antes das 6h', unlocked: true },
  { id: '5', name: 'Noturno', icon: '🌙', description: 'Rolê após meia-noite', unlocked: true },
  { id: '6', name: 'Chuva', icon: '🌧️', description: 'Rolê na chuva', unlocked: false },
  { id: '7', name: '5 Estados', icon: '🗺️', description: 'Visitou 5 estados', unlocked: true },
  { id: '8', name: 'Social', icon: '👥', description: '100 seguidores', unlocked: true },
];
