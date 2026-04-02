export type Branch = 'BH-Matriz' | 'Vêneto-BH' | 'Vêneto-SP' | 'SP' | 'RJ' | 'PAG' | 'VAG' | 'FLO' | 'JM' | 'ITA' | 'CPN' | 'LIM' | 'JUN' | 'SJC';

export const STOCK_BRANCHES = [
  'BH-Matriz', 'Vêneto-BH', 'Vêneto-SP',
  'SP', 'FLO', 'ITA', 'PAG', 'VAG', 'CPN', 'JUN',
] as const;
export type StockBranch = typeof STOCK_BRANCHES[number];

// Legacy alias — kept for compatibility
export const STOCK_UNITS = STOCK_BRANCHES;
export type StockUnit = StockBranch;

export const BH_MATRIZ_FLOORS = ['3º andar', '8º andar', '9º andar', '10º andar', 'Algar'] as const;
export type BhMatrizFloor = typeof BH_MATRIZ_FLOORS[number];

export const ALL_BRANCHES: Branch[] = ['BH-Matriz', 'Vêneto-BH', 'Vêneto-SP', 'SP', 'RJ', 'PAG', 'VAG', 'FLO', 'JM', 'ITA', 'CPN', 'LIM', 'JUN', 'SJC'];

export const BRANCH_LABELS: Record<string, string> = {
  'BH-Matriz': 'BH (Matriz)',
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

export type AppModule = 'stock' | 'inventory' | 'facilities';

export const MAINTENANCE_CATEGORIES = [
  'Ar-condicionado',
  'Filtro Purificadores de Água',
  'Persianas',
  'Detetização',
  'Cafeteiras',
  'Mobiliário',
  'Reparos Gerais',
  'Reparos (Drywall, Divisórias e Hidráulica)',
  'Carpete',
] as const;

export type MaintenanceCategory = typeof MAINTENANCE_CATEGORIES[number];

export const MAINTENANCE_RECURRENCE: Record<MaintenanceCategory, { months: number | null; label: string }> = {
  'Ar-condicionado': { months: 3, label: 'Trimestral' },
  'Filtro Purificadores de Água': { months: 6, label: 'Semestral' },
  'Persianas': { months: 6, label: 'Semestral' },
  'Detetização': { months: 3, label: 'Trimestral' },
  'Cafeteiras': { months: 1, label: 'Mensal' },
  'Mobiliário': { months: 12, label: 'Anual' },
  'Reparos Gerais': { months: null, label: 'Sob demanda' },
  'Reparos (Drywall, Divisórias e Hidráulica)': { months: null, label: 'Sob demanda' },
  'Carpete': { months: 12, label: 'Anual' },
};

export type MaintenanceStatus = 'todo' | 'approval' | 'in_progress' | 'done';
export type MaintenancePriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type MaintenanceType = 'preventiva' | 'corretiva';

export interface MaintenanceTask {
  id: string;
  title: string;
  category: MaintenanceCategory;
  branch: string;
  floor?: string | null;
  description?: string | null;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  due_date?: string | null;
  completed_date?: string | null;
  recurrence_months?: number | null;
  supplier?: string | null;
  estimated_cost?: number;
  actual_cost?: number | null;
  notes?: string | null;
  maintenance_type: MaintenanceType;
  created_at: string;
  updated_at: string;
}
