import { useState, useMemo } from 'react';
import { useMaintenanceTasks } from '@/hooks/use-maintenance';
import { useApp } from '@/contexts/AppContext';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BRANCH_LABELS } from '@/lib/types';
import { parseISO, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  todo: 'bg-muted text-muted-foreground',
  approval: 'bg-primary/20 text-primary',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
};

const statusLabels: Record<string, string> = {
  todo: 'Para Fazer',
  approval: 'Em Aprovação',
  in_progress: 'Em Execução',
  done: 'Finalizada',
};

export default function FacilitiesCalendar() {
  const { selectedFacilitiesBranch } = useApp();
  const { data: tasks = [], isLoading } = useMaintenanceTasks(selectedFacilitiesBranch || undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksWithDates = useMemo(() => tasks.filter(t => t.due_date), [tasks]);

  const dueDates = useMemo(() => tasksWithDates.map(t => parseISO(t.due_date!)), [tasksWithDates]);

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasksWithDates.filter(t => isSameDay(parseISO(t.due_date!), selectedDate));
  }, [selectedDate, tasksWithDates]);

  // Highlight days with tasks
  const modifiers = useMemo(() => ({
    hasTasks: dueDates,
  }), [dueDates]);

  const modifiersStyles = {
    hasTasks: {
      fontWeight: 700,
      textDecoration: 'underline',
      textDecorationColor: 'hsl(45, 93%, 53%)',
      textUnderlineOffset: '4px',
    } as React.CSSProperties,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="section-title text-xl">Calendário de Manutenções</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card className="w-fit">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma manutenção agendada para esta data.</p>
            ) : (
              <div className="space-y-3">
                {selectedTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{task.title}</span>
                      <Badge className={`text-[10px] ${statusColors[task.status]}`}>{statusLabels[task.status]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{task.category}</span>
                      <span>•</span>
                      <span>{BRANCH_LABELS[task.branch] || task.branch}</span>
                      {task.supplier && <><span>•</span><span>{task.supplier}</span></>}
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
