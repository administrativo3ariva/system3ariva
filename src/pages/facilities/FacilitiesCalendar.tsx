import { useState, useMemo } from 'react';
import { useMaintenanceTasks, useCreateMaintenanceTask, useUpdateMaintenanceTask, useDeleteMaintenanceTask } from '@/hooks/use-maintenance';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BRANCH_LABELS, ALL_BRANCHES, MAINTENANCE_CATEGORIES, MAINTENANCE_RECURRENCE, MaintenanceTask, MaintenancePriority, MaintenanceType } from '@/lib/types';
import { parseISO, format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type FormData = {
  title: string;
  category: string;
  branch: string;
  description: string;
  priority: MaintenancePriority;
  maintenance_type: MaintenanceType;
  due_date: string;
  supplier: string;
  estimated_cost: string;
  notes: string;
  recurrence_months: string;
};

const emptyForm = (date?: string): FormData => ({
  title: '',
  category: '',
  branch: 'BH-Matriz',
  description: '',
  priority: 'media',
  maintenance_type: 'preventiva',
  due_date: date || '',
  supplier: '',
  estimated_cost: '',
  notes: '',
  recurrence_months: '',
});

export default function FacilitiesCalendar() {
  const { selectedFacilitiesBranch } = useApp();
  const { data: tasks = [], isLoading } = useMaintenanceTasks(selectedFacilitiesBranch || undefined);
  const createTask = useCreateMaintenanceTask();
  const updateTask = useUpdateMaintenanceTask();
  const deleteTask = useDeleteMaintenanceTask();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());

  const tasksWithDates = useMemo(() => tasks.filter(t => t.due_date), [tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  const getTasksForDay = (day: Date) => tasksWithDates.filter(t => isSameDay(parseISO(t.due_date!), day));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const openNewForDate = (date: Date) => {
    setEditingTask(null);
    setForm(emptyForm(format(date, 'yyyy-MM-dd')));
    setDialogOpen(true);
  };

  const openEdit = (task: MaintenanceTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      category: task.category,
      branch: task.branch,
      description: task.description || '',
      priority: task.priority,
      maintenance_type: task.maintenance_type || 'preventiva',
      due_date: task.due_date || '',
      supplier: task.supplier || '',
      estimated_cost: task.estimated_cost?.toString() || '',
      notes: task.notes || '',
      recurrence_months: task.recurrence_months?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleCategoryChange = (cat: string) => {
    const rec = MAINTENANCE_RECURRENCE[cat as keyof typeof MAINTENANCE_RECURRENCE];
    setForm(f => ({ ...f, category: cat, recurrence_months: rec?.months?.toString() || '' }));
  };

  const handleSave = () => {
    const payload: any = {
      title: form.title,
      category: form.category,
      branch: form.branch,
      description: form.description || null,
      priority: form.priority,
      maintenance_type: form.maintenance_type,
      due_date: form.due_date || null,
      supplier: form.supplier || null,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : 0,
      notes: form.notes || null,
      recurrence_months: form.recurrence_months ? parseInt(form.recurrence_months) : null,
    };
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...payload });
    } else {
      payload.status = 'todo';
      createTask.mutate(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id);
    setDialogOpen(false);
  };

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];
  const today = new Date();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="section-title text-xl">Calendário de Manutenções</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        {/* Full Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* Padding cells */}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="bg-card/50 min-h-[80px] p-1" />
              ))}
              {daysInMonth.map(day => {
                const dayTasks = getTasksForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasOverdue = dayTasks.some(t => t.status !== 'done' && isBefore(day, today));
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`bg-card min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-accent/30 ${
                      isSelected ? 'ring-2 ring-primary ring-inset' : ''
                    } ${isToday(day) ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isToday(day) ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className={`text-[9px] font-bold ${hasOverdue ? 'text-destructive' : 'text-primary'}`}>
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map(t => (
                        <div
                          key={t.id}
                          className={`text-[9px] truncate rounded px-1 py-0.5 ${statusColors[t.status]}`}
                          onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{dayTasks.length - 2} mais</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day Detail Sidebar */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
                </h3>
                {selectedDate && (
                  <Button size="sm" variant="outline" onClick={() => openNewForDate(selectedDate)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nova
                  </Button>
                )}
              </div>
              {!selectedDate ? (
                <p className="text-xs text-muted-foreground">Clique em um dia no calendário para ver detalhes e agendar manutenções.</p>
              ) : selectedDayTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma manutenção agendada. Clique em "Nova" para criar.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map(task => (
                    <div key={task.id} className="p-2.5 rounded-lg border cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => openEdit(task)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{task.title}</span>
                        <Badge className={`text-[9px] ${statusColors[task.status]}`}>{statusLabels[task.status]}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[9px]">{task.category}</Badge>
                        <Badge variant={task.maintenance_type === 'preventiva' ? 'default' : 'secondary'} className="text-[9px]">
                          {task.maintenance_type === 'preventiva' ? 'Prev.' : 'Corr.'}
                        </Badge>
                        <span>{BRANCH_LABELS[task.branch] || task.branch}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Manutenção preventiva do ar-condicionado" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.maintenance_type} onValueChange={v => setForm(f => ({ ...f, maintenance_type: v as MaintenanceType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Filial</Label>
                <Select value={form.branch} onValueChange={v => setForm(f => ({ ...f, branch: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as MaintenancePriority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Prevista</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div>
                <Label>Recorrência (meses)</Label>
                <Input type="number" min="0" value={form.recurrence_months} onChange={e => setForm(f => ({ ...f, recurrence_months: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fornecedor</Label>
                <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
              </div>
              <div>
                <Label>Custo Estimado (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.estimated_cost} onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingTask && (
              <Button variant="destructive" size="sm" onClick={() => handleDelete(editingTask.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.title || !form.category}>{editingTask ? 'Salvar' : 'Criar'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
