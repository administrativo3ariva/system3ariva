import { useState, useMemo, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, RefreshCw, Eye, Pencil, Trash2, Calendar, Package, ArrowUpCircle, ArrowDownCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts, useAddProduct } from '@/hooks/use-products';
import { useMovements, useAddMovement, useUpdateMovement, useDeleteMovement, DbMovement } from '@/hooks/use-movements';
import { useCollaborators } from '@/hooks/use-collaborators';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/use-categories';
import { BranchBadge } from '@/components/BranchBadge';
import { FloorPicker } from '@/components/FloorPicker';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DayGroup {
  date: string;
  movements: DbMovement[];
  totalEntradas: number;
  totalSaidas: number;
  totalAjustes: number;
}

export default function StockMovements() {
  const { selectedBranch } = useApp();
  const { data: movements = [], isLoading } = useMovements();
  const { data: products = [] } = useProducts();
  const { data: collaborators = [] } = useCollaborators();
  const categories = useCategories();
  const addMovement = useAddMovement();
  const addProduct = useAddProduct();
  const updateMovement = useUpdateMovement();
  const deleteMovement = useDeleteMovement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    productId: '', type: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantity: '', responsible: '', notes: '', floor: '',
    newProductName: '', newProductCategory: '', newProductPrice: '',
  });

  const [viewMovement, setViewMovement] = useState<DbMovement | null>(null);
  const [editMovement, setEditMovement] = useState<DbMovement | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'entrada' as string, quantity: '', responsible: '', notes: '', floor: '',
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCollabs = collaborators.filter(c => c.active);
  const filtered = filterType === 'all' ? movements : movements.filter(m => m.type === filterType);

  // Group movements by day
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups: Record<string, DbMovement[]> = {};
    for (const m of filtered) {
      const day = m.date;
      if (!groups[day]) groups[day] = [];
      groups[day].push(m);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayMovements]) => {
        // Sort within day by created_at descending
        dayMovements.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        const totalEntradas = dayMovements.filter(m => m.type === 'entrada').reduce((s, m) => s + Number(m.quantity), 0);
        const totalSaidas = dayMovements.filter(m => m.type === 'saida').reduce((s, m) => s + Number(m.quantity), 0);
        const totalAjustes = dayMovements.filter(m => m.type === 'ajuste').length;
        return { date, movements: dayMovements, totalEntradas, totalSaidas, totalAjustes };
      });
  }, [filtered]);

  const allCategories = [...new Set([...categories, ...customCategories])].sort();

  const handleAddNewCategory = () => {
    const cat = newCategoryInput.trim();
    if (cat && !allCategories.includes(cat)) {
      setCustomCategories(prev => [...prev, cat]);
      setForm(f => ({ ...f, newProductCategory: cat }));
    }
    setNewCategoryInput('');
  };

  const handleAdd = async () => {
    const qty = parseInt(form.quantity) || 0;
    if (qty <= 0) { toast.error('Informe uma quantidade válida'); return; }
    if (form.type === 'saida' && !form.responsible) { toast.error('Selecione o responsável pela retirada'); return; }

    let productId = form.productId;
    let productName = '';

    if (isNewProduct) {
      if (!form.newProductName.trim()) { toast.error('Informe o nome do produto'); return; }
      if (!form.newProductCategory) { toast.error('Selecione a categoria'); return; }
      const price = parseFloat(form.newProductPrice) || 0;
      try {
        const result = await addProduct.mutateAsync({
          name: form.newProductName.trim(), category: form.newProductCategory,
          quantity: 0, unit_price: price, total_price: 0, unit: selectedBranch, min_stock: null, unit_of_measure: 'UN',
        });
        productId = result.id;
        productName = form.newProductName.trim();
      } catch { return; }
    } else {
      const product = products.find(p => p.id === form.productId);
      if (!product) { toast.error('Selecione um produto'); return; }
      productName = product.name;
    }

    addMovement.mutate({
      product_id: productId, product_name: productName, type: form.type,
      quantity: qty, date: new Date().toISOString().split('T')[0], user: 'Admin',
      responsible: form.type === 'saida' ? form.responsible : null,
      notes: form.notes || null, unit: selectedBranch,
      floor: selectedBranch === 'BH-Matriz' ? (form.floor || null) : null,
      unit_of_measure: 'UN',
    }, {
      onSuccess: () => {
        setForm({ productId: '', type: 'entrada', quantity: '', responsible: '', notes: '', floor: '', newProductName: '', newProductCategory: '', newProductPrice: '' });
        setIsNewProduct(false);
        setDialogOpen(false);
      }
    });
  };

  const openEdit = (m: DbMovement) => {
    setEditMovement(m);
    setEditForm({ type: m.type, quantity: String(m.quantity), responsible: m.responsible || '', notes: m.notes || '', floor: m.floor || '' });
  };

  const handleEdit = () => {
    if (!editMovement) return;
    const qty = parseInt(editForm.quantity) || 0;
    if (qty <= 0) { toast.error('Informe uma quantidade válida'); return; }
    if (editForm.type === 'saida' && !editForm.responsible) { toast.error('Selecione o responsável'); return; }
    updateMovement.mutate({
      id: editMovement.id, type: editForm.type, quantity: qty,
      responsible: editForm.type === 'saida' ? editForm.responsible : null,
      notes: editForm.notes || null,
      floor: selectedBranch === 'BH-Matriz' ? (editForm.floor || null) : null,
    }, { onSuccess: () => setEditMovement(null) });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMovement.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const typeIcon = (t: string) => {
    if (t === 'entrada') return <TrendingUp className="h-3.5 w-3.5" />;
    if (t === 'saida') return <TrendingDown className="h-3.5 w-3.5" />;
    return <RefreshCw className="h-3.5 w-3.5" />;
  };

  const typeLabel = (t: string) => {
    if (t === 'entrada') return 'Entrada';
    if (t === 'saida') return 'Saída';
    return 'Ajuste';
  };

  const typeColor = (t: string) => {
    if (t === 'entrada') return 'text-emerald-600 dark:text-emerald-400';
    if (t === 'saida') return 'text-red-500 dark:text-red-400';
    return 'text-blue-500 dark:text-blue-400';
  };

  const typeBg = (t: string) => {
    if (t === 'entrada') return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (t === 'saida') return 'bg-red-50 dark:bg-red-950/30';
    return 'bg-blue-50 dark:bg-blue-950/30';
  };

  const formatTime = (createdAt: string) => {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonth = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    if (isToday) return `Hoje — ${dayMonth}`;
    if (isYesterday) return `Ontem — ${dayMonth}`;
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} — ${dayMonth}`;
  };

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
        <FloorPicker value={formState.floor || ''} onChange={v => setFormState((f: any) => ({ ...f, floor: v }))} />
      )}
      {!isEdit && (
        <>
          <div className="flex items-center gap-2">
            <Label>Produto</Label>
            <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setIsNewProduct(!isNewProduct)}>
              {isNewProduct ? 'Selecionar existente' : '+ Novo produto'}
            </Button>
          </div>
          {isNewProduct ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="grid gap-2">
                <Label className="text-xs">Nome do produto</Label>
                <Input value={(formState as typeof form).newProductName} onChange={e => setFormState((f: any) => ({ ...f, newProductName: e.target.value }))} placeholder="Nome do novo produto" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Categoria</Label>
                <Select value={(formState as typeof form).newProductCategory} onValueChange={v => setFormState((f: any) => ({ ...f, newProductCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input placeholder="Nova categoria..." value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} className="text-xs h-8" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())} />
                  <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={handleAddNewCategory}>Adicionar</Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Valor Unitário</Label>
                <Input type="number" step="0.01" value={(formState as typeof form).newProductPrice} onChange={e => setFormState((f: any) => ({ ...f, newProductPrice: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
          ) : (
            <Select value={(formState as typeof form).productId || undefined} onValueChange={v => setFormState((f: any) => ({ ...f, productId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </>
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
            <SelectContent>{activeCollabs.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea value={formState.notes} onChange={e => setFormState((f: any) => ({ ...f, notes: e.target.value }))} />
      </div>
    </>
  );

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>;

  // Summary cards
  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((s, m) => s + Number(m.quantity), 0);
  const totalSaidas = movements.filter(m => m.type === 'saida').reduce((s, m) => s + Number(m.quantity), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">Movimentações</h1>
          <p className="text-sm text-muted-foreground">Extrato de entradas, saídas e ajustes de estoque</p>
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
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setIsNewProduct(false); }}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" /> Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Registrar Movimentação</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                {renderFormFields(form, setForm)}
                <Button onClick={handleAdd} disabled={addMovement.isPending || addProduct.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {addMovement.isPending || addProduct.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 p-2">
            <ArrowDownCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">+{totalEntradas}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="rounded-full bg-red-100 dark:bg-red-950/40 p-2">
            <ArrowUpCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-lg font-semibold text-red-500 dark:text-red-400">-{totalSaidas}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-950/40 p-2">
            <Package className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo do Período</p>
            <p className={cn("text-lg font-semibold", totalEntradas - totalSaidas >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
              {totalEntradas - totalSaidas >= 0 ? '+' : ''}{totalEntradas - totalSaidas}
            </p>
          </div>
        </div>
      </div>

      {/* Day groups — Bank statement style */}
      <div className="space-y-4">
        {dayGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma movimentação encontrada.
          </div>
        )}

        {dayGroups.map(group => (
          <div key={group.date} className="rounded-lg border bg-card overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{formatDateFull(group.date)}</span>
                <Badge variant="outline" className="text-xs ml-1">{group.movements.length} mov.</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {group.totalEntradas > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <TrendingUp className="h-3 w-3" /> +{group.totalEntradas}
                  </span>
                )}
                {group.totalSaidas > 0 && (
                  <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                    <TrendingDown className="h-3 w-3" /> -{group.totalSaidas}
                  </span>
                )}
                {group.totalAjustes > 0 && (
                  <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-medium">
                    <RefreshCw className="h-3 w-3" /> {group.totalAjustes} aj.
                  </span>
                )}
                <Separator orientation="vertical" className="h-4" />
                <span className={cn("font-semibold", group.totalEntradas - group.totalSaidas >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                  Saldo: {group.totalEntradas - group.totalSaidas >= 0 ? '+' : ''}{group.totalEntradas - group.totalSaidas}
                </span>
              </div>
            </div>

            {/* Movement rows */}
            <div className="divide-y">
              {group.movements.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  {/* Type indicator */}
                  <div className={cn("flex items-center justify-center rounded-full h-8 w-8 shrink-0", typeBg(m.type))}>
                    <span className={typeColor(m.type)}>{typeIcon(m.type)}</span>
                  </div>

                  {/* Product & details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{m.product_name}</span>
                      <BranchBadge branch={m.unit} floor={m.floor} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatTime(m.created_at)}</span>
                      {m.responsible && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{m.responsible}</span>
                        </>
                      )}
                      {m.notes && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{m.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="text-right shrink-0">
                    <span className={cn("text-sm font-semibold", typeColor(m.type))}>
                      {m.type === 'entrada' ? '+' : m.type === 'saida' ? '-' : ''}
                      {(m.unit_of_measure || 'UN') === 'KG' ? Number(m.quantity).toFixed(3) : m.quantity}
                      {' '}{m.unit_of_measure || 'UN'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* View Sheet — Enhanced details */}
      <Sheet open={!!viewMovement} onOpenChange={open => !open && setViewMovement(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes da Movimentação</SheetTitle>
            <SheetDescription>Informações completas do registro</SheetDescription>
          </SheetHeader>
          {viewMovement && (
            <div className="space-y-5 mt-6">
              {/* Type badge prominent */}
              <div className={cn("flex items-center gap-3 p-4 rounded-lg", typeBg(viewMovement.type))}>
                <div className={cn("rounded-full p-2", typeBg(viewMovement.type))}>
                  <span className={typeColor(viewMovement.type)}>{typeIcon(viewMovement.type)}</span>
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", typeColor(viewMovement.type))}>{typeLabel(viewMovement.type)}</p>
                  <p className={cn("text-lg font-bold", typeColor(viewMovement.type))}>
                    {viewMovement.type === 'entrada' ? '+' : viewMovement.type === 'saida' ? '-' : ''}
                    {(viewMovement.unit_of_measure || 'UN') === 'KG' ? Number(viewMovement.quantity).toFixed(3) : viewMovement.quantity}
                    {' '}{viewMovement.unit_of_measure || 'UN'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Details grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data</p>
                    <p className="text-sm font-medium">{new Date(viewMovement.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hora do Registro</p>
                    <p className="text-sm font-medium">
                      {viewMovement.created_at
                        ? new Date(viewMovement.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Produto</p>
                  <p className="text-sm font-medium">{viewMovement.product_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unidade / Filial</p>
                    <BranchBadge branch={viewMovement.unit} floor={viewMovement.floor} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unidade de Medida</p>
                    <p className="text-sm font-medium">{viewMovement.unit_of_measure || 'UN'}</p>
                  </div>
                </div>

                {viewMovement.responsible && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                    <p className="text-sm font-medium">{viewMovement.responsible}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Registrado por</p>
                  <p className="text-sm font-medium">{viewMovement.user}</p>
                </div>

                {viewMovement.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{viewMovement.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={!!editMovement} onOpenChange={open => !open && setEditMovement(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Editar Movimentação</DialogTitle></DialogHeader>
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
