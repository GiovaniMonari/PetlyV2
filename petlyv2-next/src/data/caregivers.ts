export interface Caregiver {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviews: number;
  price: number;
  location: string;
  specialties: string[];
  bio: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
}

export const caregivers: Caregiver[] = [
  {
    id: '1',
    name: 'Mariana Silva',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 124,
    price: 60,
    location: 'São Paulo, SP',
    specialties: ['Cães idosos', 'Administração de medicamentos'],
    bio: 'Apaixonada por animais desde criança, trabalho com pets há 5 anos.',
    type: 'dog',
  },
  {
    id: '2',
    name: 'Ricardo Oliveira',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop',
    rating: 4.8,
    reviews: 89,
    price: 45,
    location: 'Rio de Janeiro, RJ',
    specialties: ['Gatos ariscos', 'Hospedagem domiciliar'],
    bio: 'Especialista em comportamento felino e cuidado personalizado.',
    type: 'cat',
  },
  {
    id: '3',
    name: 'Ana Costa',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
    rating: 5.0,
    reviews: 56,
    price: 75,
    location: 'Curitiba, PR',
    specialties: ['Adestramento básico', 'Passeios longos'],
    bio: 'Ofereço um ambiente seguro e divertido para o seu melhor amigo.',
    type: 'dog',
  },
  {
    id: '4',
    name: 'Pedro Santos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
    rating: 4.7,
    reviews: 42,
    price: 40,
    location: 'Belo Horizonte, MG',
    specialties: ['Pássaros', 'Roedores'],
    bio: 'Cuidado especializado para pequenos animais e aves.',
    type: 'other',
  },
  {
    id: '5',
    name: 'Juliana Lima',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop',
    rating: 4.9,
    reviews: 210,
    price: 55,
    location: 'Porto Alegre, RS',
    specialties: ['Primeiros socorros', 'Gatos'],
    bio: 'Enfermeira veterinária em formação, dedicada ao bem-estar animal.',
    type: 'cat',
  },
  {
    id: '6',
    name: 'Lucas Ferreira',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&auto=format&fit=crop',
    rating: 4.6,
    reviews: 35,
    price: 50,
    location: 'Salvador, BA',
    specialties: ['Cães de grande porte', 'Corrida com cães'],
    bio: 'Energia de sobra para garantir que seu cão se exercite e se divirta.',
    type: 'dog',
  },
];
