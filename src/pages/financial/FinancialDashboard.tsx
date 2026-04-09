import { useMemo } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { DollarSign, CreditCard, FileText, TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { format, parseISO, startOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)', 'hsl(190, 90%, 50%)',
  'hsl(330, 80%, 55%)', 'hsl(45, 93%, 47%)', 'hsl(160, 60%, 45%)',
  'hsl(280, 65%, 60%)',
];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {fmt(Number(p.value))}
        </p>
      ))}
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
  const { data: expenses = [] } = useExpenses();
  const { data: requests = [] } = usePaymentRequests();
  const now = new Date();

  // KPI totals
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalRequests = requests.reduce((s, r) => s + Number(r.amount), 0);
  const monthExpenses = expenses
    .filter(e => isSameMonth(parseISO(e.expense_date), now))
    .reduce((s, e) => s + Number(e.amount), 0);
  const monthRequests = requests
    .filter(r => isSameMonth(parseISO(r.created_at), now))
    .reduce((s, r) => s + Number(r.amount), 0);
  const pendingNf = expenses.filter(e => !e.receipt_url).length;
  const pendingRequests = requests.filter(r => r.status === 'pendente').length;

  // --- Chart data ---

  // Evolução mensal de despesas (últimos 12 meses)
  const monthlyEvolution = useMemo(() => {
    const map: Record<string, { despesas: number; solicitacoes: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, 'MMM/yy', { locale: ptBR });
      map[key] = { despesas: 0, solicitacoes: 0 };
    }
    expenses.forEach(e => {
      const d = parseISO(e.expense_date);
      const key = format(d, 'MMM/yy', { locale: ptBR });
      if (map[key]) map[key].despesas += Number(e.amount);
    });
    requests.forEach(r => {
      const d = parseISO(r.created_at);
      const key = format(d, 'MMM/yy', { locale: ptBR });
      if (map[key]) map[key].solicitacoes += Number(r.amount);
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [expenses, requests]);

  // Por empresa
  const byCompany = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.company] = (map[e.company] || 0) + Number(e.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Por centro de custo
  const byCostCenter = useMemo(() => {
    const map: Record<string, number> = {};
    [...expenses, ...requests].forEach(item => {
      map[item.cost_center] = (map[item.cost_center] || 0) + Number(item.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses, requests]);

  // Por categoria
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Top 10 fornecedores (solicitações)
  const topSuppliers = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => {
      const name = r.supplier || 'Sem fornecedor';
      map[name] = (map[name] || 0) + Number(r.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [requests]);

  const currentMonth = format(now, 'MMMM', { locale: ptBR });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={CreditCard} label="Total Despesas" value={fmt(totalExpenses)} color="text-blue-600 bg-blue-100 dark:bg-blue-900/30" />
        <KpiCard icon={FileText} label="Total Solicitações" value={fmt(totalRequests)} color="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" />
        <KpiCard icon={CalendarDays} label={`Despesas ${currentMonth}`} value={fmt(monthExpenses)} color="text-violet-600 bg-violet-100 dark:bg-violet-900/30" />
        <KpiCard icon={CalendarDays} label={`Solicit. ${currentMonth}`} value={fmt(monthRequests)} color="text-amber-600 bg-amber-100 dark:bg-amber-900/30" />
        <KpiCard icon={AlertTriangle} label="Pendentes de NF" value={String(pendingNf)} color="text-red-600 bg-red-100 dark:bg-red-900/30" />
        <KpiCard icon={TrendingUp} label="Solicit. Pendentes" value={String(pendingRequests)} color="text-orange-600 bg-orange-100 dark:bg-orange-900/30" />
      </div>

      {/* Evolução Mensal - full width */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Evolução Mensal</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} className="fill-muted-foreground" width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="solicitacoes" name="Solicitações" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Row: Por Empresa + Por Centro de Custo */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Despesas por Empresa</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCompany} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]}>
                  {byCompany.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Gastos por Centro de Custo</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCostCenter}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Total" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]}>
                  {byCostCenter.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row: Por Categoria (Pie) + Top 10 Fornecedores */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Top 10 Fornecedores</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]}>
                  {topSuppliers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
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
