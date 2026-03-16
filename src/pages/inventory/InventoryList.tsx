import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { BranchBadge } from '@/components/BranchBadge';
import { ALL_BRANCHES, BRANCH_LABELS, Branch } from '@/lib/types';
import { ASSET_CATEGORIES } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InventoryList() {
  const { assets } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [activeBranch, setActiveBranch] = useState<string>('all');

  const branchesWithAssets = [...new Set(assets.map(a => a.branch))].sort();

  const filtered = assets.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== 'all' && a.category !== filterCat) return false;
    if (activeBranch !== 'all' && a.branch !== activeBranch) return false;
    return true;
  });

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
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Aquisição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="table-row-hover">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
