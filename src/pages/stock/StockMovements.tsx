import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, RefreshCw, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/use-products';
import { useMovements, useAddMovement, useUpdateMovement, useDeleteMovement, DbMovement } from '@/hooks/use-movements';
import { useCollaborators } from '@/hooks/use-collaborators';
import { useApp } from '@/contexts/AppContext';
import { BranchBadge } from '@/components/BranchBadge';
import { BRANCH_LABELS } from '@/lib/types';
import { FloorPicker } from '@/components/FloorPicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export default function StockMovements() {
  const { selectedBranch } = useApp();
  const { data: movements = [], isLoading } = useMovements();
  const { data: products = [] } = useProducts();
  const { data: collaborators = [] } = useCollaborators();
  const addMovement = useAddMovement();
  const updateMovement = useUpdateMovement();
  const deleteMovement = useDeleteMovement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [form, setForm] = useState({
    productId: '', type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: '', responsible: '', notes: '', floor: '',
  });

  // View state
  const [viewMovement, setViewMovement] = useState<DbMovement | null>(null);

  // Edit state
  const [editMovement, setEditMovement] = useState<DbMovement | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'entrada' as string, quantity: '', responsible: '', notes: '', floor: '',
  });

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCollabs = collaborators.filter(c => c.active);
  const filtered = filterType === 'all' ? movements : movements.filter(m => m.type === filterType);

  const handleAdd = () => {
    const product = products.find(p => p.id === form.productId);
    if (!product) { toast.error('Selecione um produto'); return; }
    const qty = parseInt(form.quantity) || 0;
    if (qty <= 0) { toast.error('Informe uma quantidade válida'); return; }
    if (form.type === 'saida' && !form.responsible) { toast.error('Selecione o responsável pela retirada'); return; }

    addMovement.mutate({
      product_id: form.productId,
      product_name: product.name,
      type: form.type,
      quantity: qty,
      date: new Date().toISOString().split('T')[0],
      user: 'Admin',
      responsible: form.type === 'saida' ? form.responsible : null,
      notes: form.notes || null,
      unit: selectedBranch,
      floor: selectedBranch === 'BH-Matriz' ? (form.floor || null) : null,
    }, {
      onSuccess: () => {
        setForm({ productId: '', type: 'entrada', quantity: '', responsible: '', notes: '', floor: '' });
        setDialogOpen(false);
      }
    });
  };

  const openEdit = (m: DbMovement) => {
    setEditMovement(m);
    setEditForm({
      type: m.type,
      quantity: String(m.quantity),
      responsible: m.responsible || '',
      notes: m.notes || '',
      floor: m.floor || '',
    });
  };

  const handleEdit = () => {
    if (!editMovement) return;
    const qty = parseInt(editForm.quantity) || 0;
    if (qty <= 0) { toast.error('Informe uma quantidade válida'); return; }
    if (editForm.type === 'saida' && !editForm.responsible) { toast.error('Selecione o responsável'); return; }

    updateMovement.mutate({
      id: editMovement.id,
      type: editForm.type,
      quantity: qty,
      responsible: editForm.type === 'saida' ? editForm.responsible : null,
      notes: editForm.notes || null,
      floor: selectedBranch === 'BH-Matriz' ? (editForm.floor || null) : null,
    }, {
      onSuccess: () => setEditMovement(null),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMovement.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const typeIcon = (t: string) => {
    if (t === 'entrada') return <TrendingUp className="h-3 w-3 mr-1" />;
    if (t === 'saida') return <TrendingDown className="h-3 w-3 mr-1" />;
    return <RefreshCw className="h-3 w-3 mr-1" />;
  };

  const typeLabel = (t: string) => {
    if (t === 'entrada') return 'Entrada';
    if (t === 'saida') return 'Saída';
    return 'Ajuste';
  };

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  const renderFormFields = (
    formState: typeof form | typeof editForm,
    setFormState: (fn: (prev: any) => any) => void,
    isEdit = false,
  ) => (
    <>
      <div className="grid gap-2">
        <Label>Tipo</Label>
        <Select value={formState.type} onValueChange={v => setFormState((f: any) => ({ ...f, type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {selectedBranch === 'BH-Matriz' && (
        <FloorPicker
          value={formState.floor || ''}
          onChange={v => setFormState((f: any) => ({ ...f, floor: v }))}
        />
      )}
      {!isEdit && (
        <div className="grid gap-2">
          <Label>Produto</Label>
          <Select value={(formState as typeof form).productId || undefined} onValueChange={v => setFormState((f: any) => ({ ...f, productId: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
            <SelectContent>
              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label>Quantidade</Label>
        <Input type="number" value={formState.quantity} onChange={e => setFormState((f: any) => ({ ...f, quantity: e.target.value }))} />
      </div>
      {formState.type === 'saida' && (
        <div className="grid gap-2">
          <Label>Responsável pela Retirada</Label>
          <Select value={formState.responsible || undefined} onValueChange={v => setFormState((f: any) => ({ ...f, responsible: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
            <SelectContent>
              {activeCollabs.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea value={formState.notes} onChange={e => setFormState((f: any) => ({ ...f, notes: e.target.value }))} />
      </div>
    </>
  );

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
                {renderFormFields(form, setForm)}
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
              <TableHead>Observações</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
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
                <TableCell><BranchBadge branch={m.unit} floor={m.floor} /></TableCell>
                <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                <TableCell className="text-sm">{m.responsible || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{m.notes}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewMovement(m)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Sheet */}
      <Sheet open={!!viewMovement} onOpenChange={open => !open && setViewMovement(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes da Movimentação</SheetTitle>
            <SheetDescription>Visualização completa do registro</SheetDescription>
          </SheetHeader>
          {viewMovement && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm font-medium">{new Date(viewMovement.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge variant={viewMovement.type === 'entrada' ? 'default' : viewMovement.type === 'saida' ? 'destructive' : 'secondary'} className="text-xs mt-1">
                    {typeIcon(viewMovement.type)}{typeLabel(viewMovement.type)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produto</p>
                <p className="text-sm font-medium">{viewMovement.product_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Quantidade</p>
                  <p className="text-sm font-medium">{viewMovement.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unidade</p>
                  <BranchBadge branch={viewMovement.unit} floor={viewMovement.floor} />
                </div>
              </div>
              {viewMovement.responsible && (
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="text-sm font-medium">{viewMovement.responsible}</p>
                </div>
              )}
              {viewMovement.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{viewMovement.notes}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={!!editMovement} onOpenChange={open => !open && setEditMovement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar Movimentação</DialogTitle>
          </DialogHeader>
          {editMovement && (
            <div className="grid gap-4 py-4">
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <span className="text-muted-foreground">Produto: </span>
                <span className="font-medium">{editMovement.product_name}</span>
              </div>
              {renderFormFields(editForm, setEditForm, true)}
              <Button onClick={handleEdit} disabled={updateMovement.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {updateMovement.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Ao excluir esta movimentação, a quantidade do produto será recalculada automaticamente. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMovement.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
