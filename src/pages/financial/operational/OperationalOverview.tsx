import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOperationalBudgets } from '@/hooks/use-operational-budgets';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, MONTH_LABELS_PT } from '@/lib/types';
import { buildConsumedList, fmtBRL, fmtBRLk, isKnownCategory, sumBudget, COMMITTED_MACROBLOCO } from '@/lib/operational-utils';
import { AlertTriangle, TrendingUp, Wallet, CircleDollarSign, AlertCircle, Receipt, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart, Area, Line, PieChart as RPieChart, Pie, Cell, LabelList, ReferenceLine } from 'recharts';

// Shared tooltip with currency formatting
type TooltipPayload = { name: string; value: number; color?: string; dataKey?: string };
const CurrencyTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      {label && <div className="font-medium text-foreground mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-medium text-foreground">{fmtBRL(Number(p.value) || 0)}</span>
        </div>
      ))}
    </div>
  );
};

const YEAR = 2026;
const NOW_MONTH = new Date().getMonth() + 1; // 1-12

export default function OperationalOverview() {
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<number>(NOW_MONTH);
  const { data: budgets = [] } = useOperationalBudgets(YEAR);
  const { data: expenses = [] } = useExpenses();
  const { data: payments = [] } = usePaymentRequests();

  // Year-wide consumed list
  const consumedYear = useMemo(() => buildConsumedList({
    year: YEAR,
    expenses: expenses as Parameters<typeof buildConsumedList>[0]['expenses'],
    payments: payments as Parameters<typeof buildConsumedList>[0]['payments'],
  }), [expenses, payments]);

  const budgetsBranch = branchFilter === 'all' ? budgets : budgets.filter(b => b.branch === branchFilter);
  const consumedBranch = branchFilter === 'all' ? consumedYear : consumedYear.filter(c => c.branch === branchFilter);

  // For the selected month
  const budgetsMonth = budgetsBranch.filter(b => b.month === monthFilter);
  const consumedMonth = consumedBranch.filter(c => new Date(c.date).getMonth() + 1 === monthFilter);

  const realizadoMonth = consumedMonth.filter(c => c.status === 'realizado').reduce((s, c) => s + c.amount, 0);
  const comprometidoMonth = consumedMonth.filter(c => c.status === 'comprometido').reduce((s, c) => s + c.amount, 0);
  const totalBudgetMonth = sumBudget(budgetsMonth);
  const balanceMonth = totalBudgetMonth - realizadoMonth;
  const pctMonth = totalBudgetMonth > 0 ? (realizadoMonth / totalBudgetMonth) * 100 : 0;

  // Comprometido fixo = budget allocated to "Ocupação e Infraestrutura"
  const comprometidoFixo = sumBudget(budgetsMonth, { macrobloco: COMMITTED_MACROBLOCO });

  // Per-category aggregation for the month
  const byCategoryMonth = new Map<string, number>();
  consumedMonth.filter(c => c.status === 'realizado').forEach(c => {
    byCategoryMonth.set(c.category, (byCategoryMonth.get(c.category) || 0) + c.amount);
  });
  const budgetByCategoryMonth = new Map<string, number>();
  budgetsMonth.forEach(b => budgetByCategoryMonth.set(b.category, (budgetByCategoryMonth.get(b.category) || 0) + Number(b.amount)));

  // Alerts
  const overBudgetCats: { category: string; spent: number; budget: number }[] = [];
  const nearLimitCats: { category: string; spent: number; budget: number; pct: number }[] = [];
  byCategoryMonth.forEach((spent, cat) => {
    const bud = budgetByCategoryMonth.get(cat) || 0;
    if (bud === 0) return;
    const p = (spent / bud) * 100;
    if (p > 100) overBudgetCats.push({ category: cat, spent, budget: bud });
    else if (p >= 80) nearLimitCats.push({ category: cat, spent, budget: bud, pct: p });
  });

  // Categories with expense but no budget
  const categoriesWithoutBudget: { category: string; spent: number }[] = [];
  byCategoryMonth.forEach((spent, cat) => {
    if (!budgetByCategoryMonth.has(cat) && isKnownCategory(cat)) {
      categoriesWithoutBudget.push({ category: cat, spent });
    }
  });

  // Branches at risk: > 80% in their month budget
  const branchRisk: { branch: string; spent: number; budget: number; pct: number }[] = [];
  if (branchFilter === 'all') {
    ALL_BRANCHES.forEach(br => {
      const bb = sumBudget(budgets, { branch: br, month: monthFilter });
      const sp = consumedYear.filter(c => c.branch === br && c.status === 'realizado' && new Date(c.date).getMonth() + 1 === monthFilter).reduce((s, c) => s + c.amount, 0);
      if (bb > 0 && sp / bb >= 0.8) branchRisk.push({ branch: br, spent: sp, budget: bb, pct: (sp / bb) * 100 });
    });
  }

  const unclassified = consumedMonth.filter(c => !isKnownCategory(c.category));
  const launchCount = consumedMonth.length;

  // Charts: monthly evolution (12 months)
  const monthly = MONTH_LABELS_PT.map((label, i) => {
    const m = i + 1;
    const bud = sumBudget(budgetsBranch, { month: m });
    const real = consumedBranch.filter(c => c.status === 'realizado' && new Date(c.date).getMonth() + 1 === m).reduce((s, c) => s + c.amount, 0);
    return { month: label, Orçamento: +bud.toFixed(2), Realizado: +real.toFixed(2) };
  });

  // Trend: cumulative realizado vs cumulative budget
  const trend: { month: string; Orçado: number; Realizado: number }[] = [];
  let cBud = 0, cReal = 0;
  monthly.forEach(m => {
    cBud += m.Orçamento; cReal += m.Realizado;
    trend.push({ month: m.month, Orçado: +cBud.toFixed(2), Realizado: +cReal.toFixed(2) });
  });

  // By macrobloco (month)
  const macroData = OPERATIONAL_MACROBLOCOS.map(m => {
    const bud = sumBudget(budgetsMonth, { macrobloco: m });
    const sp = consumedMonth.filter(c => c.status === 'realizado' && c.macrobloco === m).reduce((s, c) => s + c.amount, 0);
    return { macro: m, Orçamento: +bud.toFixed(2), Realizado: +sp.toFixed(2) };
  });

  // By branch (month) — only when "all"
  const branchData = ALL_BRANCHES.map(br => {
    const sp = consumedYear.filter(c => c.branch === br && c.status === 'realizado' && new Date(c.date).getMonth() + 1 === monthFilter).reduce((s, c) => s + c.amount, 0);
    return { branch: br, Realizado: +sp.toFixed(2) };
  }).filter(b => b.Realizado > 0);

  // Distribution by category (month)
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))', '#8b5cf6', '#ec4899', '#10b981'];
  const distByCategory = Array.from(byCategoryMonth.entries())
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral Operacional</h1>
          <p className="text-sm text-muted-foreground">Controle orçamentário mensal · Competência: {MONTH_LABELS_PT[monthFilter - 1]}/{YEAR}</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(monthFilter)} onValueChange={v => setMonthFilter(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_LABELS_PT.map((l, i) => <SelectItem key={i} value={String(i + 1)}>{l}/{YEAR}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as filiais</SelectItem>
              {ALL_BRANCHES.map(b => (
                <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" />Orçamento do Mês</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmtBRL(totalBudgetMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" />Realizado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmtBRL(realizadoMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><CircleDollarSign className="h-4 w-4" />Saldo</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${balanceMonth < 0 ? 'text-destructive' : ''}`}>{fmtBRL(balanceMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" />% Consumido</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pctMonth > 100 ? 'text-destructive' : pctMonth >= 80 ? 'text-warning' : ''}`}>{pctMonth.toFixed(1)}%</div>
            <Progress value={Math.min(pctMonth, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Lock className="h-4 w-4" />Comprometido (Ocupação)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmtBRL(comprometidoFixo)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4" />Comprometido (Pendente/Aprovado)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmtBRL(comprometidoMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Receipt className="h-4 w-4" />Lançamentos no Mês</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{launchCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><AlertCircle className="h-4 w-4" />Cat. Estouradas / 80%+</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{overBudgetCats.length} / {nearLimitCats.length}</div></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução Mensal {YEAR}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtBRLk} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="Orçamento" fill="hsl(var(--primary))" />
                <Bar dataKey="Realizado" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tendência Acumulada</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtBRLk} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="Orçado" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="Realizado" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Por Macrobloco (mês)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={macroData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={fmtBRLk} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="macro" tick={{ fontSize: 10 }} width={140} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="Orçamento" fill="hsl(var(--primary))" />
                <Bar dataKey="Realizado" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{branchFilter === 'all' ? 'Gasto por Filial (mês)' : 'Distribuição por Categoria (mês)'}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              {branchFilter === 'all' ? (
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtBRLk} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="Realizado" fill="hsl(var(--primary))" />
                </BarChart>
              ) : (
                <RPieChart>
                  <Pie data={distByCategory} dataKey="value" nameKey="name" outerRadius={100} label={(e) => e.name}>
                    {distByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                </RPieChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" />Categorias Estouradas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overBudgetCats.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma categoria com estouro neste mês.</p>}
            {overBudgetCats.map(o => (
              <div key={o.category} className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-2">
                <div>
                  <p className="text-sm font-medium">{o.category}</p>
                  <p className="text-xs text-muted-foreground">{fmtBRL(o.spent)} / {fmtBRL(o.budget)}</p>
                </div>
                <Badge variant="destructive">+{(((o.spent - o.budget) / o.budget) * 100).toFixed(0)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-warning"><AlertTriangle className="h-4 w-4" />Acima de 80%</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {nearLimitCats.length === 0 && <p className="text-sm text-muted-foreground">Tudo sob controle.</p>}
            {nearLimitCats.map(o => (
              <div key={o.category} className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 p-2">
                <div>
                  <p className="text-sm font-medium">{o.category}</p>
                  <p className="text-xs text-muted-foreground">{fmtBRL(o.spent)} / {fmtBRL(o.budget)}</p>
                </div>
                <Badge className="bg-warning/20 text-warning hover:bg-warning/20">{o.pct.toFixed(0)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Filiais em Risco</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {branchFilter !== 'all' && <p className="text-sm text-muted-foreground">Selecione "Todas as filiais" para ver este alerta.</p>}
            {branchFilter === 'all' && branchRisk.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma filial em risco neste mês.</p>}
            {branchFilter === 'all' && branchRisk.map(b => (
              <div key={b.branch} className="flex items-center justify-between rounded-md border bg-muted/30 p-2">
                <div>
                  <p className="text-sm font-medium">{BRANCH_LABELS[b.branch] || b.branch}</p>
                  <p className="text-xs text-muted-foreground">{fmtBRL(b.spent)} / {fmtBRL(b.budget)}</p>
                </div>
                <Badge variant={b.pct > 100 ? 'destructive' : 'default'}>{b.pct.toFixed(0)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Sem Classificação / Sem Orçamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Lançamentos sem categoria conhecida</p>
              {unclassified.length === 0 && <p className="text-sm text-muted-foreground">Nenhum.</p>}
              {unclassified.slice(0, 4).map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-md border bg-muted/30 p-2 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.description}</p>
                    <p className="text-xs text-muted-foreground">{u.category || '—'} · {u.branch}</p>
                  </div>
                  <Badge variant="outline">{fmtBRL(u.amount)}</Badge>
                </div>
              ))}
              {unclassified.length > 4 && <p className="text-xs text-muted-foreground">+{unclassified.length - 4} outros</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Categorias com despesa, mas sem orçamento</p>
              {categoriesWithoutBudget.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma.</p>}
              {categoriesWithoutBudget.map(c => (
                <div key={c.category} className="flex items-center justify-between rounded-md border bg-muted/30 p-2 mb-1">
                  <p className="text-sm font-medium">{c.category}</p>
                  <Badge variant="outline">{fmtBRL(c.spent)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
