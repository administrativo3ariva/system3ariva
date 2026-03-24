import { useState, useRef, useCallback } from 'react';
import { useAssets, useAddAsset } from '@/hooks/use-assets';
import { ALL_BRANCHES, Branch, BRANCH_LABELS } from '@/lib/types';
import { FloorPicker } from '@/components/FloorPicker';
import { ASSET_CATEGORIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { PackagePlus, Tag, MapPin, DollarSign, Hash, CalendarDays, FileText, Layers, ImageIcon, Upload, Link, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function InventoryRegister() {
  const { data: assets = [] } = useAssets();
  const addAsset = useAddAsset();
  const [form, setForm] = useState({
    name: '', description: '', category: '', quantity: '1',
    unitPrice: '', branch: '' as string, acquisitionDate: '', floor: '', imageUrl: '',
  });
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      image_url: form.imageUrl || null,
      floor: branch === 'BH-Matriz' ? (form.floor || null) : null,
      inventoried: false,
    }, {
      onSuccess: () => {
        setForm({ name: '', description: '', category: '', quantity: '1', unitPrice: '', branch: '', acquisitionDate: '', floor: '', imageUrl: '' });
      }
    });
  };

  const totalPrice = (parseFloat(form.unitPrice) || 0) * (parseInt(form.quantity) || 1);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <PackagePlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Cadastro de Patrimônio</h1>
          <p className="text-sm text-muted-foreground">Código gerado automaticamente: <span className="font-mono text-primary">3ARI-FILIAL-000</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identificação */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Identificação
            </CardTitle>
            <CardDescription>Informações principais do bem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome do Bem <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Notebook Dell Latitude 5540" />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes adicionais sobre o bem" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Categoria <span className="text-destructive">*</span>
              </Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Imagem */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Imagem do Bem
            </CardTitle>
            <CardDescription>Cole a URL de uma foto do patrimônio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>URL da Imagem</Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://exemplo.com/foto.jpg" />
            </div>
            {form.imageUrl && (
              <div className="flex items-center gap-4">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-lg object-cover border border-border"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <p className="text-xs text-muted-foreground">Pré-visualização da imagem</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Localização
            </CardTitle>
            <CardDescription>Filial e andar de alocação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Filial <span className="text-destructive">*</span></Label>
              <Select value={form.branch || undefined} onValueChange={v => setForm(f => ({ ...f, branch: v, floor: '' }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a filial" /></SelectTrigger>
                <SelectContent>
                  {ALL_BRANCHES.map(b => (
                    <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.branch === 'BH-Matriz' && (
              <FloorPicker
                value={form.floor}
                onChange={v => setForm(f => ({ ...f, floor: v }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Valores e Quantidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Quantidade
                </Label>
                <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Valor Unitário <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0,00" className="pl-9" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  Data de Aquisição
                </Label>
                <Input type="date" value={form.acquisitionDate} onChange={e => setForm(f => ({ ...f, acquisitionDate: e.target.value }))} />
              </div>
            </div>

            {form.unitPrice && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Valor Total</span>
                <span className="text-lg font-semibold text-foreground">
                  {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Código + Submit */}
        <div className="space-y-3">
          {form.branch && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <FileText className="h-4 w-4 text-primary" />
              <div className="text-sm">
                <span className="text-muted-foreground">Código gerado: </span>
                <span className="font-mono font-semibold text-primary">{generateCode(form.branch as Branch)}</span>
              </div>
            </div>
          )}

          <Button type="submit" disabled={addAsset.isPending} className="w-full h-11 text-sm font-semibold">
            <PackagePlus className="h-4 w-4 mr-2" />
            {addAsset.isPending ? 'Cadastrando...' : 'Cadastrar Patrimônio'}
          </Button>
        </div>
      </form>
    </div>
  );
}
