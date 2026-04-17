export type Branch = 'BH-Matriz' | 'Vêneto-BH' | 'Vêneto-SP' | 'SP' | 'RJ' | 'PAG' | 'VAG' | 'FLO' | 'ITA' | 'CPN' | 'LIM' | 'JUN' | 'SJC';

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

export const ALL_BRANCHES: Branch[] = ['BH-Matriz', 'Vêneto-BH', 'Vêneto-SP', 'SP', 'RJ', 'PAG', 'VAG', 'FLO', 'ITA', 'CPN', 'LIM', 'JUN', 'SJC'];

export const BRANCH_LABELS: Record<string, string> = {
  'BH-Matriz': 'BH (Matriz)',
  'Vêneto-BH': 'Vêneto (BH)',
  'Vêneto-SP': 'Vêneto (SP)',
  'SP': 'São Paulo',
  'RJ': 'Rio de Janeiro',
  'PAG': 'Pouso Alegre',
  'VAG': 'Varginha',
  'FLO': 'Florianópolis',
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

export type AppModule = 'stock' | 'inventory' | 'facilities' | 'financial';

export const FINANCIAL_COST_CENTERS = [
  'BH', 'SP', 'RJ', 'PAG', 'VAG', 'FLO', 'ITA', 'CPN', 'LIM', 'JUN', 'SJC',
] as const;
export type FinancialCostCenter = typeof FINANCIAL_COST_CENTERS[number];

export const FINANCIAL_COMPANIES = ['RIVA', '3A', 'RVCS', '3A Serviços', 'Vêneto'] as const;
export type FinancialCompany = typeof FINANCIAL_COMPANIES[number];

export const CORPORATE_CARDS = [
  { value: 'Cartão Final 4402', label: 'Cartão Final 4402 (Kamino)' },
  { value: 'Cartão Final 2819', label: 'Cartão Final 2819 (Kamino)' },
  { value: 'Cartão Final 6498', label: 'Cartão Final 6498 (Kamino)' },
  { value: 'Cartão Final 0071', label: 'Cartão Final 0071 (Inter)' },
  { value: 'Cartão Final 3220', label: 'Cartão Final 3220 (Vexpeses)' },
] as const;

/** Maps companies that have a corporate card to their default card identifier */
export const COMPANY_CARD_MAP: Partial<Record<FinancialCompany, string>> = {
  'RIVA': 'Cartão Final 4402',
  '3A': 'Cartão Final 2819',
  'RVCS': 'Cartão Final 6498',
};

// Aligned with operational macroblocos taxonomy (see OPERATIONAL_CATEGORIES_BY_MACROBLOCO below)
export const EXPENSE_CATEGORIES = [
  // Suprimentos
  'Material de Escritório & TI',
  'Material de Limpeza',
  'Material de Uso & Consumo',
  // Patrimônio e Manutenção
  'Eletrodoméstico',
  'Reparo & Manutenção',
  'Bens de Pequeno Valor & Patrimônio Leve',
  // Serviços e Apoio Operacional
  'Serviços',
  'Mobilidade & Deslocamento',
  'Logística & Entregas',
  'Assinaturas & Conteúdo',
  // Ocupação e Infraestrutura
  'Ocupação Imobiliária',
  'Infraestrutura Predial',
  'Tributos Imobiliários',
  'Seguros Patrimoniais',
] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// ===== Operacional / Orçamento =====
export const OPERATIONAL_MACROBLOCOS = [
  'Suprimentos',
  'Patrimônio e Manutenção',
  'Serviços e Apoio Operacional',
  'Ocupação e Infraestrutura',
] as const;
export type OperationalMacrobloco = typeof OPERATIONAL_MACROBLOCOS[number];

export const OPERATIONAL_CATEGORIES_BY_MACROBLOCO: Record<OperationalMacrobloco, string[]> = {
  'Suprimentos': [
    'Material de Escritório & TI',
    'Material de Limpeza',
    'Material de Uso & Consumo',
  ],
  'Patrimônio e Manutenção': [
    'Eletrodoméstico',
    'Reparo & Manutenção',
    'Bens de Pequeno Valor & Patrimônio Leve',
  ],
  'Serviços e Apoio Operacional': [
    'Serviços',
    'Mobilidade & Deslocamento',
    'Logística & Entregas',
    'Assinaturas & Conteúdo',
  ],
  'Ocupação e Infraestrutura': [
    'Ocupação Imobiliária',
    'Infraestrutura Predial',
    'Tributos Imobiliários',
    'Seguros Patrimoniais',
  ],
};

/** Reverse lookup: category -> macrobloco */
export const CATEGORY_TO_MACROBLOCO: Record<string, OperationalMacrobloco> = Object.entries(
  OPERATIONAL_CATEGORIES_BY_MACROBLOCO
).reduce((acc, [macro, cats]) => {
  cats.forEach(c => { acc[c] = macro as OperationalMacrobloco; });
  return acc;
}, {} as Record<string, OperationalMacrobloco>);

export const ALL_OPERATIONAL_CATEGORIES = Object.values(OPERATIONAL_CATEGORIES_BY_MACROBLOCO).flat();

export const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;
export const MONTH_LABELS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
export type MonthKey = typeof MONTH_KEYS[number];

/** Monthly budget row: one record per (year, month, branch, macrobloco, category) */
export interface OperationalBudgetMonthly {
  id: string;
  year: number;
  month: number; // 1-12
  branch: string;
  macrobloco: OperationalMacrobloco;
  category: string;
  amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationalExpense {
  id: string;
  description: string;
  amount: number;
  branch: string;
  macrobloco: OperationalMacrobloco;
  category: string;
  expense_date: string;
  supplier?: string | null;
  supplier_id?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpenseStatus = 'pendente' | 'aprovado' | 'rejeitado';
export type PaymentRequestStatus = 'pendente' | 'aprovado' | 'pago' | 'rejeitado';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  cost_center: string;
  company: string;
  category: string;
  card_name?: string | null;
  expense_date: string;
  receipt_url?: string | null;
  notes?: string | null;
  status: ExpenseStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  description: string;
  amount: number;
  cost_center: string;
  company: string;
  category: string;
  supplier?: string | null;
  due_date?: string | null;
  payment_date?: string | null;
  notes?: string | null;
  status: PaymentRequestStatus;
  created_at: string;
  updated_at: string;
}

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
