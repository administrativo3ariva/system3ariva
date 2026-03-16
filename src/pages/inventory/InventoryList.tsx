import { useState } from 'react';
import { Search, Filter, Pencil, ImageIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BranchBadge } from '@/components/BranchBadge';
import { ALL_BRANCHES, Branch, AssetItem } from '@/lib/types';
import { ASSET_CATEGORIES } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';

export default function InventoryList() {
  const { assets, setAssets } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<AssetItem>>({});

  const branchesWithAssets = [...new Set(assets.map(a => a.branch))].sort();

  const filtered = assets.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== 'all' && a.category !== filterCat) return false;
    if (activeBranch !== 'all' && a.branch !== activeBranch) return false;
    return true;
  });

  const openEdit = (asset: AssetItem) => {
    setEditingAsset(asset);
    setEditForm({ ...asset });
  };

  const handleSaveEdit = () => {
    if (!editingAsset || !editForm.name || !editForm.category) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const qty = editForm.quantity || 1;
    const price = editForm.unitPrice || 0;
    setAssets(prev =>
      prev.map(a =>
        a.id === editingAsset.id
          ? { ...a, ...editForm, quantity: qty, unitPrice: price, totalPrice: qty * price }
          : a
      )
    );
    toast.success('Item atualizado com sucesso');
    setEditingAsset(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(f => ({ ...f, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Inventário Patrimonial</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} itens — Todas as filiais</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {ASSET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Branch Tabs */}
      <Tabs value={activeBranch} onValueChange={setActiveBranch}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
          {branchesWithAssets.map(b => (
            <TabsTrigger key={b} value={b} className="text-xs">{b}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeBranch} className="mt-4">
          <div className="bg-card rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Foto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Aquisição</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell>
                      {a.imageUrl ? (
                        <img
                          src={a.imageUrl}
                          alt={a.name}
                          className="w-10 h-10 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="code-asset font-medium">{a.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{a.category}</TableCell>
                    <TableCell><BranchBadge branch={a.branch} /></TableCell>
                    <TableCell className="text-right">{a.quantity}</TableCell>
                    <TableCell className="text-right text-sm">R$ {a.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-medium">R$ {a.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(a.acquisitionDate).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Sheet */}
      <Sheet open={!!editingAsset} onOpenChange={open => !open && setEditingAsset(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Editar Patrimônio</SheetTitle>
            <SheetDescription>Código: {editingAsset?.code}</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            {/* Image preview & upload */}
            <div className="grid gap-2">
              <Label>Imagem do Bem</Label>
              <div className="flex items-center gap-4">
                {editForm.imageUrl ? (
                  <img src={editForm.imageUrl} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="text-xs" />
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG até 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Nome do Bem *</Label>
              <Input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria *</Label>
                <Select value={editForm.category || ''} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Filial</Label>
                <Select value={editForm.branch || ''} onValueChange={v => setEditForm(f => ({ ...f, branch: v as Branch }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input type="number" value={editForm.quantity || ''} onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-2">
                <Label>Valor Unit. *</Label>
                <Input type="number" step="0.01" value={editForm.unitPrice || ''} onChange={e => setEditForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-2">
                <Label>Aquisição</Label>
                <Input type="date" value={editForm.acquisitionDate || ''} onChange={e => setEditForm(f => ({ ...f, acquisitionDate: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveEdit} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setEditingAsset(null)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
