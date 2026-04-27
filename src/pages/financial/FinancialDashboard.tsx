import { useMemo } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { DollarSign, CreditCard, FileText, TrendingUp, AlertTriangle, CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { format, parseISO, isSameMonth, differenceInDays, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { normalizeSupplierName, supplierKey } from '@/lib/utils';

const COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)', 'hsl(190, 90%, 50%)',
  'hsl(330, 80%, 55%)', 'hsl(45, 93%, 47%)', 'hsl(160, 60%, 45%)',
  'hsl(280, 65%, 60%)',
];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const StackedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cartao = payload.find((p: any) => p.dataKey === 'cartao');
  const solic = payload.find((p: any) => p.dataKey === 'solicitacoes');
  const total = (cartao ? Number(cartao.value) : 0) + (solic ? Number(solic.value) : 0);
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg min-w-[180px]">
      {label && <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>}
      {cartao && Number(cartao.value) > 0 && (
        <p className="text-sm font-semibold" style={{ color: 'hsl(221, 83%, 53%)' }}>
          Cartão Corporativo: {fmt(Number(cartao.value))}
        </p>
      )}
      {solic && Number(solic.value) > 0 && (
        <p className="text-sm font-semibold" style={{ color: 'hsl(142, 71%, 45%)' }}>
          Solicitações: {fmt(Number(solic.value))}
        </p>
      )}
      <p className="text-sm font-bold mt-1 pt-1 border-t border-border">
        Total: {fmt(total)}
      </p>
    </div>
  );
};

const EvolutionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cartao = payload.find((p: any) => p.dataKey === 'despesas');
  const solic = payload.find((p: any) => p.dataKey === 'solicitacoes');
  const total = payload.find((p: any) => p.dataKey === 'total');
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg min-w-[180px]">
      {label && <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>}
      {cartao && (
        <p className="text-sm font-semibold" style={{ color: cartao.color }}>
          Cartão Corporativo: {fmt(Number(cartao.value))}
        </p>
      )}
      {solic && (
        <p className="text-sm font-semibold" style={{ color: solic.color }}>
          Solicitações: {fmt(Number(solic.value))}
        </p>
      )}
      {total && (
        <p className="text-sm font-bold mt-1 pt-1 border-t border-border" style={{ color: total.color }}>
          Total: {fmt(Number(total.value))}
        </p>
      )}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{d.name}</p>
      <p className="text-sm font-semibold" style={{ color: d.payload.fill }}>{fmt(Number(d.value))}</p>
    </div>
  );
};

export default function FinancialDashboard() {
  const { data: allExpenses = [] } = useExpenses();
  const { data: allRequests = [] } = usePaymentRequests();
  const now = new Date();

  // Filtrar apenas dados a partir de Janeiro/2026
  const cutoffDate = '2026-01-01';
  const expenses = useMemo(() => allExpenses.filter(e => e.expense_date >= cutoffDate), [allExpenses]);
  const requests = useMemo(() => allRequests.filter(r => (r.request_date || r.created_at) >= cutoffDate), [allRequests]);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalRequests = requests.reduce((s, r) => s + Number(r.amount), 0);
  const monthExpenses = expenses
    .filter(e => isSameMonth(parseISO(e.expense_date), now))
    .reduce((s, e) => s + Number(e.amount), 0);
  const monthRequests = requests
    .filter(r => isSameMonth(parseISO(r.request_date || r.created_at), now))
    .reduce((s, r) => s + Number(r.amount), 0);
  const pendingNf = expenses.filter(e => !e.receipt_url).length;
  const pendingRequests = requests.filter(r => r.status === 'pendente').length;

  const currentMonthName = format(now, 'MMMM', { locale: ptBR });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // --- Alerts ---
  const daysToEndOfMonth = differenceInDays(endOfMonth(now), now);

  const expensesMissingNf = expenses.filter(e => !e.receipt_url && isSameMonth(parseISO(e.expense_date), now));
  const requestsMissingNf = requests.filter(r => !r.receipt_url && isSameMonth(parseISO(r.request_date || r.created_at), now));

  const upcomingDueRequests = requests.filter(r => {
    if (r.status === 'pago' || !r.due_date) return false;
    const due = parseISO(r.due_date);
    const diff = differenceInDays(due, now);
    return diff >= 0 && diff <= 7;
  });

  const overdueRequests = requests.filter(r => {
    if (r.status === 'pago' || !r.due_date) return false;
    return differenceInDays(parseISO(r.due_date), now) < 0;
  });

  // --- Chart data ---

  const monthlyEvolution = useMemo(() => {
    const map: Record<string, { despesas: number; solicitacoes: number }> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(2026, i, 1);
      const key = format(d, 'MMM/yy', { locale: ptBR });
      map[key] = { despesas: 0, solicitacoes: 0 };
    }
    expenses.forEach(e => {
      const key = format(parseISO(e.expense_date), 'MMM/yy', { locale: ptBR });
      if (map[key]) map[key].despesas += Number(e.amount);
    });
    requests.forEach(r => {
      const key = format(parseISO(r.request_date || r.created_at), 'MMM/yy', { locale: ptBR });
      if (map[key]) map[key].solicitacoes += Number(r.amount);
    });
    return Object.entries(map).map(([name, v]) => ({
      name,
      ...v,
      total: v.despesas + v.solicitacoes,
    }));
  }, [expenses, requests]);

  // Por empresa (cartão + solicitações)
  const byCompany = useMemo(() => {
    const map: Record<string, { cartao: number; solicitacoes: number }> = {};
    expenses.forEach(e => {
      if (!map[e.company]) map[e.company] = { cartao: 0, solicitacoes: 0 };
      map[e.company].cartao += Number(e.amount);
    });
    requests.forEach(r => {
      if (!map[r.company]) map[r.company] = { cartao: 0, solicitacoes: 0 };
      map[r.company].solicitacoes += Number(r.amount);
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, total: v.cartao + v.solicitacoes }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, requests]);

  // Por centro de custo (cartão + solicitações)
  const byCostCenter = useMemo(() => {
    const map: Record<string, { cartao: number; solicitacoes: number }> = {};
    expenses.forEach(e => {
      if (!map[e.cost_center]) map[e.cost_center] = { cartao: 0, solicitacoes: 0 };
      map[e.cost_center].cartao += Number(e.amount);
    });
    requests.forEach(r => {
      if (!map[r.cost_center]) map[r.cost_center] = { cartao: 0, solicitacoes: 0 };
      map[r.cost_center].solicitacoes += Number(r.amount);
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, total: v.cartao + v.solicitacoes }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, requests]);

  // Por categoria (cartão + solicitações)
  const byCategory = useMemo(() => {
    const map: Record<string, { cartao: number; solicitacoes: number }> = {};
    expenses.forEach(e => {
      if (!map[e.category]) map[e.category] = { cartao: 0, solicitacoes: 0 };
      map[e.category].cartao += Number(e.amount);
    });
    requests.forEach(r => {
      if (!map[r.category]) map[r.category] = { cartao: 0, solicitacoes: 0 };
      map[r.category].solicitacoes += Number(r.amount);
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, total: v.cartao + v.solicitacoes }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, requests]);

  // Top 10 fornecedores (despesas + solicitações) — agrupado case-insensitive
  const topSuppliers = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    const add = (rawName: string | undefined | null, amount: number) => {
      const display = normalizeSupplierName(rawName);
      if (!display) return;
      const key = supplierKey(display);
      if (!map[key]) map[key] = { name: display, value: 0 };
      map[key].value += amount;
    };
    requests.forEach(r => add(r.supplier, Number(r.amount)));
    expenses.forEach(e => add((e as any).supplier, Number(e.amount)));
    return Object.values(map)
      .map(({ name, value }) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [requests, expenses]);

  const hasAlerts = expensesMissingNf.length > 0 || requestsMissingNf.length > 0 || upcomingDueRequests.length > 0 || overdueRequests.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo Financeiro</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={CreditCard} label="Total Despesas" value={fmt(totalExpenses)} color="text-blue-600 bg-blue-100 dark:bg-blue-900/30" />
        <KpiCard icon={FileText} label="Total Solicitações" value={fmt(totalRequests)} color="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" />
        <KpiCard icon={CalendarDays} label={`Despesas (${capitalizedMonth})`} value={fmt(monthExpenses)} color="text-violet-600 bg-violet-100 dark:bg-violet-900/30" />
        <KpiCard icon={CalendarDays} label={`Solicitações (${capitalizedMonth})`} value={fmt(monthRequests)} color="text-amber-600 bg-amber-100 dark:bg-amber-900/30" />
        <KpiCard icon={AlertTriangle} label="Pendentes de NF" value={String(pendingNf)} color="text-red-600 bg-red-100 dark:bg-red-900/30" />
        <KpiCard icon={TrendingUp} label="Solicitações Pendentes de Pagamento" value={String(pendingRequests)} color="text-orange-600 bg-orange-100 dark:bg-orange-900/30" />
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Alertas — Faltam {daysToEndOfMonth} dias para o fim do mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueRequests.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Solicitações vencidas</AlertTitle>
                <AlertDescription>
                  <span className="font-semibold">{overdueRequests.length}</span> solicitação(ões) com vencimento expirado:
                  <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
                    {overdueRequests.slice(0, 5).map(r => (
                      <li key={r.id}>
                        {r.description} — {fmt(Number(r.amount))} — venceu em {format(parseISO(r.due_date!), 'dd/MM/yyyy')}
                      </li>
                    ))}
                    {overdueRequests.length > 5 && <li>...e mais {overdueRequests.length - 5}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {upcomingDueRequests.length > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Vencimentos próximos (até 7 dias)</AlertTitle>
                <AlertDescription>
                  <span className="font-semibold">{upcomingDueRequests.length}</span> solicitação(ões) com vencimento próximo:
                  <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
                    {upcomingDueRequests.slice(0, 5).map(r => (
                      <li key={r.id}>
                        {r.description} — {fmt(Number(r.amount))} — vence em {format(parseISO(r.due_date!), 'dd/MM/yyyy')}
                      </li>
                    ))}
                    {upcomingDueRequests.length > 5 && <li>...e mais {upcomingDueRequests.length - 5}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {expensesMissingNf.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Despesas sem comprovante neste mês</AlertTitle>
                <AlertDescription>
                  <span className="font-semibold">{expensesMissingNf.length}</span> despesa(s) do mês sem NF anexada.
                </AlertDescription>
              </Alert>
            )}

            {requestsMissingNf.length > 0 && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Solicitações sem comprovante neste mês</AlertTitle>
                <AlertDescription>
                  <span className="font-semibold">{requestsMissingNf.length}</span> solicitação(ões) do mês sem comprovante anexado.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evolução Mensal */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Evolução Mensal (Despesas vs Solicitações)</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.0', '')}k` : `R$${v}`} tick={{ fontSize: 11 }} className="fill-muted-foreground" width={70} allowDecimals={false} tickCount={6} />
              <Tooltip content={<EvolutionTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="despesas" name="Cartão Corporativo" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="solicitacoes" name="Solicitações" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="total" name="Tendência Geral" stroke="hsl(280, 65%, 60%)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Por Empresa + Por Categoria */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Gastos por Empresa</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCompany} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.0', '')}k` : `R$${v}`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={<StackedTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="cartao" name="Cartão Corporativo" stackId="a" fill="hsl(221, 83%, 53%)" />
                <Bar dataKey="solicitacoes" name="Solicitações" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Gastos por Categoria</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.0', '')}k` : `R$${v}`} tick={{ fontSize: 11 }} width={70} />
                <Tooltip content={<StackedTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="cartao" name="Cartão Corporativo" stackId="a" fill="hsl(221, 83%, 53%)" />
                <Bar dataKey="solicitacoes" name="Solicitações" stackId="a" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Por Centro de Custo */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Gastos por Centro de Custo</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCostCenter}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.0', '')}k` : `R$${v}`} tick={{ fontSize: 11 }} width={70} />
              <Tooltip content={<StackedTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cartao" name="Cartão Corporativo" stackId="a" fill="hsl(221, 83%, 53%)" />
              <Bar dataKey="solicitacoes" name="Solicitações" stackId="a" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 10 Fornecedores */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Top 10 Fornecedores</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSuppliers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.0', '')}k` : `R$${v}`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]}>
                {topSuppliers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const [iconColor, bgColor] = color.split(' ').reduce<[string, string]>((acc, c) => {
    if (c.startsWith('text-')) acc[0] = c;
    else acc[1] = (acc[1] ? acc[1] + ' ' : '') + c;
    return acc;
  }, ['', '']);

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2.5 ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
