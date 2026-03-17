import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/use-products';
import { useMovements, useAddMovement } from '@/hooks/use-movements';
import { useCollaborators } from '@/hooks/use-collaborators';
import { BranchBadge } from '@/components/BranchBadge';
import { STOCK_UNITS, StockUnit } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

export default function StockMovements() {
  const { data: movements = [], isLoading } = useMovements();
  const { data: products = [] } = useProducts();
  const { data: collaborators = [] } = useCollaborators();
  const addMovement = useAddMovement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [form, setForm] = useState({
    productId: '', type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: '', responsible: '', notes: '', unit: 'BH-Matriz' as StockUnit,
  });

  const activeCollabs = collaborators.filter(c => c.active);
  const filtered = filterType === 'all' ? movements : movements.filter(m => m.type === filterType);

  const handleAdd = () => {
    const product = products.find(p => p.id === form.productId);
    if (!product) {
      toast.error('Selecione um produto');
      return;
    }
    const qty = parseInt(form.quantity) || 0;
    if (qty <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }
    if (form.type === 'saida' && !form.responsible) {
      toast.error('Selecione o responsável pela retirada');
      return;
    }

    addMovement.mutate({
      product_id: form.productId,
      product_name: product.name,
      type: form.type,
      quantity: qty,
      date: new Date().toISOString().split('T')[0],
      user: 'Admin',
      responsible: form.type === 'saida' ? form.responsible : null,
      notes: form.notes || null,
      unit: form.unit,
    }, {
      onSuccess: () => {
        setForm({ productId: '', type: 'entrada', quantity: '', responsible: '', notes: '', unit: 'BH-Matriz' });
        setDialogOpen(false);
      }
    });
  };

  const typeIcon = (t: string) => {
    if (t === 'entrada') return <TrendingUp className="h-3 w-3 mr-1" />;
    if (t === 'saida') return <TrendingDown className="h-3 w-3 mr-1" />;
    return <RefreshCw className="h-3 w-3 mr-1" />;
  };

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">Movimentações</h1>
          <p className="text-sm text-muted-foreground">Registro de entradas, saídas e ajustes</p>
        </div>
        <div className="flex gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
              <SelectItem value="ajuste">Ajustes</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" /> Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Registrar Movimentação</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                        <SelectItem value="ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Unidade</Label>
                    <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v as StockUnit }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STOCK_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Produto</Label>
                  <Select value={form.productId || undefined} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Quantidade</Label>
                  <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                {form.type === 'saida' && (
                  <div className="grid gap-2">
                    <Label>Responsável pela Retirada</Label>
                    <Select value={form.responsible || undefined} onValueChange={v => setForm(f => ({ ...f, responsible: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                      <SelectContent>
                        {activeCollabs.map(c => <SelectItem key={c.id} value={c.name}>{c.name} — {c.unit}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button onClick={handleAdd} disabled={addMovement.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {addMovement.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(m => (
              <TableRow key={m.id} className="table-row-hover">
                <TableCell className="text-sm">{new Date(m.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium text-sm">{m.product_name}</TableCell>
                <TableCell>
                  <Badge variant={m.type === 'entrada' ? 'default' : m.type === 'saida' ? 'destructive' : 'secondary'} className="text-xs">
                    {typeIcon(m.type)}{m.type}
                  </Badge>
                </TableCell>
                <TableCell><BranchBadge branch={m.unit} /></TableCell>
                <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                <TableCell className="text-sm">{m.responsible || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.user}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{m.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
