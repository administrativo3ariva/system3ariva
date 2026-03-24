import { useState } from 'react';
import { CheckCircle2, Circle, MapPin, ImageIcon } from 'lucide-react';
import { useAssets, useUpdateAsset, DbAsset } from '@/hooks/use-assets';
import { BranchBadge } from '@/components/BranchBadge';
import { ALL_BRANCHES, Branch, BRANCH_LABELS } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryBranches() {
  const { data: assets = [], isLoading } = useAssets();
  const updateAsset = useUpdateAsset();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  const branchesWithAssets = [...new Set(assets.map(a => a.branch))].sort();

  const branchStats = branchesWithAssets.map(branch => {
    const branchAssets = assets.filter(a => a.branch === branch);
    const inventoried = branchAssets.filter(a => a.inventoried).length;
    const total = branchAssets.length;
    return { branch, inventoried, total, percent: total > 0 ? Math.round((inventoried / total) * 100) : 0 };
  });

  const globalInventoried = assets.filter(a => a.inventoried).length;
  const globalPercent = assets.length > 0 ? Math.round((globalInventoried / assets.length) * 100) : 0;

  const filteredAssets = selectedBranch === 'all' ? assets : assets.filter(a => a.branch === selectedBranch);

  const toggleInventoried = (asset: DbAsset) => {
    updateAsset.mutate({ id: asset.id, inventoried: !asset.inventoried });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Filiais — Inventário</h1>
        <p className="text-sm text-muted-foreground">Progresso geral: {globalInventoried}/{assets.length} itens ({globalPercent}%)</p>
      </div>

      {/* Branch progress overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branchStats.map(s => (
          <button
            key={s.branch}
            onClick={() => setSelectedBranch(s.branch)}
            className={`bg-card rounded-lg border p-4 text-left transition-colors hover:border-primary/50 ${selectedBranch === s.branch ? 'border-primary ring-1 ring-primary/20' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <BranchBadge branch={s.branch as Branch} />
              {s.percent === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <span className="text-xs text-muted-foreground">{s.percent}%</span>
              )}
            </div>
            <Progress value={s.percent} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground">{s.inventoried}/{s.total} itens conferidos</p>
          </button>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="flex items-center gap-3">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as filiais</SelectItem>
            {branchesWithAssets.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead className="w-[60px]">Foto</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Filial</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map(a => (
              <TableRow key={a.id} className={a.inventoried ? 'bg-green-500/5' : ''}>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleInventoried(a)}>
                    {a.inventoried ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.name} className="w-10 h-10 rounded-md object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="code-asset font-medium">{a.code}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{a.name}</p>
                  {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                </TableCell>
                <TableCell className="text-sm">{a.category}</TableCell>
                <TableCell><BranchBadge branch={a.branch as Branch} floor={a.floor} /></TableCell>
                <TableCell className="text-right font-medium">R$ {Number(a.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
            {filteredAssets.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum item encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
