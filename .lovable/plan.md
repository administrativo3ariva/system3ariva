

## Plano: Módulo Financeiro (sem subcategorias)

### 1. Constantes e Tipos (`src/lib/types.ts`)

- Adicionar `'financial'` ao `AppModule`
- **FINANCIAL_COST_CENTERS**: `['BH', 'SP', 'RJ', 'PAG', 'VAG', 'FLO', 'JM', 'ITA', 'CPN', 'LIM', 'JUN', 'SJC']`
- **FINANCIAL_COMPANIES**: `['RIVA', '3A', 'RVCS', '3A Serviços', 'Vêneto']`
- **EXPENSE_CATEGORIES**: `['Material de Uso & Consumo', 'Material de Limpeza', 'Material de Escritório & TI', 'Eletrodoméstico', 'Reparo & Manutenção', 'Serviços']` — lista plana, sem subcategorias
- Tipos `Expense` e `PaymentRequest`

### 2. Tabelas (Migration)

**`expenses`**: id, description, amount, cost_center, company, category, card_name, expense_date, receipt_url, notes, status (pendente/aprovado/rejeitado), created_at, updated_at

**`payment_requests`**: id, description, amount, cost_center, company, category, supplier, due_date, payment_date, notes, status (pendente/aprovado/pago/rejeitado), created_at, updated_at

RLS público (mesmo padrão do projeto).

### 3. Redesign do Module Switcher (`AppSidebar.tsx`)

Grid 2×2 com ícone + label para Estoque, Patrimônio, Facilities, Financeiro. Módulo ativo com destaque visual.

### 4. Sidebar do Financeiro

```text
📊 Dashboard                    → /financial/dashboard
💳 Cartão Corporativo           (collapsible)
   ├─ Lançar Despesa            → /financial/expenses/new
   └─ Despesas Lançadas         → /financial/expenses
📋 Solicitações de Pagamento    (collapsible)
   ├─ Nova Solicitação          → /financial/requests/new
   └─ Solicitações              → /financial/requests
📈 Relatórios                   → /financial/reports
```

### 5. Páginas e Hooks

| Página | Rota |
|---|---|
| FinancialDashboard | `/financial/dashboard` |
| ExpenseForm | `/financial/expenses/new` |
| ExpensesList | `/financial/expenses` |
| PaymentRequestForm | `/financial/requests/new` |
| PaymentRequestsList | `/financial/requests` |
| FinancialReports | `/financial/reports` |

Hooks: `use-expenses.ts`, `use-payment-requests.ts`

### 6. Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/types.ts` | Atualizar AppModule, adicionar constantes e tipos |
| `src/components/AppSidebar.tsx` | Grid 2×2 + menu financeiro com collapsible |
| `src/App.tsx` | 6 rotas novas |
| `src/pages/financial/*.tsx` | 6 páginas |
| `src/hooks/use-expenses.ts` | Criar |
| `src/hooks/use-payment-requests.ts` | Criar |
| Migration SQL | Tabelas expenses e payment_requests |

