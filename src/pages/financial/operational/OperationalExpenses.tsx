import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOperationalExpenses, useCreateOperationalExpense, useDeleteOperationalExpense } from '@/hooks/use-operational-expenses';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_MACROBLOCOS, OPERATIONAL_CATEGORIES_BY_MACROBLOCO, OperationalMacrobloco } from '@/lib/types';
import { fmtBRL, COST_CENTER_TO_BRANCH } from '@/lib/operational-utils';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OperationalExpenses() {
  const { data: opExpenses = [] } = useOperationalExpenses();
  const { data: cardExpenses = [] } = useExpenses();
  const { data: payments = [] } = usePaymentRequests();
  const createMut = useCreateOperationalExpense();
  const deleteMut = useDeleteOperationalExpense();

  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterBranch, setFilterBranch] = useState<string>('all');

  const [form, setForm] = useState({
    description: '',
    amount: '',
    branch: ALL_BRANCHES[0] as string,
    macrobloco: OPERATIONAL_MACROBLOCOS[0] as string,
    category: OPERATIONAL_CATEGORIES_BY_MACROBLOCO[OPERATIONAL_MACROBLOCOS[0]][0],
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    supplier: '',
    notes: '',
  });

  const cats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[form.macrobloco as OperationalMacrobloco] || [];

  // Unified consumed list (op + card + paid requests)
  const all = useMemo(() => {
    const list: Array<{
      id: string; description: string; amount: number; branch: string;
      macrobloco: string; category: string; date: string;
      source: 'card' | 'request' | 'operational'; canDelete: boolean;
    }> = [];
    opExpenses.forEach(o => list.push({
      id: o.id, description: o.description, amount: Number(o.amount),
      branch: o.branch, macrobloco: o.macrobloco, category: o.category,
      date: o.expense_date, source: 'operational', canDelete: true,
    }));
    cardExpenses.forEach(e => list.push({
      id: e.id, description: e.description, amount: Number(e.amount),
      branch: COST_CENTER_TO_BRANCH[e.cost_center] ?? e.cost_center,
      macrobloco: '—', category: e.category,
      date: e.expense_date, source: 'card', canDelete: false,
    }));
    payments.filter(p => p.status === 'pago').forEach(p => {
      const ref = p.payment_date || p.request_date || p.due_date;
      if (!ref) return;
      list.push({
        id: p.id, description: p.description, amount: Number(p.amount),
        branch: COST_CENTER_TO_BRANCH[p.cost_center] ?? p.cost_center,
        macrobloco: '—', category: p.category,
        date: ref, source: 'request', canDelete: false,
      });
    });
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [opExpenses, cardExpenses, payments]);

  const filtered = filterBranch === 'all' ? all : all.filter(i => i.branch === filterBranch);
  const total = filtered.reduce((s, i) => s + i.amount, 0);

  async function handleSubmit() {
    if (!form.description || !form.amount) return;
    await createMut.mutateAsync({
      description: form.description,
      amount: parseFloat(form.amount.replace(',', '.')) || 0,
      branch: form.branch,
      macrobloco: form.macrobloco as OperationalMacrobloco,
      category: form.category,
      expense_date: form.expense_date,
      supplier: form.supplier || null,
      notes: form.notes || null,
    });
    setForm({ ...form, description: '', amount: '', supplier: '', notes: '' });
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Despesas Operacionais</h1>
          <p className="text-sm text-muted-foreground">Lançamentos que abatem o orçamento (cartão + solicitações pagas + lançamentos próprios)</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas filiais</SelectItem>
              {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />Novo lançamento</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Novo Lançamento Operacional</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select value={form.branch} onValueChange={v => setForm({ ...form, branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Macrobloco</Label>
              <Select value={form.macrobloco} onValueChange={v => {
                const newCats = OPERATIONAL_CATEGORIES_BY_MACROBLOCO[v as OperationalMacrobloco];
                setForm({ ...form, macrobloco: v, category: newCats[0] });
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATIONAL_MACROBLOCOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor (opcional)</Label>
              <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMut.isPending}>Registrar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Histórico Consolidado</CardTitle>
          <div className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{fmtBRL(total)}</span></div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Macrobloco</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum lançamento</TableCell></TableRow>
              )}
              {filtered.map(i => (
                <TableRow key={`${i.source}-${i.id}`}>
                  <TableCell className="whitespace-nowrap text-sm">{format(new Date(i.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                  <TableCell className="max-w-xs truncate">{i.description}</TableCell>
                  <TableCell className="text-sm">{BRANCH_LABELS[i.branch] || i.branch}</TableCell>
                  <TableCell className="text-sm">{i.macrobloco}</TableCell>
                  <TableCell className="text-sm">{i.category}</TableCell>
                  <TableCell>
                    {i.source === 'operational' && <Badge variant="default">Operacional</Badge>}
                    {i.source === 'card' && <Badge variant="secondary">Cartão</Badge>}
                    {i.source === 'request' && <Badge variant="outline">Solicitação</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmtBRL(i.amount)}</TableCell>
                  <TableCell>
                    {i.canDelete ? (
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(i.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (confirmDelete) await deleteMut.mutateAsync(confirmDelete);
              setConfirmDelete(null);
            }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
