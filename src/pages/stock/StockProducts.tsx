import { useState } from 'react';
import { Plus, Search, Filter, Pencil, AlertTriangle } from 'lucide-react';
import { useProducts, useAddProduct, useUpdateProduct, DbProduct } from '@/hooks/use-products';
import { useApp } from '@/contexts/AppContext';
import { BRANCH_LABELS } from '@/lib/types';
import { PRODUCT_CATEGORIES } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function StockProducts() {
  const { selectedBranch } = useApp();
  const { data: products = [], isLoading } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unitPrice: '', minStock: '' });

  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [editForm, setEditForm] = useState<Partial<DbProduct>>({});

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== 'all' && p.category !== filterCat) return false;
    return true;
  });

  const handleAdd = () => {
    const qty = parseInt(form.quantity) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    addProduct.mutate({
      name: form.name,
      category: form.category,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
      unit: selectedBranch,
      min_stock: parseInt(form.minStock) || null,
    }, {
      onSuccess: () => {
        setForm({ name: '', category: '', quantity: '', unitPrice: '', minStock: '' });
        setDialogOpen(false);
      }
    });
  };

  const openEdit = (p: DbProduct) => {
    setEditingProduct(p);
    setEditForm({ ...p });
  };

  const handleSaveEdit = () => {
    if (!editingProduct || !editForm.name) {
      toast.error('Preencha o nome do produto');
      return;
    }
    const qty = editForm.quantity ?? 0;
    const price = Number(editForm.unit_price) || 0;
    updateProduct.mutate({
      id: editingProduct.id,
      name: editForm.name,
      category: editForm.category,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
      min_stock: editForm.min_stock ?? null,
    }, {
      onSuccess: () => {
        toast.success('Produto atualizado');
        setEditingProduct(null);
      }
    });
  };

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">Produtos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} produtos — {BRANCH_LABELS[selectedBranch] || selectedBranch}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Cadastrar Produto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do produto" />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Quantidade</Label>
                  <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Valor Unit.</Label>
                  <Input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Estoque Mín.</Label>
                  <Input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleAdd} disabled={addProduct.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {addProduct.isPending ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Mín.</TableHead>
              <TableHead className="text-right">Valor Unit.</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => {
              const isLow = p.min_stock != null && p.quantity <= p.min_stock;
              return (
                <TableRow key={p.id} className="table-row-hover">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.category}</TableCell>
                  <TableCell className={`text-right font-medium ${isLow ? 'text-warning' : ''}`}>{p.quantity}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{p.min_stock ?? '—'}</TableCell>
                  <TableCell className="text-right text-sm">R$ {Number(p.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">R$ {Number(p.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Editar Produto</SheetTitle>
            <SheetDescription>{editingProduct?.name}</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={editForm.category || ''} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input type="number" value={editForm.quantity ?? ''} onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-2">
                <Label>Valor Unit.</Label>
                <Input type="number" step="0.01" value={editForm.unit_price ?? ''} onChange={e => setEditForm(f => ({ ...f, unit_price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-2">
                <Label>Estoque Mín.</Label>
                <Input type="number" value={editForm.min_stock ?? ''} onChange={e => setEditForm(f => ({ ...f, min_stock: e.target.value ? parseInt(e.target.value) : null }))} placeholder="Ex: 10" />
              </div>
            </div>

            {editForm.min_stock != null && editForm.quantity != null && editForm.quantity <= editForm.min_stock && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-warning/10 border border-warning/30 text-warning text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Estoque atual ({editForm.quantity}) está abaixo ou igual ao mínimo ({editForm.min_stock})</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveEdit} disabled={updateProduct.isPending} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                {updateProduct.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button variant="outline" onClick={() => setEditingProduct(null)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
