import { Package, AlertTriangle, ArrowLeftRight, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { KpiCard } from '@/components/KpiCard';
import { BranchBadge } from '@/components/BranchBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function StockDashboard() {
  const { products, movements } = useApp();

  const totalValue = products.reduce((s, p) => s + p.totalPrice, 0);
  const totalItems = products.reduce((s, p) => s + p.quantity, 0);
  const lowStock = products.filter(p => p.minStock && p.quantity <= p.minStock);
  const recentMoves = [...movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const categoryTotals = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Dashboard de Estoque</h1>
        <p className="text-sm text-muted-foreground">Visão geral do estoque — Belo Horizonte</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Valor Total" value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="accent" />
        <KpiCard title="Total de Itens" value={totalItems} subtitle={`${products.length} produtos cadastrados`} icon={Package} />
        <KpiCard title="Estoque Baixo" value={lowStock.length} subtitle="Itens abaixo do mínimo" icon={AlertTriangle} variant={lowStock.length > 0 ? 'warning' : 'success'} />
        <KpiCard title="Movimentações" value={movements.length} subtitle="Total registrado" icon={ArrowLeftRight} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements */}
        <div className="bg-card rounded-lg border p-5">
          <h2 className="section-title text-base mb-4">Movimentações Recentes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMoves.map(m => (
                <TableRow key={m.id} className="table-row-hover">
                  <TableCell className="font-medium text-sm">{m.productName}</TableCell>
                  <TableCell>
                    <Badge variant={m.type === 'entrada' ? 'default' : m.type === 'saida' ? 'destructive' : 'secondary'} className="text-xs">
                      {m.type === 'entrada' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {m.type === 'saida' && <TrendingDown className="h-3 w-3 mr-1" />}
                      {m.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{m.quantity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(m.date).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Category Distribution & Low Stock */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-5">
            <h2 className="section-title text-base mb-4">Distribuição por Categoria</h2>
            <div className="space-y-3">
              {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm">{cat}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(val / totalValue) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-24 text-right">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {lowStock.length > 0 && (
            <div className="bg-card rounded-lg border border-warning/30 p-5">
              <h2 className="section-title text-base mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Alertas de Estoque Baixo
              </h2>
              <div className="space-y-2">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      <BranchBadge branch={p.unit} />
                    </div>
                    <span className="text-warning font-medium">{p.quantity} / {p.minStock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
