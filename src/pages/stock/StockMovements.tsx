import { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, RefreshCw, Eye, Pencil, Trash2, Calendar, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts, useAddProduct } from '@/hooks/use-products';
import { useMovements, useAddMovement, useUpdateMovement, useDeleteMovement, DbMovement } from '@/hooks/use-movements';
import { useCollaborators } from '@/hooks/use-collaborators';
import { useApp } from '@/contexts/AppContext';
import { useCategories } from '@/hooks/use-categories';
import { BranchBadge } from '@/components/BranchBadge';
import { FloorPicker } from '@/components/FloorPicker';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';

interface DayGroup {
  date: string;
  movements: DbMovement[];
  totalEntradas: number;
  totalSaidas: number;
  totalAjustes: number;
}

interface NfInfo {
  supplier: string | null;
  file_name: string | null;
  total_value: number | null;
  issue_date: string | null;
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
    quantity: '', responsible: '', notes: '', floor: '', sala: '',
    newProductName: '', newProductCategory: '', newProductPrice: '',
  });

  const [viewMovement, setViewMovement] = useState<DbMovement | null>(null);
  const [nfInfo, setNfInfo] = useState<NfInfo | null>(null);
  const [nfLoading, setNfLoading] = useState(false);
  const [editMovement, setEditMovement] = useState<DbMovement | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'entrada' as string, quantity: '', responsible: '', notes: '', floor: '', sala: '',
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCollabs = collaborators.filter(c => c.active);
  const filtered = filterType === 'all' ? movements : movements.filter(m => m.type === filterType);

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
        dayMovements.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        const totalEntradas = dayMovements.filter(m => m.type === 'entrada').reduce((s, m) => s + Number(m.quantity), 0);
        const totalSaidas = dayMovements.filter(m => m.type === 'saida').reduce((s, m) => s + Number(m.quantity), 0);
        const totalAjustes = dayMovements.filter(m => m.type === 'ajuste').length;
        return { date, movements: dayMovements, totalEntradas, totalSaidas, totalAjustes };
      });
  }, [filtered]);

  const allCategories = [...new Set([...categories, ...customCategories])].sort();

  // Fetch NF info when viewing a movement
  const handleViewMovement = async (m: DbMovement) => {
    setViewMovement(m);
    setNfInfo(null);
    setNfLoading(true);
    try {
      // Try to find an NF that contains this product in the same unit
      const { data: nfItems } = await supabase
        .from('nf_items')
        .select('nf_upload_id')
        .ilike('name', `%${m.product_name}%`)
        .limit(5);

      if (nfItems && nfItems.length > 0) {
        const nfIds = nfItems.map(i => i.nf_upload_id);
        const { data: nfs } = await supabase
          .from('nf_uploads')
          .select('supplier, file_name, total_value, issue_date')
          .in('id', nfIds)
          .eq('unit', m.unit)
          .order('upload_date', { ascending: false })
          .limit(1);

        if (nfs && nfs.length > 0) {
          setNfInfo(nfs[0]);
        }
      }
    } catch {
      // silently fail
    } finally {
      setNfLoading(false);
    }
  };

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

    // Build notes: append sala info for 8º andar
    let finalNotes = form.notes || '';
    if (selectedBranch === 'BH-Matriz' && form.floor === '8º andar' && form.sala) {
      const salaNote = `Sala ${form.sala}`;
      finalNotes = finalNotes ? `${salaNote} | ${finalNotes}` : salaNote;
    }

    addMovement.mutate({
      product_id: productId, product_name: productName, type: form.type,
      quantity: qty, date: new Date().toISOString().split('T')[0], user: 'Admin',
      responsible: form.type === 'saida' ? form.responsible : null,
      notes: finalNotes || null, unit: selectedBranch,
      floor: selectedBranch === 'BH-Matriz' ? (form.floor || null) : null,
      unit_of_measure: 'UN',
    }, {
      onSuccess: () => {
        setForm({ productId: '', type: 'entrada', quantity: '', responsible: '', notes: '', floor: '', sala: '', newProductName: '', newProductCategory: '', newProductPrice: '' });
        setIsNewProduct(false);
        setDialogOpen(false);
      }
    });
  };

  const openEdit = (m: DbMovement) => {
    setEditMovement(m);
    setEditForm({ type: m.type, quantity: String(m.quantity), responsible: m.responsible || '', notes: m.notes || '', floor: m.floor || '', sala: '' });
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
    return new Date(createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayMonth = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (d.toDateString() === today.toDateString()) return `Hoje — ${dayMonth}`;
    if (d.toDateString() === yesterday.toDateString()) return `Ontem — ${dayMonth}`;
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} — ${dayMonth}`;
  };

  const formatQty = (m: DbMovement) => {
    const val = (m.unit_of_measure || 'UN') === 'KG' ? Number(m.quantity).toFixed(3) : String(m.quantity);
    return val;
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
      <div className="space-y-0 rounded-lg border bg-card overflow-hidden">
        {dayGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma movimentação encontrada.
          </div>
        )}

        {dayGroups.map((group, gi) => (
          <div key={group.date}>
            {/* Day summary header */}
            <div className={cn("grid grid-cols-[1fr_auto_auto_auto] items-center gap-6 px-5 py-3 bg-muted/50", gi > 0 && "border-t")}>
              <span className="text-sm font-bold">{formatDateFull(group.date)}</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-muted-foreground">Entradas</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 ml-1">+{group.totalEntradas}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                <span className="text-xs text-muted-foreground">Saídas</span>
                <span className="text-sm font-bold text-red-500 dark:text-red-400 ml-1">-{group.totalSaidas}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Saldo do dia</span>
                <span className={cn("text-sm font-bold ml-1", group.totalEntradas - group.totalSaidas >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                  {group.totalEntradas - group.totalSaidas >= 0 ? '+' : ''}{group.totalEntradas - group.totalSaidas}
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_80px_80px_minmax(0,1fr)_minmax(0,1.2fr)_90px] gap-2 px-5 py-2 border-y bg-muted/20 text-xs text-muted-foreground font-medium">
              <span>Produto</span>
              <span>Unidade</span>
              <span>Data</span>
              <span className="text-right">Qtd</span>
              <span>Responsável</span>
              <span>Observações</span>
              <span className="text-right">Detalhes</span>
            </div>

            {/* Movement rows */}
            {group.movements.map((m, mi) => (
              <div key={m.id} className={cn("grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_80px_80px_minmax(0,1fr)_minmax(0,1.2fr)_90px] gap-2 px-5 py-3 items-center hover:bg-muted/30 transition-colors group", mi < group.movements.length - 1 && "border-b border-dashed border-border/50")}>
                {/* Produto */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("shrink-0", typeColor(m.type))}>{typeIcon(m.type)}</span>
                  <span className="text-sm font-medium truncate">{m.product_name}</span>
                </div>

                {/* Unidade */}
                <div className="min-w-0">
                  <BranchBadge branch={m.unit} floor={m.floor} />
                </div>

                {/* Data */}
                <span className="text-sm text-muted-foreground">
                  {new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>

                {/* Qtd */}
                <span className={cn("text-sm font-semibold text-right", typeColor(m.type))}>
                  {m.type === 'entrada' ? '+' : m.type === 'saida' ? '-' : ''}{formatQty(m)}
                </span>

                {/* Responsável */}
                <span className="text-sm text-muted-foreground truncate">{m.responsible || '—'}</span>

                {/* Observações */}
                <span className="text-sm text-muted-foreground truncate">{m.notes || '—'}</span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewMovement(m)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(m)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* View Sheet — Enhanced details with NF info */}
      <Sheet open={!!viewMovement} onOpenChange={open => { if (!open) { setViewMovement(null); setNfInfo(null); } }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes da Movimentação</SheetTitle>
            <SheetDescription>Informações completas do registro</SheetDescription>
          </SheetHeader>
          {viewMovement && (
            <div className="space-y-5 mt-6">
              {/* Type badge */}
              <div className={cn("flex items-center gap-3 p-4 rounded-lg", typeBg(viewMovement.type))}>
                <div className={cn("rounded-full p-2", typeBg(viewMovement.type))}>
                  <span className={typeColor(viewMovement.type)}>{typeIcon(viewMovement.type)}</span>
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", typeColor(viewMovement.type))}>{typeLabel(viewMovement.type)}</p>
                  <p className={cn("text-lg font-bold", typeColor(viewMovement.type))}>
                    {viewMovement.type === 'entrada' ? '+' : viewMovement.type === 'saida' ? '-' : ''}
                    {formatQty(viewMovement)} {viewMovement.unit_of_measure || 'UN'}
                  </p>
                </div>
              </div>

              <Separator />

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

                {/* NF Info Section */}
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Dados da Nota Fiscal</p>
                  {nfLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : nfInfo ? (
                    <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Fornecedor</p>
                          <p className="text-sm font-medium">{nfInfo.supplier || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Arquivo NF</p>
                          <p className="text-sm font-medium truncate">{nfInfo.file_name || '—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Data Emissão NF</p>
                          <p className="text-sm font-medium">
                            {nfInfo.issue_date
                              ? new Date(nfInfo.issue_date + 'T12:00:00').toLocaleDateString('pt-BR')
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Valor Total NF</p>
                          <p className="text-sm font-medium">
                            {nfInfo.total_value != null
                              ? `R$ ${Number(nfInfo.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhuma NF vinculada a este produto foi encontrada.</p>
                  )}
                </div>
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
