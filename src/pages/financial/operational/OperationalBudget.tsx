import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOperationalBudgets } from '@/hooks/use-operational-budgets';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { useRecurringExpenses, useRecurringExpenseRuns } from '@/hooks/use-recurring-expenses';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, OPERATIONAL_CATEGORIES_BY_MACROBLOCO, MONTH_LABELS_PT } from '@/lib/types';
import { buildConsumedList, fmtBRL, sumBudget } from '@/lib/operational-utils';

const YEAR = 2026;
const NOW_MONTH = new Date().getMonth() + 1;

export default function OperationalBudget() {
  const [branch, setBranch] = useState<string>(ALL_BRANCHES[0]);
  const [month, setMonth] = useState<number>(NOW_MONTH);
  const [year] = useState<number>(YEAR);
  const { data: budgets = [] } = useOperationalBudgets(year);
  const { data: expenses = [] } = useExpenses();
  const { data: payments = [] } = usePaymentRequests();

  const consumed = useMemo(() => buildConsumedList({
    year, month,
    expenses: expenses as Parameters<typeof buildConsumedList>[0]['expenses'],
    payments: payments as Parameters<typeof buildConsumedList>[0]['payments'],
  }), [expenses, payments, year, month]);

  const branchBudgets = budgets.filter(b => b.branch === branch && b.month === month);
  const branchConsumed = consumed.filter(c => c.branch === branch && c.status === 'realizado');

  const lookup = new Map<string, { budget: number; spent: number }>();
  branchBudgets.forEach(b => {
    lookup.set(`${b.macrobloco}|${b.category}`, { budget: Number(b.amount), spent: 0 });
  });
  branchConsumed.forEach(c => {
    const key = `${c.macrobloco}|${c.category}`;
    const cur = lookup.get(key) || { budget: 0, spent: 0 };
    cur.spent += c.amount;
    lookup.set(key, cur);
  });

  const totalBudget = sumBudget(branchBudgets);
  const totalSpent = branchConsumed.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Orçamento {MONTH_LABELS_PT[month - 1]}/{year}</h1>
          <p className="text-sm text-muted-foreground">Orçamento mensal por filial × macrobloco × categoria — Realizado abatido automaticamente</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_LABELS_PT.map((l, i) => <SelectItem key={i} value={String(i + 1)}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_BRANCHES.map(b => (
                <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Orçamento da filial no mês</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmtBRL(totalBudget)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Realizado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmtBRL(totalSpent)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldo</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? 'text-destructive' : ''}`}>{fmtBRL(totalBudget - totalSpent)}</div></CardContent></Card>
      </div>

      {OPERATIONAL_MACROBLOCOS.map(macro => {
        const cats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro];
        const macroBudget = cats.reduce((s, c) => s + (lookup.get(`${macro}|${c}`)?.budget || 0), 0);
        const macroSpent = cats.reduce((s, c) => s + (lookup.get(`${macro}|${c}`)?.spent || 0), 0);
        return (
          <Card key={macro}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">{macro}</CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Orçado: <span className="text-foreground font-semibold">{fmtBRL(macroBudget)}</span></span>
                  <span className="text-muted-foreground">Realizado: <span className="text-foreground font-semibold">{fmtBRL(macroSpent)}</span></span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Orçamento Mensal</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
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
                          {v.budget === 0 ? (
                            v.spent > 0 ? <Badge variant="outline" className="border-warning text-warning">Sem orçamento</Badge> : <Badge variant="outline">—</Badge>
                          ) : (
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
