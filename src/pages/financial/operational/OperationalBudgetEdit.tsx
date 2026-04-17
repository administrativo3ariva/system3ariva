import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOperationalBudgets, useBulkUpsertBudget, useDuplicateMonth } from '@/hooks/use-operational-budgets';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, OPERATIONAL_CATEGORIES_BY_MACROBLOCO, OperationalMacrobloco, MONTH_LABELS_PT } from '@/lib/types';
import { fmtBRL } from '@/lib/operational-utils';
import { Save, Copy, Package, Wrench, Briefcase, Building2, TrendingUp, TrendingDown, RotateCcw, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const YEAR = 2026;
const NOW_MONTH = new Date().getMonth() + 1;

const MACRO_META: Record<OperationalMacrobloco, { icon: React.ComponentType<{ className?: string }>; accent: string; bg: string }> = {
  'Suprimentos': { icon: Package, accent: 'text-chart-1', bg: 'bg-chart-1/10' },
  'Patrimônio e Manutenção': { icon: Wrench, accent: 'text-chart-2', bg: 'bg-chart-2/10' },
  'Serviços e Apoio Operacional': { icon: Briefcase, accent: 'text-chart-3', bg: 'bg-chart-3/10' },
  'Ocupação e Infraestrutura': { icon: Building2, accent: 'text-chart-4', bg: 'bg-chart-4/10' },
};

export default function OperationalBudgetEdit() {
  const [branch, setBranch] = useState<string>(ALL_BRANCHES[0]);
  const [month, setMonth] = useState<number>(NOW_MONTH);
  const { data: budgets = [] } = useOperationalBudgets(YEAR);
  const bulkUpsert = useBulkUpsertBudget();
  const dup = useDuplicateMonth();

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

  function discardEdits() {
    setEdits({});
    toast.success('Alterações descartadas');
  }

  const dirtyCount = Object.keys(edits).length;

  // Total geral (soma de tudo o que está visível, considerando edits)
  const grandTotal = useMemo(() => {
    let total = 0;
    OPERATIONAL_MACROBLOCOS.forEach(macro => {
      OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro].forEach(cat => {
        total += parseFloat(String(getValue(macro, cat)).replace(',', '.')) || 0;
      });
    });
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, lookup]);

  return (
    <div className="space-y-6 pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Ajustes de Orçamento</h1>
              {dirtyCount > 0 && (
                <Badge variant="default" className="ml-1">{dirtyCount} pendente{dirtyCount > 1 ? 's' : ''}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Edição manual por competência mensal · Mudanças não afetam lançamentos já realizados
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(month)} onValueChange={v => changeMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
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
            {dirtyCount > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={discardEdits}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Descartar
                </Button>
                <Button onClick={saveAll} disabled={bulkUpsert.isPending}>
                  <Save className="h-4 w-4 mr-1.5" /> Salvar tudo
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Total mensal · {BRANCH_LABELS[branch] || branch}
            </p>
            <p className="text-3xl font-bold mt-1">{fmtBRL(grandTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {MONTH_LABELS_PT[month - 1]}/{YEAR} · {branchBudgets.length} categoria{branchBudgets.length !== 1 ? 's' : ''} parametrizada{branchBudgets.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Ações rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={duplicateFromPrevious} disabled={month === 1 || dup.isPending}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicar do mês anterior
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="outline" size="sm" onClick={() => applyAdjustment(5)} className="text-success hover:text-success">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> +5%
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyAdjustment(10)} className="text-success hover:text-success">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> +10%
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyAdjustment(-5)} className="text-destructive hover:text-destructive">
              <TrendingDown className="h-3.5 w-3.5 mr-1.5" /> -5%
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Macrobloco grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {OPERATIONAL_MACROBLOCOS.map(macro => {
          const cats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[macro];
          const meta = MACRO_META[macro];
          const Icon = meta.icon;
          const hasEdits = cats.some(c => edits[`${macro}|${c}`] !== undefined);
          const macroTotal = cats.reduce((s, c) => {
            const v = getValue(macro, c);
            return s + (parseFloat(String(v).replace(',', '.')) || 0);
          }, 0);
          const editedCount = cats.filter(c => edits[`${macro}|${c}`] !== undefined).length;

          return (
            <Card key={macro} className={cn('overflow-hidden transition-shadow', hasEdits && 'ring-1 ring-primary/30 shadow-md')}>
              <CardHeader className={cn('pb-4', meta.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center bg-background shadow-sm', meta.accent)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{macro}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cats.length} categorias{editedCount > 0 && <> · <span className="text-primary font-medium">{editedCount} editada{editedCount > 1 ? 's' : ''}</span></>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Total bloco</p>
                    <p className="text-base font-bold">{fmtBRL(macroTotal)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {cats.map(cat => {
                  const val = getValue(macro, cat);
                  const dirty = edits[`${macro}|${cat}`] !== undefined;
                  return (
                    <div
                      key={cat}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md border transition-colors',
                        dirty ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted/50'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{cat}</p>
                        {dirty && <p className="text-[10px] text-primary font-medium uppercase tracking-wider">editado</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          type="number" step="0.01" min="0"
                          value={val}
                          onChange={e => setValue(macro, cat, e.target.value)}
                          className="w-32 text-right font-mono h-9"
                        />
                      </div>
                    </div>
                  );
                })}
                {hasEdits && (
                  <div className="pt-2 flex justify-end">
                    <Button size="sm" variant="secondary" onClick={() => saveBlock(macro)} disabled={bulkUpsert.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar bloco ({editedCount})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
