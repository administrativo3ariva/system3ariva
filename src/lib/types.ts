export type Branch = 'BH-Matriz' | 'BH-Algar' | 'Vêneto-BH' | 'Vêneto-SP' | 'SP' | 'RJ' | 'PAG' | 'VAG' | 'FLO' | 'JM' | 'ITA' | 'CPN' | 'LIM' | 'JUN' | 'SJC';

export const STOCK_BRANCHES = [
  'BH-Matriz', 'Vêneto-BH', 'Vêneto-SP',
  'SP', 'FLO', 'ITA', 'PAG', 'VAG', 'CPN', 'JUN',
] as const;
export type StockBranch = typeof STOCK_BRANCHES[number];

// Legacy alias — kept for compatibility
export const STOCK_UNITS = STOCK_BRANCHES;
export type StockUnit = StockBranch;

export const BH_MATRIZ_FLOORS = ['3º andar', '8º andar', '9º andar', 'Algar'] as const;
export type BhMatrizFloor = typeof BH_MATRIZ_FLOORS[number];

export const ALL_BRANCHES: Branch[] = ['BH-Matriz', 'BH-Algar', 'Vêneto-BH', 'Vêneto-SP', 'SP', 'RJ', 'PAG', 'VAG', 'FLO', 'JM', 'ITA', 'CPN', 'LIM', 'JUN', 'SJC'];

export const BRANCH_LABELS: Record<string, string> = {
  'BH-Matriz': 'BH (Matriz)',
  'BH-Algar': 'BH (Algar)',
  'Vêneto-BH': 'Vêneto (BH)',
  'Vêneto-SP': 'Vêneto (SP)',
  'SP': 'São Paulo',
  'RJ': 'Rio de Janeiro',
  'PAG': 'Pouso Alegre',
  'VAG': 'Varginha',
  'FLO': 'Florianópolis',
  'JM': 'Juiz de Fora',
  'ITA': 'Itajubá',
  'CPN': 'Campinas',
  'LIM': 'Limeira',
  'JUN': 'Jundiaí',
  'SJC': 'São José dos Campos',
};

/** Groups for the sidebar branch selector */
export const STOCK_BRANCH_GROUPS = [
  {
    label: 'Belo Horizonte',
    branches: ['BH-Matriz'] as StockBranch[],
  },
  {
    label: 'Vêneto',
    branches: ['Vêneto-BH', 'Vêneto-SP'] as StockBranch[],
  },
  {
    label: 'Filiais',
    branches: ['SP', 'FLO', 'ITA', 'PAG', 'VAG', 'CPN', 'JUN'] as StockBranch[],
  },
];

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
