import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOperationalBudgets, useBulkUpsertBudget, useDuplicateMonth } from '@/hooks/use-operational-budgets';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, OPERATIONAL_CATEGORIES_BY_MACROBLOCO, OperationalMacrobloco, MONTH_LABELS_PT } from '@/lib/types';
import { fmtBRL } from '@/lib/operational-utils';
import { Save, Copy } from 'lucide-react';
import { toast } from 'sonner';

const YEAR = 2026;
const NOW_MONTH = new Date().getMonth() + 1;

export default function OperationalBudgetEdit() {
  const [branch, setBranch] = useState<string>(ALL_BRANCHES[0]);
  const [month, setMonth] = useState<number>(NOW_MONTH);
  const { data: budgets = [] } = useOperationalBudgets(YEAR);
  const bulkUpsert = useBulkUpsertBudget();
  const dup = useDuplicateMonth();

  // local edit state: key = `${macro}|${cat}`, value = string amount
  const [edits, setEdits] = useState<Record<string, string>>({});

  const branchBudgets = useMemo(
    () => budgets.filter(b => b.branch === branch && b.month === month),
    [budgets, branch, month]
  );
  const lookup = useMemo(() => {
    const m = new Map<string, number>();
    branchBudgets.forEach(b => m.set(`${b.macrobloco}|${b.category}`, Number(b.amount)));
    return m;
  }, [branchBudgets]);

  function getValue(macro: string, cat: string): string {
    const key = `${macro}|${cat}`;
    if (edits[key] !== undefined) return edits[key];
    return String(lookup.get(key) ?? 0);
  }

  function setValue(macro: string, cat: string, v: string) {
    setEdits(prev => ({ ...prev, [`${macro}|${cat}`]: v }));
  }

  // Reset edits when branch/month changes
  function changeBranch(v: string) { setEdits({}); setBranch(v); }
  function changeMonth(v: number) { setEdits({}); setMonth(v); }

  async function saveBlock(macro: OperationalMacrobloco) {
    const cats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro];
    const rows = cats
      .filter(cat => edits[`${macro}|${cat}`] !== undefined)
      .map(cat => ({
        year: YEAR, month, branch,
        macrobloco: macro, category: cat,
        amount: parseFloat(edits[`${macro}|${cat}`].replace(',', '.')) || 0,
      }));
    if (rows.length === 0) return;
    await bulkUpsert.mutateAsync(rows);
    setEdits(prev => {
      const c = { ...prev };
      cats.forEach(cat => delete c[`${macro}|${cat}`]);
      return c;
    });
  }

  async function saveAll() {
    const rows: { year: number; month: number; branch: string; macrobloco: OperationalMacrobloco; category: string; amount: number }[] = [];
    OPERATIONAL_MACROBLOCOS.forEach(macro => {
      OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro].forEach(cat => {
        const k = `${macro}|${cat}`;
        if (edits[k] !== undefined) {
          rows.push({
            year: YEAR, month, branch, macrobloco: macro, category: cat,
            amount: parseFloat(edits[k].replace(',', '.')) || 0,
          });
        }
      });
    });
    if (rows.length === 0) return;
    await bulkUpsert.mutateAsync(rows);
    setEdits({});
  }

  async function duplicateFromPrevious() {
    if (month === 1) { toast.error('Janeiro não tem mês anterior em 2026'); return; }
    await dup.mutateAsync({ year: YEAR, branch, sourceMonth: month - 1, targetMonth: month });
    setEdits({});
  }

  async function applyAdjustment(percent: number) {
    if (branchBudgets.length === 0) { toast.error('Sem orçamento parametrizado para reajustar'); return; }
    const factor = 1 + percent / 100;
    const rows = branchBudgets.map(b => ({
      year: YEAR, month, branch, macrobloco: b.macrobloco, category: b.category,
      amount: +(Number(b.amount) * factor).toFixed(2),
    }));
    await bulkUpsert.mutateAsync(rows);
    setEdits({});
  }

  const dirtyCount = Object.keys(edits).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Ajustes de Orçamento</h1>
          <p className="text-sm text-muted-foreground">Edição manual por competência mensal · Mudanças não afetam lançamentos já realizados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={String(month)} onValueChange={v => changeMonth(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_LABELS_PT.map((l, i) => <SelectItem key={i} value={String(i + 1)}>{l}/{YEAR}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={branch} onValueChange={changeBranch}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_BRANCHES.map(b => (
                <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action bar */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={duplicateFromPrevious} disabled={month === 1 || dup.isPending}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Duplicar do mês anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyAdjustment(5)}>Reajuste +5%</Button>
          <Button variant="outline" size="sm" onClick={() => applyAdjustment(10)}>Reajuste +10%</Button>
          <Button variant="outline" size="sm" onClick={() => applyAdjustment(-5)}>Corte -5%</Button>
          <div className="flex-1" />
          {dirtyCount > 0 && (
            <Button onClick={saveAll} disabled={bulkUpsert.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar {dirtyCount} alteração{dirtyCount > 1 ? 'ões' : ''}
            </Button>
          )}
        </CardContent>
      </Card>

      {OPERATIONAL_MACROBLOCOS.map(macro => {
        const cats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro];
        const hasEdits = cats.some(c => edits[`${macro}|${c}`] !== undefined);
        const macroTotal = cats.reduce((s, c) => {
          const v = getValue(macro, c);
          return s + (parseFloat(String(v).replace(',', '.')) || 0);
        }, 0);
        return (
          <Card key={macro}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">{macro}</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Total: <span className="text-foreground font-semibold">{fmtBRL(macroTotal)}</span></span>
                  {hasEdits && (
                    <Button size="sm" onClick={() => saveBlock(macro)}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Salvar bloco
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right w-56">Orçamento Mensal (R$)</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats.map(cat => {
                    const val = getValue(macro, cat);
                    const dirty = edits[`${macro}|${cat}`] !== undefined;
                    return (
                      <TableRow key={cat} className={dirty ? 'bg-accent/5' : ''}>
                        <TableCell>{cat}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number" step="0.01" min="0"
                            value={val}
                            onChange={e => setValue(macro, cat, e.target.value)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {dirty ? 'editado' : ''}
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
