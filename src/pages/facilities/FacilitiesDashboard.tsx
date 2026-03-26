import { useMaintenanceTasks } from '@/hooks/use-maintenance';
import { KpiCard } from '@/components/KpiCard';
import { AlertTriangle, CheckCircle2, Clock, Wrench, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BRANCH_LABELS, MAINTENANCE_CATEGORIES, MAINTENANCE_RECURRENCE } from '@/lib/types';
import { differenceInDays, parseISO, format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const priorityColors: Record<string, string> = {
  urgente: 'bg-destructive text-destructive-foreground',
  alta: 'bg-orange-500/20 text-orange-400',
  media: 'bg-primary/20 text-primary',
  baixa: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  todo: 'Para Fazer',
  approval: 'Em Aprovação',
  in_progress: 'Em Execução',
  done: 'Finalizada',
};

export default function FacilitiesDashboard() {
  const { data: tasks = [], isLoading } = useMaintenanceTasks();

  const today = new Date();
  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && isBefore(parseISO(t.due_date), today));
  const upcoming = tasks.filter(t => t.status !== 'done' && t.due_date && isAfter(parseISO(t.due_date), today) && isBefore(parseISO(t.due_date), addDays(today, 15)));
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'done');
  const pending = tasks.filter(t => t.status !== 'done');

  const alerts = [...overdue, ...upcoming].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
  });

  // Category summary
  const categorySummary = MAINTENANCE_CATEGORIES.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const pendingCount = catTasks.filter(t => t.status !== 'done').length;
    const overdueCount = catTasks.filter(t => t.status !== 'done' && t.due_date && isBefore(parseISO(t.due_date), today)).length;
    return { category: cat, total: catTasks.length, pending: pendingCount, overdue: overdueCount, recurrence: MAINTENANCE_RECURRENCE[cat] };
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="section-title text-xl">Dashboard de Facilities</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Atrasadas" value={overdue.length} icon={<AlertTriangle className="h-5 w-5 text-destructive" />} />
        <KpiCard title="Próximas (15 dias)" value={upcoming.length} icon={<Clock className="h-5 w-5 text-primary" />} />
        <KpiCard title="Em Execução" value={inProgress.length} icon={<Wrench className="h-5 w-5 text-blue-400" />} />
        <KpiCard title="Finalizadas" value={completed.length} icon={<CheckCircle2 className="h-5 w-5 text-green-400" />} />
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alertas de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento ✓</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {alerts.map(task => {
                const isOverdue = task.due_date && isBefore(parseISO(task.due_date), today);
                const daysUntil = task.due_date ? differenceInDays(parseISO(task.due_date), today) : null;
                return (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{task.title}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{task.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{BRANCH_LABELS[task.branch] || task.branch}</span>
                        <span className="text-xs text-muted-foreground">• {statusLabels[task.status] || task.status}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {isOverdue ? (
                        <span className="text-xs font-medium text-destructive">{Math.abs(daysUntil!)} dias atrasada</span>
                      ) : (
                        <span className="text-xs font-medium text-primary">em {daysUntil} dias</span>
                      )}
                      {task.due_date && (
                        <p className="text-[10px] text-muted-foreground">{format(parseISO(task.due_date), "dd/MM/yyyy")}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            Visão por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categorySummary.map(cs => (
              <div key={cs.category} className="p-3 rounded-lg border bg-card/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{cs.category}</span>
                  <Badge variant="secondary" className="text-[10px]">{cs.recurrence.label}</Badge>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{cs.total} total</span>
                  <span>{cs.pending} pendente{cs.pending !== 1 ? 's' : ''}</span>
                  {cs.overdue > 0 && <span className="text-destructive">{cs.overdue} atrasada{cs.overdue !== 1 ? 's' : ''}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
