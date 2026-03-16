import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useProducts, useAddProduct } from '@/hooks/use-products';
import { BranchBadge } from '@/components/BranchBadge';
import { STOCK_UNITS, StockUnit } from '@/lib/types';
import { PRODUCT_CATEGORIES } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function StockProducts() {
  const { data: products = [], isLoading } = useProducts();
  const addProduct = useAddProduct();
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unitPrice: '', unit: 'BH-Matriz' as StockUnit, minStock: '' });

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterUnit !== 'all' && p.unit !== filterUnit) return false;
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
      unit: form.unit,
      min_stock: parseInt(form.minStock) || null,
    }, {
      onSuccess: () => {
        setForm({ name: '', category: '', quantity: '', unitPrice: '', unit: 'BH-Matriz', minStock: '' });
        setDialogOpen(false);
      }
    });
  };

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">Produtos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} produtos encontrados</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas unidades</SelectItem>
            {STOCK_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
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
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Valor Unit.</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="table-row-hover">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-sm">{p.category}</TableCell>
                <TableCell><BranchBadge branch={p.unit} /></TableCell>
                <TableCell className={`text-right font-medium ${p.min_stock && p.quantity <= p.min_stock ? 'text-warning' : ''}`}>{p.quantity}</TableCell>
                <TableCell className="text-right text-sm">R$ {Number(p.unit_price).toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">R$ {Number(p.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
