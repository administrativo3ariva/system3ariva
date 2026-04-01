import { useState } from 'react';
import { Plus, Search, Filter, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct, DbProduct } from '@/hooks/use-products';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/use-categories';
import { BRANCH_LABELS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead, SortConfig, toggleSort, sortData } from '@/components/SortableTableHead';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function StockProducts() {
  const { selectedBranch } = useApp();
  const { data: products = [], isLoading } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const categories = useCategories();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unitPrice: '', minStock: '', newCategory: '', unitOfMeasure: 'UN' });
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [editForm, setEditForm] = useState<Partial<DbProduct>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortConfig>({ key: '', direction: null });

  const allCategories = [...new Set([...categories, ...customCategories])].sort();

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== 'all' && p.category !== filterCat) return false;
    return true;
  });

  const sorted = sortData(filtered, sort, (item, key) => {
    switch (key) {
      case 'name': return item.name;
      case 'category': return item.category;
      case 'unit_of_measure': return item.unit_of_measure || 'UN';
      case 'quantity': return item.quantity;
      case 'min_stock': return item.min_stock;
      case 'unit_price': return Number(item.unit_price);
      case 'total_price': return Number(item.total_price);
      default: return null;
    }
  });

  const handleAddCategory = () => {
    const cat = form.newCategory.trim();
    if (cat && !allCategories.includes(cat)) {
      setCustomCategories(prev => [...prev, cat]);
      setForm(f => ({ ...f, category: cat, newCategory: '' }));
    } else {
      setForm(f => ({ ...f, newCategory: '' }));
    }
  };

  const handleAdd = () => {
    const qty = parseInt(form.quantity) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    if (!form.name.trim()) { toast.error('Informe o nome do produto'); return; }
    if (!form.category) { toast.error('Selecione a categoria'); return; }
    addProduct.mutate({
      name: form.name,
      category: form.category,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
      unit: selectedBranch,
      min_stock: parseInt(form.minStock) || null,
      unit_of_measure: form.unitOfMeasure || 'UN',
    }, {
      onSuccess: () => {
        setForm({ name: '', category: '', quantity: '', unitPrice: '', minStock: '', newCategory: '', unitOfMeasure: 'UN' });
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

  const handleDelete = () => {
    if (!deleteId) return;
    deleteProduct.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
                    {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova categoria..."
                    value={form.newCategory}
                    onChange={e => setForm(f => ({ ...f, newCategory: e.target.value }))}
                    className="text-xs h-8"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={handleAddCategory}>
                    Adicionar
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Unidade de Medida</Label>
                <Select value={form.unitOfMeasure} onValueChange={v => setForm(f => ({ ...f, unitOfMeasure: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['UN', 'CX', 'KG', 'PCT', 'PC', 'FR', 'LT', 'ML', 'G'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Quantidade</Label>
                  <Input type="number" step={form.unitOfMeasure === 'KG' ? '0.001' : '1'} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
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
            {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="name" currentSort={sort} onSort={k => setSort(toggleSort(sort, k))}>Produto</SortableTableHead>
              <SortableTableHead sortKey="category" currentSort={sort} onSort={k => setSort(toggleSort(sort, k))}>Categoria</SortableTableHead>
              <SortableTableHead sortKey="unit_of_measure" currentSort={sort} onSort={k => setSort(toggleSort(sort, k))}>Und.</SortableTableHead>
              <SortableTableHead sortKey="quantity" currentSort={sort} onSort={k => setSort(toggleSort(sort, k))} className="text-right">Qtd</SortableTableHead>
              <SortableTableHead sortKey="min_stock" currentSort={sort} onSort={k => setSort(toggleSort(sort, k))} className="text-right">Mín.</SortableTableHead>
              <SortableTableHead sortKey="unit_price" currentSort={sort} onSort={k => setSort(toggleSort(sort, k))} className="text-right">Valor Unit.</SortableTableHead>
              <SortableTableHead sortKey="total_price" currentSort={sort} onSort={k => setSort(toggleSort(sort, k))} className="text-right">Valor Total</SortableTableHead>
              <SortableTableHead sortKey="" currentSort={{ key: '', direction: null }} onSort={() => {}} className="w-[80px]"> </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(p => {
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
                  <TableCell className="text-sm">{p.unit_of_measure || 'UN'}</TableCell>
                  <TableCell className={`text-right font-medium ${isLow ? 'text-warning' : ''}`}>
                    {p.unit_of_measure === 'KG' ? Number(p.quantity).toFixed(3) : p.quantity}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{p.min_stock ?? '—'}</TableCell>
                  <TableCell className="text-right text-sm">R$ {Number(p.unit_price).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">R$ {Number(p.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                  {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Ao excluir este produto, todas as movimentações relacionadas também serão removidas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteProduct.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
