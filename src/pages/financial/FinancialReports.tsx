import { useState } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancialReports() {
  const { data: expenses = [] } = useExpenses();
  const { data: requests = [] } = usePaymentRequests();
  const [view, setView] = useState<'cost_center' | 'company' | 'category'>('cost_center');

  const allItems = [
    ...expenses.map(e => ({ ...e, source: 'cartão' as const })),
    ...requests.map(r => ({ ...r, source: 'solicitação' as const })),
  ];

  const groupBy = (key: 'cost_center' | 'company' | 'category') => {
    const map: Record<string, { cartao: number; solicitacao: number }> = {};
    allItems.forEach(item => {
      const k = item[key];
      if (!map[k]) map[k] = { cartao: 0, solicitacao: 0 };
      if (item.source === 'cartão') map[k].cartao += Number(item.amount);
      else map[k].solicitacao += Number(item.amount);
    });
    return Object.entries(map).map(([name, v]) => ({ name, cartao: v.cartao, solicitacao: v.solicitacao, total: v.cartao + v.solicitacao }));
  };

  const data = groupBy(view);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const labels = { cost_center: 'Centro de Custo', company: 'Empresa', category: 'Categoria' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
        <Select value={view} onValueChange={(v) => setView(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cost_center">Por Centro de Custo</SelectItem>
            <SelectItem value="company">Por Empresa</SelectItem>
            <SelectItem value="category">Por Categoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Gastos por {labels[view]}</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="cartao" name="Cartão Corp." fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="solicitacao" name="Solicitações" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detalhamento — {labels[view]}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels[view]}</TableHead>
                <TableHead className="text-right">Cartão Corp.</TableHead>
                <TableHead className="text-right">Solicitações</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sort((a, b) => b.total - a.total).map(row => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">{fmt(row.cartao)}</TableCell>
                  <TableCell className="text-right">{fmt(row.solicitacao)}</TableCell>
                  <TableCell className="text-right font-bold">{fmt(row.total)}</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
