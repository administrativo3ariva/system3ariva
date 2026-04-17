import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOperationalBudgets, useUpsertBudget } from '@/hooks/use-operational-budgets';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, OPERATIONAL_CATEGORIES_BY_MACROBLOCO } from '@/lib/types';
import { fmtBRL } from '@/lib/operational-utils';
import { Save } from 'lucide-react';

const YEAR = 2026;

export default function OperationalBudgetEdit() {
  const [branch, setBranch] = useState<string>(ALL_BRANCHES[0]);
  const { data: budgets = [] } = useOperationalBudgets(YEAR);
  const upsert = useUpsertBudget();

  // local edit state: key = `${macro}|${cat}`, value = annual string
  const [edits, setEdits] = useState<Record<string, string>>({});

  const branchBudgets = useMemo(() => budgets.filter(b => b.branch === branch), [budgets, branch]);
  const lookup = useMemo(() => {
    const m = new Map<string, number>();
    branchBudgets.forEach(b => m.set(`${b.macrobloco}|${b.category}`, Number(b.annual_amount)));
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

  async function saveRow(macro: string, cat: string) {
    const key = `${macro}|${cat}`;
    const raw = edits[key];
    if (raw === undefined) return;
    const annual = parseFloat(raw.replace(',', '.')) || 0;
    await upsert.mutateAsync({
      branch, macrobloco: macro, category: cat, year: YEAR, annual_amount: annual, splitEvenly: true,
    });
    setEdits(prev => {
      const c = { ...prev }; delete c[key]; return c;
    });
  }

  async function saveAll(macro: string) {
    const cats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro as keyof typeof OPERATIONAL_CATEGORIES_BY_MACROBLOCO];
    for (const cat of cats) {
      const key = `${macro}|${cat}`;
      if (edits[key] === undefined) continue;
      const annual = parseFloat(edits[key].replace(',', '.')) || 0;
      await upsert.mutateAsync({ branch, macrobloco: macro, category: cat, year: YEAR, annual_amount: annual, splitEvenly: true });
    }
    setEdits(prev => {
      const c = { ...prev };
      cats.forEach(cat => delete c[`${macro}|${cat}`]);
      return c;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Ajustes de Orçamento {YEAR}</h1>
          <p className="text-sm text-muted-foreground">Edite os valores anuais por categoria. A divisão mensal é automática (÷12).</p>
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
        const hasEdits = cats.some(c => edits[`${macro}|${c}`] !== undefined);
        return (
          <Card key={macro}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{macro}</CardTitle>
                {hasEdits && (
                  <Button size="sm" onClick={() => saveAll(macro)}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Salvar bloco
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right w-48">Orçamento Anual (R$)</TableHead>
                    <TableHead className="text-right w-40">Mensal (÷12)</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats.map(cat => {
                    const val = getValue(macro, cat);
                    const annual = parseFloat(String(val).replace(',', '.')) || 0;
                    const monthly = annual / 12;
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
                        <TableCell className="text-right text-muted-foreground">{fmtBRL(monthly)}</TableCell>
                        <TableCell>
                          {dirty && (
                            <Button size="sm" variant="outline" onClick={() => saveRow(macro, cat)}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
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
