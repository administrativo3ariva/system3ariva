import { Product, StockMovement, Collaborator, AssetItem, NfUpload } from './types';

export const mockProducts: Product[] = [
  { id: '1', name: 'Papel A4 Resma', category: 'Papelaria', quantity: 150, unitPrice: 28.90, totalPrice: 4335, unit: 'BH-Matriz', minStock: 50 },
  { id: '2', name: 'Caneta Esferográfica Azul', category: 'Papelaria', quantity: 300, unitPrice: 2.50, totalPrice: 750, unit: 'BH-Matriz', minStock: 100 },
  { id: '3', name: 'Toner HP 58A', category: 'Informática', quantity: 8, unitPrice: 189.90, totalPrice: 1519.20, unit: 'BH-Matriz', minStock: 5 },
  { id: '4', name: 'Café em Pó 500g', category: 'Copa', quantity: 25, unitPrice: 18.90, totalPrice: 472.50, unit: 'BH-Matriz', minStock: 10 },
  { id: '5', name: 'Água Mineral 20L', category: 'Copa', quantity: 12, unitPrice: 15.00, totalPrice: 180, unit: 'BH-Matriz', minStock: 5 },
  { id: '6', name: 'Álcool Gel 500ml', category: 'Limpeza', quantity: 40, unitPrice: 12.90, totalPrice: 516, unit: 'BH-Matriz', minStock: 15 },
  { id: '7', name: 'Pilha AA (par)', category: 'Informática', quantity: 3, unitPrice: 8.90, totalPrice: 26.70, unit: 'BH-Matriz', minStock: 10 },
  { id: '8', name: 'Grampeador', category: 'Papelaria', quantity: 15, unitPrice: 35.00, totalPrice: 525, unit: 'BH-Matriz', minStock: 5 },
];

export const mockMovements: StockMovement[] = [
  { id: '1', productId: '1', productName: 'Papel A4 Resma', type: 'entrada', quantity: 50, date: '2026-03-15', user: 'Admin', notes: 'NF #1234', unit: 'BH-Matriz' },
  { id: '2', productId: '3', productName: 'Toner HP 58A', type: 'saida', quantity: 2, date: '2026-03-14', user: 'Admin', responsible: 'João Silva', notes: 'Troca de toner impressora 3º andar', unit: 'BH-Matriz' },
  { id: '3', productId: '4', productName: 'Café em Pó 500g', type: 'saida', quantity: 5, date: '2026-03-13', user: 'Admin', responsible: 'Maria Santos', notes: 'Reposição copa', unit: 'BH-Matriz' },
  { id: '4', productId: '7', productName: 'Pilha AA (par)', type: 'ajuste', quantity: -2, date: '2026-03-12', user: 'Admin', notes: 'Ajuste inventário', unit: 'BH-Matriz' },
  { id: '5', productId: '2', productName: 'Caneta Esferográfica Azul', type: 'saida', quantity: 20, date: '2026-03-11', user: 'Admin', responsible: 'Carlos Oliveira', notes: 'Distribuição mensal', unit: 'BH-Matriz' },
];

export const mockCollaborators: Collaborator[] = [
  { id: '1', name: 'João Silva', unit: 'BH-Matriz', department: 'TI', active: true },
  { id: '2', name: 'Maria Santos', unit: 'BH-Matriz', department: 'Administrativo', active: true },
  { id: '3', name: 'Carlos Oliveira', unit: 'BH-Matriz', department: 'Financeiro', active: true },
  { id: '4', name: 'Ana Paula Costa', unit: 'BH-Matriz', department: 'RH', active: true },
  { id: '5', name: 'Pedro Henrique', unit: 'BH-Matriz', department: 'Operações', active: false },
];

export const mockAssets: AssetItem[] = [
  { id: '1', code: '3ARI-BH-001', name: 'Notebook Dell Latitude 5540', description: 'Notebook corporativo i7 16GB', category: 'Informática', quantity: 1, unitPrice: 6500, totalPrice: 6500, branch: 'BH-Matriz', acquisitionDate: '2025-06-15', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop' },
  { id: '2', code: '3ARI-BH-002', name: 'Monitor LG 27" 4K', description: 'Monitor ultrawide para análise', category: 'Informática', quantity: 1, unitPrice: 2800, totalPrice: 2800, branch: 'BH-Matriz', acquisitionDate: '2025-06-15', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&h=100&fit=crop' },
  { id: '3', code: '3ARI-BH-003', name: 'Cadeira Ergonômica', description: 'Cadeira presidente com apoio lombar', category: 'Mobiliário', quantity: 1, unitPrice: 1890, totalPrice: 1890, branch: 'BH-Matriz', acquisitionDate: '2025-03-10', imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=100&h=100&fit=crop' },
  { id: '4', code: '3ARI-SP-001', name: 'Notebook Dell Latitude 5540', description: 'Notebook corporativo i7 16GB', category: 'Informática', quantity: 1, unitPrice: 6500, totalPrice: 6500, branch: 'SP', acquisitionDate: '2025-08-20', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop' },
  { id: '5', code: '3ARI-SP-002', name: 'Impressora HP LaserJet', description: 'Impressora multifuncional laser', category: 'Informática', quantity: 1, unitPrice: 3200, totalPrice: 3200, branch: 'SP', acquisitionDate: '2025-09-01', imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=100&h=100&fit=crop' },
  { id: '6', code: '3ARI-RJ-001', name: 'Mesa de Reunião 8 lugares', description: 'Mesa oval em MDF', category: 'Mobiliário', quantity: 1, unitPrice: 4500, totalPrice: 4500, branch: 'RJ', acquisitionDate: '2025-07-05', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop' },
  { id: '7', code: '3ARI-BH-004', name: 'Ar Condicionado Split 18000BTU', description: 'Split inverter Samsung', category: 'Climatização', quantity: 1, unitPrice: 3800, totalPrice: 3800, branch: 'BH-Matriz', acquisitionDate: '2025-04-12', imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=100&h=100&fit=crop' },
  { id: '8', code: '3ARI-FLO-001', name: 'Notebook Lenovo ThinkPad', description: 'Notebook corporativo i5 8GB', category: 'Informática', quantity: 1, unitPrice: 4200, totalPrice: 4200, branch: 'FLO', acquisitionDate: '2025-11-10', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop' },
];

export const mockNfUploads: NfUpload[] = [
  {
    id: '1', fileName: 'NF-1234.pdf', uploadDate: '2026-03-15', status: 'pendente',
    supplier: 'Kalunga Ltda', totalValue: 1445.00,
    items: [
      { name: 'Papel A4 Resma', quantity: 50, unitPrice: 28.90, totalPrice: 1445.00 },
    ]
  },
  {
    id: '2', fileName: 'NF-5678.pdf', uploadDate: '2026-03-10', status: 'aprovado',
    supplier: 'Info Store', totalValue: 379.80,
    items: [
      { name: 'Toner HP 58A', quantity: 2, unitPrice: 189.90, totalPrice: 379.80 },
    ]
  },
];

// Aligned with Suprimentos + Patrimônio macroblocos (operational taxonomy)
export const PRODUCT_CATEGORIES = [
  'Material de Escritório',
  'Material de Limpeza',
  'Material de Uso & Consumo',
  'Eletrodoméstico',
  'Reparo & Manutenção',
  'Bens de Pequeno Valor & Patrimônio Leve',
];
export const ASSET_CATEGORIES = ['Climatização', 'Móveis', 'Eletrodomésticos', 'Utensílios', 'Utilitários', 'Decoração', 'Infraestrutura', 'Informática'];
export const ASSET_CONDITIONS = ['Novo', 'Bom', 'Regular', 'Ruim', 'Inservível'] as const;
export type AssetCondition = typeof ASSET_CONDITIONS[number];
