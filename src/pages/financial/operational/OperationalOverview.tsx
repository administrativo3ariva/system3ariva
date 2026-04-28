import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOperationalBudgets } from '@/hooks/use-operational-budgets';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { useRecurringExpenses, useRecurringExpenseRuns } from '@/hooks/use-recurring-expenses';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, MONTH_LABELS_PT } from '@/lib/types';
import { buildConsumedList, fmtBRL, fmtBRLk, sumBudget, COMMITTED_MACROBLOCO } from '@/lib/operational-utils';
import { AlertTriangle, TrendingUp, Wallet, CircleDollarSign, AlertCircle, Receipt, Lock, CreditCard, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList, ReferenceLine } from 'recharts';

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
const CHART_COLORS = {
  budget: 'hsl(var(--primary))',
  budgetMuted: 'hsl(var(--primary) / 0.32)',
  realized: 'hsl(var(--success))',
  realizedMuted: 'hsl(var(--success) / 0.72)',
  committed: 'hsl(var(--warning))',
} as const;

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

  const launchCount = consumedMonth.length;
  const cardRealized = consumedMonth.filter(c => c.status === 'realizado' && c.source === 'card').reduce((s, c) => s + c.amount, 0);
  const requestRealized = consumedMonth.filter(c => c.status === 'realizado' && c.source === 'request').reduce((s, c) => s + c.amount, 0);
  const categoriesWithRealized = byCategoryMonth.size;

  // Charts: monthly evolution (12 months)
  const monthly = MONTH_LABELS_PT.map((label, i) => {
    const m = i + 1;
    const bud = sumBudget(budgetsBranch, { month: m });
    const real = consumedBranch.filter(c => c.status === 'realizado' && new Date(c.date).getMonth() + 1 === m).reduce((s, c) => s + c.amount, 0);
    const comp = consumedBranch.filter(c => c.status === 'comprometido' && new Date(c.date).getMonth() + 1 === m).reduce((s, c) => s + c.amount, 0);
    return { month: label, Orçamento: +bud.toFixed(2), Realizado: +real.toFixed(2), Comprometido: +comp.toFixed(2) };
  });

  const categoryExecution = Array.from(new Set([
    ...budgetsMonth.map(b => b.category),
    ...consumedMonth.map(c => c.category),
  ])).map(category => {
    const budget = budgetByCategoryMonth.get(category) || 0;
    const real = consumedMonth.filter(c => c.category === category && c.status === 'realizado').reduce((s, c) => s + c.amount, 0);
    const committed = consumedMonth.filter(c => c.category === category && c.status === 'comprometido').reduce((s, c) => s + c.amount, 0);
    const pct = budget > 0 ? (real / budget) * 100 : real > 0 ? 999 : 0;
    return { category, Orçamento: +budget.toFixed(2), Realizado: +real.toFixed(2), Comprometido: +committed.toFixed(2), pct };
  }).filter(c => c.Orçamento > 0 || c.Realizado > 0 || c.Comprometido > 0)
    .sort((a, b) => (b.pct - a.pct) || (b.Realizado - a.Realizado))
    .slice(0, 8);

  const topCategoriesBySpend = Array.from(byCategoryMonth.entries())
    .map(([category, spent]) => ({ category, spent, share: realizadoMonth > 0 ? (spent / realizadoMonth) * 100 : 0 }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const largestAvailableBalances = budgetsMonth
    .map(b => {
      const spent = byCategoryMonth.get(b.category) || 0;
      const balance = Number(b.amount) - spent;
      return { category: b.category, budget: Number(b.amount), spent, balance };
    })
    .filter(item => item.budget > 0 && item.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  // By macrobloco (month)
  const macroData = OPERATIONAL_MACROBLOCOS.map(m => {
    const bud = sumBudget(budgetsMonth, { macrobloco: m });
    const sp = consumedMonth.filter(c => c.status === 'realizado' && c.macrobloco === m).reduce((s, c) => s + c.amount, 0);
    const cp = consumedMonth.filter(c => c.status === 'comprometido' && c.macrobloco === m).reduce((s, c) => s + c.amount, 0);
    return { macro: m, Orçamento: +bud.toFixed(2), Realizado: +sp.toFixed(2), Comprometido: +cp.toFixed(2) };
  });

  // Macroblock data with % consumed for label
  const macroDataPct = macroData
    .map(m => ({ ...m, pct: m.Orçamento > 0 ? (m.Realizado / m.Orçamento) * 100 : 0 }))
    .sort((a, b) => b.Orçamento - a.Orçamento);

  // Branch data sorted by Realizado, with budget reference
  const branchDataFull = ALL_BRANCHES.map(br => {
    const sp = consumedYear.filter(c => c.branch === br && c.status === 'realizado' && new Date(c.date).getMonth() + 1 === monthFilter).reduce((s, c) => s + c.amount, 0);
    const cp = consumedYear.filter(c => c.branch === br && c.status === 'comprometido' && new Date(c.date).getMonth() + 1 === monthFilter).reduce((s, c) => s + c.amount, 0);
    const bd = sumBudget(budgets, { branch: br, month: monthFilter });
    return { branch: br, Realizado: +sp.toFixed(2), Comprometido: +cp.toFixed(2), Orçamento: +bd.toFixed(2) };
  }).filter(b => b.Realizado > 0 || b.Comprometido > 0 || b.Orçamento > 0).sort((a, b) => b.Realizado - a.Realizado);

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
          <CardContent><div className="number-safe text-2xl font-bold">{fmtBRL(totalBudgetMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" />Realizado</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold">{fmtBRL(realizadoMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><CircleDollarSign className="h-4 w-4" />Saldo</CardTitle></CardHeader>
          <CardContent><div className={`number-safe text-2xl font-bold ${balanceMonth < 0 ? 'text-destructive' : ''}`}>{fmtBRL(balanceMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" />% Consumido</CardTitle></CardHeader>
          <CardContent>
            <div className={`number-safe text-2xl font-bold ${pctMonth > 100 ? 'text-destructive' : pctMonth >= 80 ? 'text-warning' : ''}`}>{pctMonth.toFixed(1)}%</div>
            <Progress value={Math.min(pctMonth, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Lock className="h-4 w-4" />Comprometido (Ocupação)</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold">{fmtBRL(comprometidoFixo)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-4 w-4" />Comprometido (Pendente/Aprovado)</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold">{fmtBRL(comprometidoMonth)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Receipt className="h-4 w-4" />Lançamentos no Mês</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold">{launchCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><AlertCircle className="h-4 w-4" />Cat. Estouradas / 80%+</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold">{overBudgetCats.length} / {nearLimitCats.length}</div></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolução Mensal — barras agrupadas + linha de meta */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução Mensal {YEAR}</CardTitle>
            <p className="text-xs text-muted-foreground">Orçamento previsto vs. realizado por mês</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="20%">
                <defs>
                  <linearGradient id="gradBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.budget} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS.budget} stopOpacity={0.45} />
                  </linearGradient>
                  <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.realized} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={CHART_COLORS.realized} stopOpacity={0.62} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtBRLk} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                <ReferenceLine x={MONTH_LABELS_PT[monthFilter - 1]} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: 'Mês', fill: 'hsl(var(--warning))', fontSize: 10, position: 'top' }} />
                <Bar dataKey="Orçamento" fill="url(#gradBudget)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Realizado" fill="url(#gradReal)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Comprometido" fill={CHART_COLORS.committed} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categorias Críticas — execução do mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Categorias Críticas · {MONTH_LABELS_PT[monthFilter - 1]}</CardTitle>
            <p className="text-xs text-muted-foreground">Top categorias por consumo do orçamento mensal</p>
          </CardHeader>
          <CardContent>
            {categoryExecution.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Sem dados para o mês selecionado</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryExecution} layout="vertical" margin={{ top: 8, right: 56, left: 0, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={fmtBRLk} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} width={165} axisLine={false} tickLine={false} />
                  <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  <Bar dataKey="Orçamento" fill={CHART_COLORS.budgetMuted} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  <Bar dataKey="Realizado" fill={CHART_COLORS.realized} radius={[0, 4, 4, 0]} maxBarSize={18}>
                    <LabelList dataKey="pct" position="right" formatter={(v: number) => v >= 999 ? 's/orç.' : `${v.toFixed(0)}%`} style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  </Bar>
                  <Bar dataKey="Comprometido" fill={CHART_COLORS.committed} radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por Macrobloco — barras horizontais com % consumido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Macrobloco · {MONTH_LABELS_PT[monthFilter - 1]}</CardTitle>
            <p className="text-xs text-muted-foreground">Orçado, realizado e % de consumo por bloco</p>
          </CardHeader>
          <CardContent>
            {macroDataPct.every(m => m.Orçamento === 0 && m.Realizado === 0) ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Sem dados para o mês selecionado</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={macroDataPct} layout="vertical" margin={{ top: 8, right: 60, left: 0, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={fmtBRLk} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="macro" tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} width={170} axisLine={false} tickLine={false} />
                  <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  <Bar dataKey="Orçamento" fill={CHART_COLORS.budgetMuted} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  <Bar dataKey="Realizado" fill={CHART_COLORS.realized} radius={[0, 4, 4, 0]} maxBarSize={18}>
                    <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v.toFixed(0)}%`} style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  </Bar>
                  <Bar dataKey="Comprometido" fill={CHART_COLORS.committed} radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Filial (mês) com Orçamento vs Realizado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Filial · {MONTH_LABELS_PT[monthFilter - 1]}</CardTitle>
            <p className="text-xs text-muted-foreground">Orçamento, realizado e comprometido por filial</p>
          </CardHeader>
          <CardContent>
            {branchFilter !== 'all' ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Selecione todas as filiais para comparar unidades</div>
            ) : branchDataFull.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Sem lançamentos no mês</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchDataFull} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="branch" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtBRLk} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  <Bar dataKey="Orçamento" fill={CHART_COLORS.budgetMuted} radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="Realizado" fill={CHART_COLORS.realized} radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="Comprometido" fill={CHART_COLORS.committed} radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            )}
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
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Maiores Gastos do Mês</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topCategoriesBySpend.length === 0 && <p className="text-sm text-muted-foreground">Nenhum realizado neste mês.</p>}
            {topCategoriesBySpend.map(item => (
              <div key={item.category} className="rounded-md border bg-muted/20 p-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium truncate">{item.category}</p>
                  <Badge variant="outline" className="number-safe shrink min-w-0 justify-end text-right">{fmtBRL(item.spent)}</Badge>
                </div>
                <Progress value={Math.min(item.share, 100)} className="mt-2 h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-primary" />Maiores Saldos Disponíveis</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {largestAvailableBalances.length === 0 && <p className="text-sm text-muted-foreground">Sem saldo positivo nas categorias orçadas.</p>}
            {largestAvailableBalances.map(item => (
              <div key={item.category} className="flex items-center justify-between rounded-md border bg-muted/20 p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.category}</p>
                  <p className="text-xs text-muted-foreground">Usado {fmtBRL(item.spent)} de {fmtBRL(item.budget)}</p>
                </div>
                <Badge className="number-safe shrink min-w-0 justify-end bg-primary/15 text-right text-primary hover:bg-primary/15">{fmtBRL(item.balance)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-success" />Composição do Realizado</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CreditCard className="h-3.5 w-3.5" />Cartão</div>
                <div className="number-safe mt-1 text-lg font-semibold">{fmtBRL(cardRealized)}</div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" />Solicitações</div>
                <div className="number-safe mt-1 text-lg font-semibold">{fmtBRL(requestRealized)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/20 p-2">
              <span className="text-sm text-muted-foreground">Categorias com realizado</span>
              <Badge variant="outline">{categoriesWithRealized}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
