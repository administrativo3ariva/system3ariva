export type Branch = 'BH-Matriz' | 'BH-Algar' | 'Vêneto' | 'SP' | 'RJ' | 'PAG' | 'VAG' | 'FLO' | 'JM' | 'ITA' | 'CPN' | 'LIM' | 'JUN' | 'SJC';

export const STOCK_UNITS = ['BH-Matriz', 'BH-Algar'] as const;
export type StockUnit = typeof STOCK_UNITS[number];

export const BH_MATRIZ_FLOORS = ['3º andar', '8º andar', '9º andar'] as const;
export type BhMatrizFloor = typeof BH_MATRIZ_FLOORS[number];

export const ALL_BRANCHES: Branch[] = ['BH-Matriz', 'BH-Algar', 'Vêneto', 'SP', 'RJ', 'PAG', 'VAG', 'FLO', 'JM', 'ITA', 'CPN', 'LIM', 'JUN', 'SJC'];

export const BRANCH_LABELS: Record<Branch, string> = {
  'BH-Matriz': 'BH (Matriz)',
  'BH-Algar': 'BH (Algar)',
  'Vêneto': 'BH (Vêneto)',
  'SP': 'São Paulo',
  'RJ': 'Rio de Janeiro',
  'PAG': 'Poços de Caldas',
  'VAG': 'Varginha',
  'FLO': 'Florianópolis',
  'JM': 'Juiz de Fora',
  'ITA': 'Itajubá',
  'CPN': 'Campinas',
  'LIM': 'Limeira',
  'JUN': 'Jundiaí',
  'SJC': 'São José dos Campos',
};

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: StockUnit;
  minStock?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  date: string;
  user: string;
  responsible?: string;
  notes: string;
  unit: StockUnit;
}

export interface Collaborator {
  id: string;
  name: string;
  unit: StockUnit;
  department: string;
  active: boolean;
}

export interface AssetItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  branch: Branch;
  acquisitionDate: string;
  imageUrl?: string;
}

export interface NfUpload {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  supplier?: string;
  totalValue?: number;
  items: NfItem[];
}

export interface NfItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type AppModule = 'stock' | 'inventory';
