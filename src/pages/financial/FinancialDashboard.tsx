import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { KpiCard } from '@/components/KpiCard';
import { DollarSign, CreditCard, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(210,60%,50%)', 'hsl(150,50%,45%)', 'hsl(30,80%,55%)'];

export default function FinancialDashboard() {
  const { data: expenses = [] } = useExpenses();
  const { data: requests = [] } = usePaymentRequests();

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalRequests = requests.reduce((s, r) => s + Number(r.amount), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pendente').length;
  const pendingRequests = requests.filter(r => r.status === 'pendente').length;

  const byCategoryData = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const byCostCenter = Object.entries(
    [...expenses, ...requests].reduce<Record<string, number>>((acc, item) => {
      acc[item.cost_center] = (acc[item.cost_center] || 0) + Number(item.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Despesas (Cartão)" value={fmt(totalExpenses)} icon={<CreditCard className="h-5 w-5" />} />
        <KpiCard title="Total Solicitações" value={fmt(totalRequests)} icon={<FileText className="h-5 w-5" />} />
        <KpiCard title="Despesas Pendentes" value={String(pendingExpenses)} icon={<DollarSign className="h-5 w-5" />} />
        <KpiCard title="Solicitações Pendentes" value={String(pendingRequests)} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                  {byCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Gastos por Centro de Custo</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCostCenter}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
