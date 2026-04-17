import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOperationalBudgets } from '@/hooks/use-operational-budgets';
import { useOperationalExpenses } from '@/hooks/use-operational-expenses';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, OPERATIONAL_CATEGORIES_BY_MACROBLOCO } from '@/lib/types';
import { buildConsumedList, fmtBRL } from '@/lib/operational-utils';

const YEAR = 2026;

export default function OperationalBudget() {
  const [branch, setBranch] = useState<string>(ALL_BRANCHES[0]);
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

  const branchBudgets = budgets.filter(b => b.branch === branch);
  const branchConsumed = consumed.filter(c => c.branch === branch);

  const lookup = new Map<string, { budget: number; spent: number }>();
  branchBudgets.forEach(b => {
    lookup.set(`${b.macrobloco}|${b.category}`, { budget: Number(b.annual_amount), spent: 0 });
  });
  branchConsumed.forEach(c => {
    const key = `${c.macrobloco}|${c.category}`;
    const cur = lookup.get(key) || { budget: 0, spent: 0 };
    cur.spent += c.amount;
    lookup.set(key, cur);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Orçamento {YEAR}</h1>
          <p className="text-sm text-muted-foreground">Distribuição por filial × macrobloco × categoria</p>
        </div>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_BRANCHES.map(b => (
              <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {OPERATIONAL_MACROBLOCOS.map(macro => {
        const cats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro];
        const macroBudget = cats.reduce((s, c) => s + (lookup.get(`${macro}|${c}`)?.budget || 0), 0);
        const macroSpent = cats.reduce((s, c) => s + (lookup.get(`${macro}|${c}`)?.spent || 0), 0);
        return (
          <Card key={macro}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{macro}</CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Orçado: <span className="text-foreground font-semibold">{fmtBRL(macroBudget)}</span></span>
                  <span className="text-muted-foreground">Consumido: <span className="text-foreground font-semibold">{fmtBRL(macroSpent)}</span></span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Orçamento Anual</TableHead>
                    <TableHead className="text-right">Consumido</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">% Consumido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats.map(cat => {
                    const v = lookup.get(`${macro}|${cat}`) || { budget: 0, spent: 0 };
                    const pct = v.budget > 0 ? (v.spent / v.budget) * 100 : 0;
                    const balance = v.budget - v.spent;
                    return (
                      <TableRow key={cat}>
                        <TableCell>{cat}</TableCell>
                        <TableCell className="text-right">{fmtBRL(v.budget)}</TableCell>
                        <TableCell className="text-right">{fmtBRL(v.spent)}</TableCell>
                        <TableCell className={`text-right ${balance < 0 ? 'text-destructive' : ''}`}>{fmtBRL(balance)}</TableCell>
                        <TableCell className="text-right">
                          {v.budget === 0 ? <Badge variant="outline">Sem orçamento</Badge> : (
                            <Badge variant={pct > 100 ? 'destructive' : pct >= 80 ? 'default' : 'secondary'}>{pct.toFixed(1)}%</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
