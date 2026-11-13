import { FoodMerchant, DriverProfile } from './types';

// Coord bounds on our simulated vector map: 0 to 100
export const MAP_LOCATIONS = [
  { name: 'Monumen Nasional (Monas)', x: 50, y: 15, address: 'Jl. Medan Merdeka Barat No.1, Jakarta Pusat' },
  { name: 'Stasiun Gambir', x: 68, y: 18, address: 'Jl. Medan Merdeka Timur No.17, Jakarta Pusat' },
  { name: 'Bundaran HI', x: 48, y: 45, address: 'Bundaran Hotel Indonesia, Menteng, Jakarta Pusat' },
  { name: 'Grand Indonesia Mall', x: 40, y: 48, address: 'Jl. M.H. Thamrin No.1, Menteng, Jakarta Pusat' },
  { name: 'Sudirman Central Business District (SCBD)', x: 35, y: 70, address: 'Jl. Jenderal Sudirman Kav. 52, Jakarta Selatan' },
  { name: 'Senayan City', x: 22, y: 68, address: 'Jl. Asia Afrika No.19, Tanah Abang, Jakarta Pusat' },
  { name: 'Kemang Village', x: 55, y: 88, address: 'Jl. Pangeran Antasari No.36, Mampang, Jakarta Selatan' },
  { name: 'Central Park Mall', x: 15, y: 35, address: 'Jl. Letjen S. Parman No.28, Grogol, Jakarta Barat' },
  { name: 'Taman Mini Indonesia Indah', x: 85, y: 85, address: 'Jl. Raya Taman Mini, Jakarta Timur' },
];

export const MOCK_DRIVERS: DriverProfile[] = [
  {
    uid: 'drv-01',
    name: 'Budi Santoso',
    phone: '0812-3456-7890',
    email: 'budi.santoso@jekexpress.com',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&h=150&fit=crop&q=80',
    vehicleType: 'motor',
    vehiclePlate: 'B 4123 STO',
    vehicleName: 'Honda Vario 150 Hitam',
    rating: 4.8,
    totalRatings: 1240,
    isOnline: true,
    walletBalance: 350000,
    status: 'idle',
    currentLocation: { lat: 0, lng: 0, address: 'Monas' }
  },
  {
    uid: 'drv-02',
    name: 'Andi Wijaya',
    phone: '0813-9876-5432',
    email: 'andi.wijaya@jekexpress.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80',
    vehicleType: 'mobil',
    vehiclePlate: 'B 1876 WJA',
    vehicleName: 'Toyota Avanza Veloz Putih',
    rating: 4.9,
    totalRatings: 850,
    isOnline: true,
    walletBalance: 1200000,
    status: 'idle',
    currentLocation: { lat: 0, lng: 0, address: 'Sudirman' }
  },
  {
    uid: 'drv-03',
    name: 'Hendra Setiawan',
    phone: '0877-4455-6677',
    email: 'hendra.s@jekexpress.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
    vehicleType: 'motor',
    vehiclePlate: 'B 3981 HND',
    vehicleName: 'Yamaha NMAX Grey',
    rating: 4.7,
    totalRatings: 512,
    isOnline: true,
    walletBalance: 180000,
    status: 'idle',
    currentLocation: { lat: 0, lng: 0, address: 'Bundaran HI' }
  }
];

export const FOOD_MERCHANTS: FoodMerchant[] = [
  {
    id: 'mrt-01',
    name: 'Nasi Goreng Gila Gondrong Obama',
    cuisine: 'Nasi Goreng, Bakmi, Indonesian',
    rating: 4.7,
    deliveryTime: '20-30 min',
    distance: 1.8,
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&fit=crop&q=80',
    menu: [
      {
        id: 'food-1-1',
        name: 'Nasi Goreng Gila Obama',
        price: 28000,
        description: 'Nasi goreng legendaris dengan topping baso, sosis, telur orek bumbu gila pedas manis melimpah.',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&fit=crop&q=80'
      },
      {
        id: 'food-1-2',
        name: 'Mie Goreng Gila',
        price: 27000,
        description: 'Mie telur goreng khas dibumbui sedap dengan siraman gila pedas.',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&fit=crop&q=80'
      },
      {
        id: 'food-1-3',
        name: 'Kerupuk Kaleng Putih',
        price: 3000,
        description: 'Kerupuk renyah pendamping makan nasi goreng.',
        image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=300&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'mrt-02',
    name: 'Sate Khas Senayan Menteng',
    cuisine: 'Sate, Soto, Indonesian Cuisine',
    rating: 4.8,
    deliveryTime: '25-35 min',
    distance: 2.3,
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&fit=crop&q=80',
    menu: [
      {
        id: 'food-2-1',
        name: 'Sate Ayam Madura (10 Tusuk)',
        price: 45000,
        description: 'Sate dada ayam pilihan empuk dengan siraman bumbu kacang gurih halus legit.',
        image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&fit=crop&q=80'
      },
      {
        id: 'food-2-2',
        name: 'Soto Betawi Daging',
        price: 52000,
        description: 'Soto santan khas Jakarta dengan potongan daging sapi empuk, kentang, tomat, dan emping.',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&fit=crop&q=80'
      },
      {
        id: 'food-2-3',
        name: 'Es Teler JekExpress',
        price: 22000,
        description: 'Es teler segar dengan alpukat, nangka, kelapa muda sirup kental manis.',
        image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=300&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'mrt-03',
    name: 'Martabak Pecenongan Alay',
    cuisine: 'Martabak Manis & Telur, Dessert',
    rating: 4.9,
    deliveryTime: '15-25 min',
    distance: 1.1,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&fit=crop&q=80',
    menu: [
      {
        id: 'food-3-1',
        name: 'Martabak Manis Cokelat Keju Susu',
        price: 65000,
        description: 'Martabak manis tebal lembut dengan isian cokelat meses premium, keju parut melimpah, dan susu kental.',
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&fit=crop&q=80'
      },
      {
        id: 'food-3-2',
        name: 'Martabak Telor Bebek Spesial',
        price: 55000,
        description: 'Martabak telur dengan 3 telur bebek, cincangan daging sapi berbumbu gurih, daun bawang melimpah.',
        image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&fit=crop&q=80'
      }
    ]
  }
];

export const ESTIMATED_RATES = {
  jekride: { base: 8000, perKm: 2500, label: 'JekRide' },
  jekcar: { base: 15000, perKm: 5000, label: 'JekCar' },
  jekfood: { base: 10000, perKm: 3000, label: 'JekFood' },
  jeksend: { base: 12000, perKm: 4000, label: 'JekSend' },
  jekcargo: { base: 50000, perKm: 12000, label: 'JekCargo' }
};

export function calculateFare(service: keyof typeof ESTIMATED_RATES, distance: number): number {
  const rate = ESTIMATED_RATES[service];
  return Math.round(rate.base + (distance * rate.perKm));
}

// Simple pathfinding road simulator on 100x100 grid
export function simulateRoutePoints(start: { x: number; y: number }, end: { x: number; y: number }, count = 20) {
  const points = [];
  // Standard grid path (L-shaped or straight)
  const isLShaped = Math.random() > 0.3;
  if (isLShaped) {
    const half = Math.floor(count / 2);
    // Vertical then horizontal or vice versa
    for (let i = 0; i <= half; i++) {
      const t = i / half;
      points.push({
        x: start.x,
        y: start.y + (end.y - start.y) * t
      });
    }
    for (let i = 1; i <= (count - half); i++) {
      const t = i / (count - half);
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: end.y
      });
    }
  } else {
    // Direct straight path
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
      });
    }
  }
  return points;
}
