import { useMemo } from 'react';
import { useMaintenanceTasks } from '@/hooks/use-maintenance';
import { useApp } from '@/contexts/AppContext';
import { KpiCard } from '@/components/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BRANCH_LABELS, MAINTENANCE_CATEGORIES } from '@/lib/types';
import { parseISO, differenceInDays, isBefore } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown, TrendingUp, BarChart3, Hammer, Shield, DollarSign } from 'lucide-react';

export default function FacilitiesPerformance() {
  const { selectedFacilitiesBranch } = useApp();
  const { data: tasks = [], isLoading } = useMaintenanceTasks(selectedFacilitiesBranch || undefined);

  const metrics = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'done');
    const today = new Date();

    // Late completions: completed after due_date
    const completedLate = completed.filter(t => {
      if (!t.due_date || !t.completed_date) return false;
      return isBefore(parseISO(t.due_date), parseISO(t.completed_date));
    });

    // On-time completions
    const completedOnTime = completed.filter(t => {
      if (!t.due_date || !t.completed_date) return false;
      return !isBefore(parseISO(t.due_date), parseISO(t.completed_date));
    });

    // Currently overdue (not done, past due)
    const currentlyOverdue = tasks.filter(t => t.status !== 'done' && t.due_date && isBefore(parseISO(t.due_date), today));

    // Avg delay in days for late completions
    const avgDelay = completedLate.length > 0
      ? Math.round(completedLate.reduce((sum, t) => sum + differenceInDays(parseISO(t.completed_date!), parseISO(t.due_date!)), 0) / completedLate.length)
      : 0;

    // On-time rate
    const totalWithDates = completed.filter(t => t.due_date && t.completed_date).length;
    const onTimeRate = totalWithDates > 0 ? Math.round((completedOnTime.length / totalWithDates) * 100) : 100;

    // Corrective vs preventive
    const corrective = tasks.filter(t => t.maintenance_type === 'corretiva');
    const preventive = tasks.filter(t => t.maintenance_type === 'preventiva');
    const correctiveRate = tasks.length > 0 ? Math.round((corrective.length / tasks.length) * 100) : 0;

    // Categories with most corrective maintenance
    const categoryCorrectiveCount = MAINTENANCE_CATEGORIES.map(cat => ({
      category: cat,
      corrective: corrective.filter(t => t.category === cat).length,
      total: tasks.filter(t => t.category === cat).length,
    })).filter(c => c.corrective > 0).sort((a, b) => b.corrective - a.corrective);

    // Branches with most issues
    const branchStats = Object.entries(
      tasks.reduce((acc, t) => {
        acc[t.branch] = acc[t.branch] || { total: 0, overdue: 0, corrective: 0, late: 0 };
        acc[t.branch].total++;
        if (t.status !== 'done' && t.due_date && isBefore(parseISO(t.due_date), today)) acc[t.branch].overdue++;
        if (t.maintenance_type === 'corretiva') acc[t.branch].corrective++;
        if (t.status === 'done' && t.due_date && t.completed_date && isBefore(parseISO(t.due_date), parseISO(t.completed_date))) acc[t.branch].late++;
        return acc;
      }, {} as Record<string, { total: number; overdue: number; corrective: number; late: number }>)
    ).map(([branch, stats]) => ({ branch, ...stats })).sort((a, b) => (b.overdue + b.corrective) - (a.overdue + a.corrective));

    // Cost escalation: group done tasks by category+branch, compare costs chronologically
    const costAlerts: { category: string; branch: string; previous: number; latest: number; increase: number }[] = [];
    const doneWithCost = completed.filter(t => t.actual_cost != null && t.actual_cost > 0 && t.completed_date);
    const groupedByCatBranch: Record<string, typeof doneWithCost> = {};
    doneWithCost.forEach(t => {
      const key = `${t.category}|||${t.branch}`;
      if (!groupedByCatBranch[key]) groupedByCatBranch[key] = [];
      groupedByCatBranch[key].push(t);
    });
    Object.entries(groupedByCatBranch).forEach(([key, group]) => {
      if (group.length < 2) return;
      const sorted = [...group].sort((a, b) => parseISO(a.completed_date!).getTime() - parseISO(b.completed_date!).getTime());
      const latest = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];
      if (latest.actual_cost! > previous.actual_cost!) {
        const increase = Math.round(((latest.actual_cost! - previous.actual_cost!) / previous.actual_cost!) * 100);
        if (increase >= 10) {
          const [cat, br] = key.split('|||');
          costAlerts.push({ category: cat, branch: br, previous: previous.actual_cost!, latest: latest.actual_cost!, increase });
        }
      }
    });
    costAlerts.sort((a, b) => b.increase - a.increase);

    // Also check estimated vs actual cost overruns on individual tasks
    const costOverruns = completed.filter(t =>
      t.estimated_cost && t.estimated_cost > 0 && t.actual_cost != null && t.actual_cost > t.estimated_cost
    ).map(t => ({
      ...t,
      overrun: Math.round(((t.actual_cost! - t.estimated_cost!) / t.estimated_cost!) * 100),
    })).sort((a, b) => b.overrun - a.overrun);

    return {
      completed: completed.length,
      completedLate: completedLate.length,
      completedOnTime: completedOnTime.length,
      currentlyOverdue: currentlyOverdue.length,
      avgDelay,
      onTimeRate,
      correctiveRate,
      corrective: corrective.length,
      preventive: preventive.length,
      categoryCorrectiveCount,
      branchStats,
      costAlerts,
      costOverruns,
      total: tasks.length,
    };
  }, [tasks]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="section-title text-xl">Desempenho de Manutenções</h1>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Taxa de Pontualidade" value={`${metrics.onTimeRate}%`} icon={CheckCircle2} variant={metrics.onTimeRate >= 80 ? 'success' : 'destructive'} />
        <KpiCard title="Concluídas com Atraso" value={metrics.completedLate} icon={Clock} variant="warning" />
        <KpiCard title="Atraso Médio" value={`${metrics.avgDelay} dias`} icon={TrendingDown} variant={metrics.avgDelay > 7 ? 'destructive' : 'default'} />
        <KpiCard title="% Corretivas" value={`${metrics.correctiveRate}%`} icon={Hammer} variant={metrics.correctiveRate > 40 ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Preventiva vs Corretiva */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Preventiva vs Corretiva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> Preventiva</span>
                    <span className="text-sm font-bold">{metrics.preventive}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${metrics.total > 0 ? (metrics.preventive / metrics.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-1.5"><Hammer className="h-3.5 w-3.5 text-orange-400" /> Corretiva</span>
                    <span className="text-sm font-bold">{metrics.corrective}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${metrics.total > 0 ? (metrics.corrective / metrics.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
              {metrics.correctiveRate > 40 && (
                <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-orange-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Alto índice de manutenções corretivas. Considere reforçar o plano preventivo.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories with most corrective */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              Categorias com Mais Corretivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.categoryCorrectiveCount.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma manutenção corretiva registrada ✓</p>
            ) : (
              <div className="space-y-2">
                {metrics.categoryCorrectiveCount.slice(0, 6).map(cc => (
                  <div key={cc.category} className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{cc.category}</span>
                      <span className="text-xs text-muted-foreground">{cc.total} total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-[10px]">
                        {cc.corrective} corretiva{cc.corrective !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {cc.total > 0 ? Math.round((cc.corrective / cc.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Escalation Alerts */}
      {metrics.costAlerts.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-400" />
              Alerta de Custos Crescentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Manutenções do mesmo tipo/filial cujo custo real aumentou em relação à execução anterior.</p>
            <div className="space-y-2">
              {metrics.costAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{alert.category}</span>
                    <span className="text-xs text-muted-foreground">{BRANCH_LABELS[alert.branch] || alert.branch}</span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">R$ {alert.previous.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-semibold">R$ {alert.latest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px] mt-0.5">+{alert.increase}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Overruns */}
      {metrics.costOverruns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive" />
              Custos Acima do Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.costOverruns.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{t.category} • {BRANCH_LABELS[t.branch] || t.branch}</span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs text-muted-foreground">
                      Est. R$ {t.estimated_cost!.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} → Real R$ {t.actual_cost!.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Badge variant="destructive" className="text-[10px]">+{t.overrun}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Desempenho por Filial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.branchStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-4">Filial</th>
                    <th className="text-center py-2 px-2">Total</th>
                    <th className="text-center py-2 px-2">Atrasadas</th>
                    <th className="text-center py-2 px-2">Corretivas</th>
                    <th className="text-center py-2 px-2">Finalizadas c/ Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.branchStats.map(bs => (
                    <tr key={bs.branch} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{BRANCH_LABELS[bs.branch] || bs.branch}</td>
                      <td className="text-center py-2 px-2">{bs.total}</td>
                      <td className="text-center py-2 px-2">
                        {bs.overdue > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">{bs.overdue}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        {bs.corrective > 0 ? (
                          <Badge className="text-[10px] bg-orange-500/20 text-orange-400">{bs.corrective}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        {bs.late > 0 ? (
                          <Badge variant="secondary" className="text-[10px]">{bs.late}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
