import { useMemo } from 'react';
import { useMaintenanceTasks } from '@/hooks/use-maintenance';
import { useApp } from '@/contexts/AppContext';
import { KpiCard } from '@/components/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BRANCH_LABELS, MAINTENANCE_CATEGORIES } from '@/lib/types';
import { parseISO, differenceInDays, isBefore } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown, TrendingUp, BarChart3, Hammer, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const CHART_COLORS = {
  preventiva: 'hsl(var(--primary))',
  corretiva: 'hsl(25, 95%, 53%)',
  overdue: 'hsl(var(--destructive))',
  onTime: 'hsl(142, 71%, 45%)',
};

export default function FacilitiesPerformance() {
  const { selectedFacilitiesBranch } = useApp();
  const { data: tasks = [], isLoading } = useMaintenanceTasks(selectedFacilitiesBranch || undefined);

  const metrics = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'done');
    const today = new Date();

    const completedLate = completed.filter(t => {
      if (!t.due_date || !t.completed_date) return false;
      return isBefore(parseISO(t.due_date), parseISO(t.completed_date));
    });

    const completedOnTime = completed.filter(t => {
      if (!t.due_date || !t.completed_date) return false;
      return !isBefore(parseISO(t.due_date), parseISO(t.completed_date));
    });

    const currentlyOverdue = tasks.filter(t => t.status !== 'done' && t.due_date && isBefore(parseISO(t.due_date), today));

    const avgDelay = completedLate.length > 0
      ? Math.round(completedLate.reduce((sum, t) => sum + differenceInDays(parseISO(t.completed_date!), parseISO(t.due_date!)), 0) / completedLate.length)
      : 0;

    const totalWithDates = completed.filter(t => t.due_date && t.completed_date).length;
    const onTimeRate = totalWithDates > 0 ? Math.round((completedOnTime.length / totalWithDates) * 100) : 100;

    const corrective = tasks.filter(t => t.maintenance_type === 'corretiva');
    const preventive = tasks.filter(t => t.maintenance_type === 'preventiva');
    const correctiveRate = tasks.length > 0 ? Math.round((corrective.length / tasks.length) * 100) : 0;

    // Pie chart data: preventiva vs corretiva
    const typeChartData = [
      { name: 'Preventiva', value: preventive.length, fill: CHART_COLORS.preventiva },
      { name: 'Corretiva', value: corrective.length, fill: CHART_COLORS.corretiva },
    ];

    // Categories with most corrective
    const categoryCorrectiveCount = MAINTENANCE_CATEGORIES.map(cat => ({
      category: cat,
      corrective: corrective.filter(t => t.category === cat).length,
      preventiva: preventive.filter(t => t.category === cat).length,
      total: tasks.filter(t => t.category === cat).length,
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    // Branch bar chart data
    const branchMap = tasks.reduce((acc, t) => {
      const label = BRANCH_LABELS[t.branch] || t.branch;
      acc[label] = acc[label] || { name: label, total: 0, overdue: 0, corrective: 0, late: 0 };
      acc[label].total++;
      if (t.status !== 'done' && t.due_date && isBefore(parseISO(t.due_date), today)) acc[label].overdue++;
      if (t.maintenance_type === 'corretiva') acc[label].corrective++;
      if (t.status === 'done' && t.due_date && t.completed_date && isBefore(parseISO(t.due_date), parseISO(t.completed_date))) acc[label].late++;
      return acc;
    }, {} as Record<string, { name: string; total: number; overdue: number; corrective: number; late: number }>);
    const branchChartData = Object.values(branchMap).sort((a, b) => b.total - a.total);

    // Category bar chart data for corrective breakdown
    const categoryChartData = categoryCorrectiveCount.slice(0, 8).map(c => ({
      name: c.category.length > 16 ? c.category.slice(0, 14) + '…' : c.category,
      fullName: c.category,
      Preventiva: c.preventiva,
      Corretiva: c.corrective,
    }));

    return {
      completed: completed.length,
      completedLate: completedLate.length,
      currentlyOverdue: currentlyOverdue.length,
      avgDelay,
      onTimeRate,
      correctiveRate,
      corrective: corrective.length,
      preventive: preventive.length,
      typeChartData,
      categoryChartData,
      branchChartData,
      total: tasks.length,
    };
  }, [tasks]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  const pieChartConfig = {
    Preventiva: { label: 'Preventiva', color: CHART_COLORS.preventiva },
    Corretiva: { label: 'Corretiva', color: CHART_COLORS.corretiva },
  };

  const categoryChartConfig = {
    Preventiva: { label: 'Preventiva', color: CHART_COLORS.preventiva },
    Corretiva: { label: 'Corretiva', color: CHART_COLORS.corretiva },
  };

  const branchChartConfig = {
    total: { label: 'Total', color: 'hsl(var(--primary))' },
    overdue: { label: 'Atrasadas', color: CHART_COLORS.overdue },
    corrective: { label: 'Corretivas', color: CHART_COLORS.corretiva },
  };

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
        {/* Pie: Preventiva vs Corretiva */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Preventiva vs Corretiva
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.total === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
            ) : (
              <div className="flex items-center gap-6">
                <ChartContainer config={pieChartConfig} className="h-[200px] w-[200px] aspect-square">
                  <PieChart>
                    <Pie
                      data={metrics.typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {metrics.typeChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.preventiva }} />
                    <span className="text-sm">Preventiva: <strong>{metrics.preventive}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.corretiva }} />
                    <span className="text-sm">Corretiva: <strong>{metrics.corrective}</strong></span>
                  </div>
                  {metrics.correctiveRate > 40 && (
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 mt-2">
                      <p className="text-xs text-orange-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Alto índice de corretivas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar: Categorias */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              Manutenções por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.categoryChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
            ) : (
              <ChartContainer config={categoryChartConfig} className="h-[250px] w-full">
                <BarChart data={metrics.categoryChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Preventiva" stackId="a" fill={CHART_COLORS.preventiva} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Corretiva" stackId="a" fill={CHART_COLORS.corretiva} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar: Desempenho por Filial */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Desempenho por Filial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.branchChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
          ) : (
            <ChartContainer config={branchChartConfig} className="h-[300px] w-full">
              <BarChart data={metrics.branchChartData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="overdue" fill={CHART_COLORS.overdue} radius={[4, 4, 0, 0]} name="Atrasadas" />
                <Bar dataKey="corrective" fill={CHART_COLORS.corretiva} radius={[4, 4, 0, 0]} name="Corretivas" />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
