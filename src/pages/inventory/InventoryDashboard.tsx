import { DollarSign, Layers, Monitor, ClipboardCheck } from 'lucide-react';
import { useAssets } from '@/hooks/use-assets';
import { KpiCard } from '@/components/KpiCard';
import { BranchBadge } from '@/components/BranchBadge';
import { BRANCH_LABELS, Branch } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryDashboard() {
  const { data: assets = [], isLoading } = useAssets();

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  const totalValue = assets.reduce((s, a) => s + Number(a.total_price), 0);
  const totalItems = assets.length;
  const inventoriedCount = assets.filter(a => a.inventoried).length;
  const inventoryPercent = totalItems > 0 ? Math.round((inventoriedCount / totalItems) * 100) : 0;

  const byBranch = assets.reduce((acc, a) => {
    acc[a.branch] = (acc[a.branch] || 0) + Number(a.total_price);
    return acc;
  }, {} as Record<string, number>);

  const byCategory = assets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + Number(a.total_price);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Dashboard Patrimonial</h1>
        <p className="text-sm text-muted-foreground">Visão geral do inventário em todas as filiais</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Patrimônio Total" value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="accent" />
        <KpiCard title="Total de Bens" value={totalItems} icon={Monitor} />
        <div className="bg-card rounded-lg border p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-xs font-medium">Progresso do Inventário</span>
          </div>
          <span className="text-2xl font-bold">{inventoryPercent}%</span>
          <Progress value={inventoryPercent} className="h-2" />
          <span className="text-xs text-muted-foreground">{inventoriedCount}/{totalItems} itens conferidos</span>
        </div>
        <KpiCard title="Categorias" value={Object.keys(byCategory).length} icon={Layers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-5">
          <h2 className="section-title text-base mb-4">Patrimônio por Filial</h2>
          <div className="space-y-3">
            {Object.entries(byBranch).sort((a, b) => b[1] - a[1]).map(([branch, val]) => (
              <div key={branch} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BranchBadge branch={branch as Branch} />
                  <span className="text-xs text-muted-foreground hidden sm:inline">{BRANCH_LABELS[branch as Branch]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${totalValue > 0 ? (val / totalValue) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-28 text-right">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5">
          <h2 className="section-title text-base mb-4">Distribuição por Categoria</h2>
          <div className="space-y-3">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm">{cat}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${totalValue > 0 ? (val / totalValue) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-28 text-right">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
