import { useState } from 'react';
import { useAssets, useAddAsset } from '@/hooks/use-assets';
import { ALL_BRANCHES, Branch, BH_MATRIZ_FLOORS } from '@/lib/types';
import { ASSET_CATEGORIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function InventoryRegister() {
  const { data: assets = [] } = useAssets();
  const addAsset = useAddAsset();
  const [form, setForm] = useState({
    name: '', description: '', category: '', quantity: '1',
    unitPrice: '', branch: '' as string, acquisitionDate: '', floor: '',
  });

  const generateCode = (branch: Branch) => {
    const branchAssets = assets.filter(a => a.branch === branch);
    const nextNum = branchAssets.length + 1;
    return `3ARI-${branch}-${String(nextNum).padStart(3, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.branch || !form.unitPrice) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const branch = form.branch as Branch;
    const qty = parseInt(form.quantity) || 1;
    const price = parseFloat(form.unitPrice) || 0;
    const code = generateCode(branch);

    addAsset.mutate({
      code,
      name: form.name,
      description: form.description || null,
      category: form.category,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
      branch,
      acquisition_date: form.acquisitionDate || new Date().toISOString().split('T')[0],
      image_url: null,
      floor: branch === 'BH-Matriz' ? (form.floor || null) : null,
    }, {
      onSuccess: () => {
        setForm({ name: '', description: '', category: '', quantity: '1', unitPrice: '', branch: '', acquisitionDate: '', floor: '' });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title text-xl">Cadastro de Patrimônio</h1>
        <p className="text-sm text-muted-foreground">O código será gerado automaticamente no formato 3ARI-FILIAL-000</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-6 space-y-5">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nome do Bem *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Notebook Dell Latitude 5540" />
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes adicionais sobre o bem" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoria *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Filial *</Label>
              <Select value={form.branch || undefined} onValueChange={v => setForm(f => ({ ...f, branch: v, floor: '' }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.branch === 'BH-Matriz' && (
            <div className="grid gap-2">
              <Label>Andar</Label>
              <Select value={form.floor || undefined} onValueChange={v => setForm(f => ({ ...f, floor: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o andar" /></SelectTrigger>
                <SelectContent>
                  {BH_MATRIZ_FLOORS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Valor Unitário *</Label>
              <Input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label>Data de Aquisição</Label>
              <Input type="date" value={form.acquisitionDate} onChange={e => setForm(f => ({ ...f, acquisitionDate: e.target.value }))} />
            </div>
          </div>
        </div>

        {form.branch && (
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            <span className="text-muted-foreground">Código gerado: </span>
            <span className="code-asset font-semibold">{generateCode(form.branch as Branch)}</span>
          </div>
        )}

        <Button type="submit" disabled={addAsset.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {addAsset.isPending ? 'Cadastrando...' : 'Cadastrar Patrimônio'}
        </Button>
      </form>
    </div>
  );
}
