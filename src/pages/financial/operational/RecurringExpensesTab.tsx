import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Play, RefreshCw } from 'lucide-react';
import {
  ALL_BRANCHES, BRANCH_LABELS, FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES,
  OPERATIONAL_CATEGORIES_BY_MACROBLOCO, MONTH_LABELS_PT,
} from '@/lib/types';
import {
  useRecurringExpenses, useRecurringExpenseRuns, useUpsertRecurringExpense,
  useDeleteRecurringExpense, useGenerateRecurringMonth, RecurringExpense,
} from '@/hooks/use-recurring-expenses';
import { fmtBRL } from '@/lib/operational-utils';
import { CurrencyInput } from '@/components/CurrencyInput';

const MACRO = 'Ocupação e Infraestrutura' as const;
const CATEGORIES = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[MACRO];
const YEAR = 2026;

const PAYMENT_METHODS = ['PIX', 'Boleto', 'TED', 'Débito Automático', 'Dinheiro', 'Outro'];

const empty: Partial<RecurringExpense> = {
  branch: 'BH-Matriz',
  macrobloco: MACRO,
  category: CATEGORIES[0],
  description: '',
  supplier: '',
  amount: 0,
  due_day: 5,
  company: FINANCIAL_COMPANIES[0],
  cost_center: FINANCIAL_COST_CENTERS[0],
  payment_method: 'Boleto',
  active: true,
  notes: '',
};

export default function RecurringExpensesTab() {
  const { data: templates = [], isLoading } = useRecurringExpenses();
  const { data: runs = [] } = useRecurringExpenseRuns();
  const upsert = useUpsertRecurringExpense();
  const del = useDeleteRecurringExpense();
  const generate = useGenerateRecurringMonth();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<RecurringExpense>>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [genMonth, setGenMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterBranch, setFilterBranch] = useState<string>('all');

  const filtered = useMemo(() =>
    templates.filter(t => filterBranch === 'all' || t.branch === filterBranch),
  [templates, filterBranch]);

  const totalMonthly = filtered.filter(t => t.active).reduce((s, t) => s + Number(t.amount), 0);

  const runsByTemplate = useMemo(() => {
    const map = new Map<string, Set<number>>();
    runs.filter(r => r.year === YEAR).forEach(r => {
      if (!map.has(r.recurring_expense_id)) map.set(r.recurring_expense_id, new Set());
      map.get(r.recurring_expense_id)!.add(r.month);
    });
    return map;
  }, [runs]);

  function openNew() { setEditing({ ...empty }); setOpen(true); }
  function openEdit(t: RecurringExpense) { setEditing(t); setOpen(true); }

  async function save() {
    if (!editing.description || !editing.amount || !editing.branch || !editing.category) {
      return;
    }
    await upsert.mutateAsync(editing);
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header / actions */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Despesas Recorrentes</h2>
          <p className="text-sm text-muted-foreground">
            Templates de despesas fixas mensais de <strong>Ocupação e Infraestrutura</strong>. Cada filial pode ter seu próprio dia de vencimento.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova recorrência</Button>
      </div>

      {/* KPIs + Generation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Templates ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{filtered.filter(t => t.active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total mensal previsto</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-mono">{fmtBRL(totalMonthly)}</div></CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Gerar lançamentos do mês</CardTitle></CardHeader>
          <CardContent className="flex gap-2 items-center">
            <Select value={String(genMonth)} onValueChange={v => setGenMonth(Number(v))}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_LABELS_PT.map((l, i) => <SelectItem key={i} value={String(i + 1)}>{l}/{YEAR}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => generate.mutate({ year: YEAR, month: genMonth })}
              disabled={generate.isPending}
            >
              {generate.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <Label className="text-sm">Filial:</Label>
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas filiais</SelectItem>
            {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-center">Dia venc.</TableHead>
                <TableHead className="text-center">Meses gerados</TableHead>
                <TableHead className="text-right">Valor mensal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma recorrência cadastrada. Clique em "Nova recorrência" para começar.</TableCell></TableRow>
              )}
              {filtered.map(t => {
                const months = runsByTemplate.get(t.id) || new Set();
                return (
                  <TableRow key={t.id} className={!t.active ? 'opacity-60' : ''}>
                    <TableCell>
                      {t.active
                        ? <Badge>Ativo</Badge>
                        : <Badge variant="outline">Pausado</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{BRANCH_LABELS[t.branch] || t.branch}</TableCell>
                    <TableCell className="text-sm">{t.category}</TableCell>
                    <TableCell className="text-sm max-w-[220px] truncate">{t.description}</TableCell>
                    <TableCell className="text-sm">{t.supplier || '—'}</TableCell>
                    <TableCell className="text-sm">{t.company}</TableCell>
                    <TableCell className="text-center text-sm font-mono">dia {t.due_day}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-xs text-muted-foreground">{months.size}/12</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{fmtBRL(Number(t.amount))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Editar recorrência' : 'Nova recorrência'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Descrição *</Label>
              <Input value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Ex.: Aluguel BH-Matriz" />
            </div>
            <div>
              <Label>Filial *</Label>
              <Select value={editing.branch} onValueChange={v => setEditing({ ...editing, branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={editing.category} onValueChange={v => setEditing({ ...editing, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Empresa *</Label>
              <Select value={editing.company} onValueChange={v => setEditing({ ...editing, company: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FINANCIAL_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro de custo *</Label>
              <Select value={editing.cost_center} onValueChange={v => setEditing({ ...editing, cost_center: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FINANCIAL_COST_CENTERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input value={editing.supplier || ''} onChange={e => setEditing({ ...editing, supplier: e.target.value })} />
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={editing.payment_method || ''} onValueChange={v => setEditing({ ...editing, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor mensal (R$) *</Label>
              <CurrencyInput value={Number(editing.amount) || 0} onChange={v => setEditing({ ...editing, amount: v })} />
            </div>
            <div>
              <Label>Dia do vencimento (1-31) *</Label>
              <Input type="number" min={1} max={31} value={editing.due_day || 1} onChange={e => setEditing({ ...editing, due_day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })} />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Input value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={editing.active ?? true} onCheckedChange={v => setEditing({ ...editing, active: v })} />
              <Label className="!mt-0">Ativo (gerar automaticamente)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={upsert.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Lançamentos já gerados a partir deste template <strong>não</strong> serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { del.mutate(deleteId); setDeleteId(null); } }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
