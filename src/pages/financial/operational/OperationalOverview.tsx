import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOperationalBudgets } from '@/hooks/use-operational-budgets';
import { useOperationalExpenses } from '@/hooks/use-operational-expenses';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, MONTH_LABELS_PT } from '@/lib/types';
import { buildConsumedList, fmtBRL, fmtBRLk, isKnownCategory, budgetMonthAmount } from '@/lib/operational-utils';
import { AlertTriangle, TrendingUp, Wallet, CircleDollarSign, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const YEAR = 2026;

export default function OperationalOverview() {
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const { data: budgets = [] } = useOperationalBudgets(YEAR);
  const { data: opExpenses = [] } = useOperationalExpenses();
  const { data: expenses = [] } = useExpenses();
  const { data: payments = [] } = usePaymentRequests();

  const consumed = useMemo(() => buildConsumedList({
    year: YEAR,
    expenses: expenses as Parameters<typeof buildConsumedList>[0]['expenses'],
    payments: payments as Parameters<typeof buildConsumedList>[0]['payments'],
    opExpenses,
  }), [expenses, payments, opExpenses]);

  const filteredBudgets = branchFilter === 'all' ? budgets : budgets.filter(b => b.branch === branchFilter);
  const filteredConsumed = branchFilter === 'all' ? consumed : consumed.filter(c => c.branch === branchFilter);

  const totalBudget = filteredBudgets.reduce((s, b) => s + Number(b.annual_amount), 0);
  const totalSpent = filteredConsumed.reduce((s, c) => s + c.amount, 0);
  const balance = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Group consumed by category
  const byCategory = new Map<string, number>();
  filteredConsumed.forEach(c => byCategory.set(c.category, (byCategory.get(c.category) || 0) + c.amount));

  // Budget per category (filtered)
  const budgetByCategory = new Map<string, number>();
  filteredBudgets.forEach(b => budgetByCategory.set(b.category, (budgetByCategory.get(b.category) || 0) + Number(b.annual_amount)));

  // Alerts
  const overBudgetCats: { category: string; spent: number; budget: number }[] = [];
  const nearLimitCats: { category: string; spent: number; budget: number; pct: number }[] = [];
  byCategory.forEach((spent, cat) => {
    const bud = budgetByCategory.get(cat) || 0;
    if (bud === 0) return;
    const p = (spent / bud) * 100;
    if (p > 100) overBudgetCats.push({ category: cat, spent, budget: bud });
    else if (p >= 80) nearLimitCats.push({ category: cat, spent, budget: bud, pct: p });
  });

  const unclassified = filteredConsumed.filter(c => !isKnownCategory(c.category));

  // Monthly chart: 12 months × budget vs spent
  const monthly = MONTH_LABELS_PT.map((label, i) => {
    const budgetMonth = filteredBudgets.reduce((s, b) => s + budgetMonthAmount(b, i), 0);
    const spentMonth = filteredConsumed
      .filter(c => new Date(c.date).getMonth() === i)
      .reduce((s, c) => s + c.amount, 0);
    return { month: label, Orçamento: +budgetMonth.toFixed(2), Consumido: +spentMonth.toFixed(2) };
  });

  // By macrobloco
  const macroData = OPERATIONAL_MACROBLOCOS.map(m => {
    const bud = filteredBudgets.filter(b => b.macrobloco === m).reduce((s, b) => s + Number(b.annual_amount), 0);
    const sp = filteredConsumed.filter(c => c.macrobloco === m).reduce((s, c) => s + c.amount, 0);
    return { macro: m, Orçamento: +bud.toFixed(2), Consumido: +sp.toFixed(2) };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral Operacional</h1>
          <p className="text-sm text-muted-foreground">Consumo do orçamento {YEAR} e alertas em tempo real</p>
        </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" />Orçamento Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmtBRL(totalBudget)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" />Consumido</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmtBRL(totalSpent)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><CircleDollarSign className="h-4 w-4" />Saldo</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${balance < 0 ? 'text-destructive' : ''}`}>{fmtBRL(balance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" />% Consumido</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pct > 100 ? 'text-destructive' : pct >= 80 ? 'text-yellow-500' : ''}`}>{pct.toFixed(1)}%</div>
            <Progress value={Math.min(pct, 100)} className="mt-2" />
          </CardContent>
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
                <Bar dataKey="Consumido" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Por Macrobloco</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={macroData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={fmtBRLk} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="macro" tick={{ fontSize: 10 }} width={140} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="Orçamento" fill="hsl(var(--primary))" />
                <Bar dataKey="Consumido" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" />Estouro de Orçamento</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overBudgetCats.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma categoria com estouro.</p>}
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
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-yellow-500"><AlertTriangle className="h-4 w-4" />Categorias Acima de 80%</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {nearLimitCats.length === 0 && <p className="text-sm text-muted-foreground">Tudo sob controle.</p>}
            {nearLimitCats.map(o => (
              <div key={o.category} className="flex items-center justify-between rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2">
                <div>
                  <p className="text-sm font-medium">{o.category}</p>
                  <p className="text-xs text-muted-foreground">{fmtBRL(o.spent)} / {fmtBRL(o.budget)}</p>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/20">{o.pct.toFixed(0)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Sem Classificação</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {unclassified.length === 0 && <p className="text-sm text-muted-foreground">Todos os lançamentos estão classificados.</p>}
            {unclassified.slice(0, 6).map((u, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border bg-muted/30 p-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.description}</p>
                  <p className="text-xs text-muted-foreground">{u.category || '—'} · {u.branch}</p>
                </div>
                <Badge variant="outline">{fmtBRL(u.amount)}</Badge>
              </div>
            ))}
            {unclassified.length > 6 && <p className="text-xs text-muted-foreground">+{unclassified.length - 6} outros…</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
