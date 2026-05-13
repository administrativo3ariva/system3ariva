import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Play, RefreshCw, CheckCircle2, Clock, AlertTriangle, Building2, X, Wand2 } from 'lucide-react';
import {
  ALL_BRANCHES, BRANCH_LABELS, FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES,
  OPERATIONAL_CATEGORIES_BY_MACROBLOCO, MONTH_LABELS_PT,
} from '@/lib/types';
import {
  useRecurringExpenses, useRecurringExpenseRuns, useUpsertRecurringExpense,
  useDeleteRecurringExpense, useGenerateRecurringMonth, useToggleRunPaid, useDeleteRun,
  RecurringExpense, RecurringExpenseRun, CompanyAllocation,
} from '@/hooks/use-recurring-expenses';
import { fmtBRL } from '@/lib/operational-utils';
import { CurrencyInput } from '@/components/CurrencyInput';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const MACRO = 'Ocupação e Infraestrutura' as const;
const CATEGORIES = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[MACRO];
const YEAR = 2026;

const PAYMENT_METHODS = ['PIX', 'Boleto', 'TED', 'Débito Automático', 'Dinheiro', 'Outro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
  company_allocations: null,
};

type ProgrammingTab = 'templates' | 'programming';

export default function RecurringExpensesTab() {
  const { data: templates = [], isLoading } = useRecurringExpenses();
  const { data: runs = [] } = useRecurringExpenseRuns();
  const upsert = useUpsertRecurringExpense();
  const del = useDeleteRecurringExpense();
  const generate = useGenerateRecurringMonth();
  const togglePaid = useToggleRunPaid();
  const deleteRun = useDeleteRun();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<RecurringExpense>>(empty);
  const [companyAllocs, setCompanyAllocs] = useState<CompanyAllocation[]>([]);
  const [splitCompany, setSplitCompany] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteRunId, setDeleteRunId] = useState<string | null>(null);
  const [payRun, setPayRun] = useState<RecurringExpenseRun | null>(null);
  const [payDate, setPayDate] = useState<string>('');
  const [genMonth, setGenMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [view, setView] = useState<ProgrammingTab>('programming');

  const filtered = useMemo(() =>
    templates.filter(t => filterBranch === 'all' || t.branch === filterBranch),
  [templates, filterBranch]);

  const totalMonthly = filtered.filter(t => t.active).reduce((s, t) => s + Number(t.amount), 0);

  // Map: templateId -> month (1-12) -> run
  const runsByTemplateMonth = useMemo(() => {
    const map = new Map<string, Map<number, RecurringExpenseRun>>();
    runs.filter(r => r.year === YEAR).forEach(r => {
      if (!map.has(r.recurring_expense_id)) map.set(r.recurring_expense_id, new Map());
      map.get(r.recurring_expense_id)!.set(r.month, r);
    });
    return map;
  }, [runs]);

  // KPIs Programação
  const yearRuns = useMemo(() => runs.filter(r => r.year === YEAR), [runs]);
  const totalPaid = yearRuns.filter(r => r.paid).reduce((s, r) => s + Number(r.amount), 0);
  const totalPending = yearRuns.filter(r => !r.paid).reduce((s, r) => s + Number(r.amount), 0);
  const overdueCount = yearRuns.filter(r => {
    if (r.paid) return false;
    if (!r.due_date) return false;
    return new Date(r.due_date) < new Date();
  }).length;

  function openNew() {
    setEditing({ ...empty });
    setCompanyAllocs([]);
    setSplitCompany(false);
    setOpen(true);
  }
  function openEdit(t: RecurringExpense) {
    setEditing(t);
    const ca = Array.isArray(t.company_allocations) ? t.company_allocations : [];
    setCompanyAllocs(ca);
    setSplitCompany(ca.length > 0);
    setOpen(true);
  }

  async function save() {
    if (!editing.description || !editing.amount || !editing.branch || !editing.category) {
      return;
    }
    const payload: Partial<RecurringExpense> = {
      ...editing,
      company_allocations: splitCompany && companyAllocs.length > 0 ? companyAllocs : null,
    };
    await upsert.mutateAsync(payload);
    setOpen(false);
  }

  // Company allocation helpers
  const allocSum = companyAllocs.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const allocRemaining = +((Number(editing.amount) || 0) - allocSum).toFixed(2);
  const allocBalanced = Math.abs(allocRemaining) < 0.01 && companyAllocs.length > 0;
  const allocOverflow = allocRemaining < -0.001;

  function addCompanyRow() {
    const used = new Set(companyAllocs.map(a => a.company));
    const free = FINANCIAL_COMPANIES.find(c => !used.has(c) && c !== editing.company) || '';
    setCompanyAllocs([...companyAllocs, { company: free, amount: Math.max(allocRemaining, 0) }]);
  }
  function updateCompanyRow(idx: number, patch: Partial<CompanyAllocation>) {
    setCompanyAllocs(companyAllocs.map((a, i) => i === idx ? { ...a, ...patch } : a));
  }
  function removeCompanyRow(idx: number) {
    setCompanyAllocs(companyAllocs.filter((_, i) => i !== idx));
  }
  function distributeEvenly() {
    if (companyAllocs.length === 0 || !editing.amount) return;
    const total = Number(editing.amount);
    const each = +(total / companyAllocs.length).toFixed(2);
    setCompanyAllocs(companyAllocs.map((a, i) => ({
      ...a,
      amount: i === companyAllocs.length - 1 ? +(total - each * (companyAllocs.length - 1)).toFixed(2) : each,
    })));
  }

  return (
    <div className="space-y-6">
      {/* Header / actions */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Despesas Recorrentes</h2>
          <p className="text-sm text-muted-foreground">
            Templates de despesas fixas mensais de <strong>Ocupação e Infraestrutura</strong>. Os lançamentos gerados ficam <strong>isolados</strong> nesta aba (não criam solicitações de pagamento).
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova recorrência</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Templates ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{filtered.filter(t => t.active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total mensal previsto</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold font-mono">{fmtBRL(totalMonthly)}</div></CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600 dark:text-green-400">Pago em {YEAR}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{fmtBRL(totalPaid)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{yearRuns.filter(r => r.paid).length} lançamento(s)</div>
          </CardContent>
        </Card>
        <Card className={cn('border-amber-500/30', overdueCount > 0 && 'border-destructive/40')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600 dark:text-amber-400">A pagar / em aberto</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{fmtBRL(totalPending)}</div>
            {overdueCount > 0 && (
              <div className="text-xs text-destructive mt-0.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />{overdueCount} vencido(s)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Programming bar */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Play className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Gerar lançamentos do mês</p>
              <p className="text-xs text-muted-foreground">Cria os lançamentos pendentes de cada template ativo no mês escolhido.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(genMonth)} onValueChange={v => setGenMonth(Number(v))}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_LABELS_PT.map((l, i) => <SelectItem key={i} value={String(i + 1)}>{l}/{YEAR}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              onClick={() => generate.mutate({ year: YEAR, month: genMonth })}
              disabled={generate.isPending}
            >
              {generate.isPending
                ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                : <Play className="h-4 w-4 mr-2" />}
              Gerar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View switcher + Filter */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          <button
            onClick={() => setView('programming')}
            className={cn(
              'px-4 py-1.5 text-sm rounded-md transition-colors',
              view === 'programming' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Programação {YEAR}
          </button>
          <button
            onClick={() => setView('templates')}
            className={cn(
              'px-4 py-1.5 text-sm rounded-md transition-colors',
              view === 'templates' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Templates
          </button>
        </div>
        <div className="flex gap-3 items-center">
          <Label className="text-sm">Filial:</Label>
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas filiais</SelectItem>
              {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PROGRAMMING VIEW — month grid */}
      {view === 'programming' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Programação mensal {YEAR}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clique no toggle de cada célula para marcar como <strong>pago</strong>. Células vazias significam que o mês ainda não foi gerado.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Recorrência</TableHead>
                  <TableHead className="text-right min-w-[100px]">Mensal</TableHead>
                  {MONTHS_SHORT.map((m, i) => (
                    <TableHead key={i} className="text-center min-w-[78px] px-1">{m}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={14} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={14} className="text-center py-8 text-muted-foreground">Nenhuma recorrência. Crie uma na aba Templates.</TableCell></TableRow>
                )}
                {filtered.map(t => {
                  const monthMap = runsByTemplateMonth.get(t.id) || new Map();
                  return (
                    <TableRow key={t.id} className={!t.active ? 'opacity-60' : ''}>
                      <TableCell className="sticky left-0 bg-background z-10">
                        <div className="font-medium text-sm">{t.description}</div>
                        <div className="text-xs text-muted-foreground">{BRANCH_LABELS[t.branch] || t.branch} · {t.category}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmtBRL(Number(t.amount))}</TableCell>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                        const run = monthMap.get(m);
                        if (!run) {
                          return (
                            <TableCell key={m} className="text-center px-1">
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            </TableCell>
                          );
                        }
                        const isOverdue = !run.paid && run.due_date && new Date(run.due_date) < new Date();
                        return (
                          <TableCell key={m} className="text-center px-1">
                            <button
                              onClick={() => togglePaid.mutate({ id: run.id, paid: !run.paid })}
                              className={cn(
                                'inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border w-full transition-colors',
                                run.paid
                                  ? 'bg-green-500/10 border-green-500/40 hover:bg-green-500/20'
                                  : isOverdue
                                    ? 'bg-destructive/10 border-destructive/40 hover:bg-destructive/20'
                                    : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                              )}
                              title={run.paid
                                ? `Pago em ${run.paid_date ? format(parseISO(run.paid_date), 'dd/MM/yy') : '—'}`
                                : `Vence em ${run.due_date ? format(parseISO(run.due_date), 'dd/MM/yy') : '—'} · clique para marcar como pago`}
                            >
                              {run.paid
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                : isOverdue
                                  ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                  : <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                              <span className="text-[10px] font-mono leading-none">
                                {run.due_date ? format(parseISO(run.due_date), 'dd/MM') : ''}
                              </span>
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> Pago</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Pendente</span>
              <span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Vencido</span>
              <span className="inline-flex items-center gap-1.5">— Não gerado</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TEMPLATES VIEW — original table */}
      {view === 'templates' && (
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
                  <TableHead>Empresa(s)</TableHead>
                  <TableHead className="text-center">Dia venc.</TableHead>
                  <TableHead className="text-right">Valor mensal</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma recorrência cadastrada.</TableCell></TableRow>
                )}
                {filtered.map(t => {
                  const splitCo = Array.isArray(t.company_allocations) && t.company_allocations.length > 0;
                  return (
                    <TableRow key={t.id} className={!t.active ? 'opacity-60' : ''}>
                      <TableCell>
                        {t.active ? <Badge>Ativo</Badge> : <Badge variant="outline">Pausado</Badge>}
                      </TableCell>
                      <TableCell className="text-sm">{BRANCH_LABELS[t.branch] || t.branch}</TableCell>
                      <TableCell className="text-sm">{t.category}</TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate">{t.description}</TableCell>
                      <TableCell className="text-sm">{t.supplier || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {splitCo ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Building2 className="h-3 w-3" />
                              {t.company_allocations!.length} empresas
                            </Badge>
                          </div>
                        ) : t.company}
                      </TableCell>
                      <TableCell className="text-center text-sm font-mono">dia {t.due_day}</TableCell>
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
      )}

      {/* Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <Label>Empresa principal *</Label>
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

            {/* Company allocation */}
            <div className="col-span-2 rounded-lg border bg-muted/20">
              <button
                type="button"
                onClick={() => setSplitCompany(!splitCompany)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                    splitCompany ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ratear esta despesa entre empresas</p>
                    <p className="text-xs text-muted-foreground">Divida o valor mensal entre RIVA, 3A, etc.</p>
                  </div>
                </div>
                <Switch checked={splitCompany} onCheckedChange={setSplitCompany} />
              </button>

              {splitCompany && (
                <div className="border-t p-4 space-y-3">
                  {companyAllocs.map((a, idx) => {
                    const used = new Set(companyAllocs.map(x => x.company).filter(Boolean));
                    const avail = FINANCIAL_COMPANIES.filter(c => c === a.company || !used.has(c));
                    return (
                      <div key={idx} className="flex items-end gap-2 rounded-md border bg-background p-3">
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs">Empresa</Label>
                          <Select value={a.company} onValueChange={v => updateCompanyRow(idx, { company: v })}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {avail.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-40">
                          <Label className="text-xs">Valor</Label>
                          <CurrencyInput value={a.amount} onChange={v => updateCompanyRow(idx, { amount: v })} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeCompanyRow(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addCompanyRow} disabled={companyAllocs.length >= FINANCIAL_COMPANIES.length}>
                      <Plus className="h-4 w-4 mr-1.5" /> Adicionar empresa
                    </Button>
                    {companyAllocs.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={distributeEvenly}>
                        <Wand2 className="h-4 w-4 mr-1.5" /> Distribuir igualmente
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Rateado: <span className="font-medium text-foreground tabular-nums">{fmtBRL(allocSum)}</span> de <span className="tabular-nums">{fmtBRL(Number(editing.amount) || 0)}</span>
                    </span>
                    {allocOverflow ? (
                      <Badge variant="destructive">Excede em {fmtBRL(Math.abs(allocRemaining))}</Badge>
                    ) : allocBalanced ? (
                      <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400">Totalmente rateado</Badge>
                    ) : (
                      <Badge variant="outline">Restante: {fmtBRL(allocRemaining)} p/ {editing.company}</Badge>
                    )}
                  </div>
                </div>
              )}
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

      {/* Delete template confirm */}
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

      {/* Delete run confirm */}
      <AlertDialog open={!!deleteRunId} onOpenChange={(o) => !o && setDeleteRunId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O lançamento mensal será removido. Você poderá gerá-lo novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteRunId) { deleteRun.mutate(deleteRunId); setDeleteRunId(null); } }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
