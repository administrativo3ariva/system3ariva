import { useMemo, useState } from 'react';
import { addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useMaintenanceTasks, useUpdateMaintenanceTask, useCreateMaintenanceTask, useDeleteMaintenanceTask } from '@/hooks/use-maintenance';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CurrencyInput } from '@/components/CurrencyInput';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Calendar, CheckCircle2, Clock3, AlertTriangle, Wrench, Search, PlayCircle, ClipboardCheck, RotateCcw, Building2 } from 'lucide-react';
import { BRANCH_LABELS, ALL_BRANCHES, MAINTENANCE_CATEGORIES, MAINTENANCE_RECURRENCE, MaintenanceTask, MaintenanceStatus, MaintenancePriority, MaintenanceType } from '@/lib/types';

const STATUS_OPTIONS: { key: MaintenanceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'todo', label: 'A fazer' },
  { key: 'approval', label: 'Aprovação' },
  { key: 'in_progress', label: 'Execução' },
  { key: 'done', label: 'Finalizadas' },
];

const STATUS_STEPS: { key: MaintenanceStatus; label: string }[] = STATUS_OPTIONS.filter(
  (option): option is { key: MaintenanceStatus; label: string } => option.key !== 'all',
);

const RECURRENCE_PRESETS = [
  { value: '0', label: 'Sem recorrência' },
  { value: '1', label: 'Mensal' },
  { value: '3', label: 'Trimestral' },
  { value: '6', label: 'Semestral' },
  { value: '12', label: 'Anual' },
  { value: 'custom', label: 'Personalizada' },
] as const;

const statusLabels: Record<MaintenanceStatus, string> = {
  todo: 'A fazer',
  approval: 'Em aprovação',
  in_progress: 'Em execução',
  done: 'Finalizada',
};

const statusBadgeClasses: Record<MaintenanceStatus, string> = {
  todo: 'bg-muted text-muted-foreground hover:bg-muted',
  approval: 'bg-primary/15 text-primary hover:bg-primary/15',
  in_progress: 'bg-warning/15 text-warning hover:bg-warning/15',
  done: 'bg-success/15 text-success hover:bg-success/15',
};

const priorityClasses: Record<MaintenancePriority, string> = {
  urgente: 'bg-destructive text-destructive-foreground hover:bg-destructive',
  alta: 'bg-warning/20 text-warning hover:bg-warning/20',
  media: 'bg-primary/15 text-primary hover:bg-primary/15',
  baixa: 'bg-muted text-muted-foreground hover:bg-muted',
};

const priorityLabels: Record<MaintenancePriority, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

const statusProgress: Record<MaintenanceStatus, number> = {
  todo: 15,
  approval: 42,
  in_progress: 72,
  done: 100,
};

type FormData = {
  title: string;
  category: string;
  branch: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  maintenance_type: 'preventiva' | 'corretiva';
  due_date: string;
  estimated_cost: number;
  actual_cost: number;
  supplier: string;
  notes: string;
  recurrence_preset: string;
  recurrence_months: string;
};

const emptyForm: FormData = {
  title: '',
  category: '',
  branch: 'BH-Matriz',
  description: '',
  status: 'todo',
  priority: 'media',
  maintenance_type: 'preventiva',
  due_date: '',
  estimated_cost: 0,
  actual_cost: 0,
  supplier: '',
  notes: '',
  recurrence_preset: '0',
  recurrence_months: '',
};

const fmtBRL = (value?: number | null) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getRecurrencePreset = (months?: number | null) => {
  if (!months) return '0';
  return RECURRENCE_PRESETS.some(preset => preset.value === String(months)) ? String(months) : 'custom';
};

function getDueState(task: MaintenanceTask) {
  if (!task.due_date) return { label: 'Sem data', className: 'text-muted-foreground', days: 9999 };
  const days = differenceInCalendarDays(parseISO(task.due_date), new Date());
  if (task.status === 'done') return { label: `Concluída em ${task.completed_date ? format(parseISO(task.completed_date), 'dd/MM') : '—'}`, className: 'text-success', days };
  if (days < 0) return { label: `${Math.abs(days)}d atrasada`, className: 'text-destructive', days };
  if (days === 0) return { label: 'Vence hoje', className: 'text-warning', days };
  if (days <= 7) return { label: `Vence em ${days}d`, className: 'text-warning', days };
  return { label: format(parseISO(task.due_date), 'dd/MM/yyyy'), className: 'text-muted-foreground', days };
}

function getNextStatus(status: MaintenanceStatus): MaintenanceStatus | null {
  if (status === 'todo') return 'approval';
  if (status === 'approval') return 'in_progress';
  if (status === 'in_progress') return 'done';
  return null;
}

function sortTasks(a: MaintenanceTask, b: MaintenanceTask) {
  const priorityWeight: Record<MaintenancePriority, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };
  const aDue = a.due_date ? parseISO(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
  const bDue = b.due_date ? parseISO(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
  return aDue - bDue || priorityWeight[a.priority] - priorityWeight[b.priority] || a.title.localeCompare(b.title);
}

export default function FacilitiesKanban() {
  const { selectedFacilitiesBranch } = useApp();
  const { data: tasks = [], isLoading } = useMaintenanceTasks(selectedFacilitiesBranch || undefined);
  const updateTask = useUpdateMaintenanceTask();
  const createTask = useCreateMaintenanceTask();
  const deleteTask = useDeleteMaintenanceTask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'all'>('all');
  const [search, setSearch] = useState('');

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const overdueTasks = activeTasks.filter(t => t.due_date && differenceInCalendarDays(parseISO(t.due_date), new Date()) < 0);
  const dueSoonTasks = activeTasks.filter(t => t.due_date && differenceInCalendarDays(parseISO(t.due_date), new Date()) >= 0 && differenceInCalendarDays(parseISO(t.due_date), new Date()) <= 7);
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const completionRate = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks
      .filter(task => statusFilter === 'all' || task.status === statusFilter)
      .filter(task => priorityFilter === 'all' || task.priority === priorityFilter)
      .filter(task => typeFilter === 'all' || task.maintenance_type === typeFilter)
      .filter(task => !term || [task.title, task.category, task.branch, task.supplier, task.description].some(value => value?.toLowerCase().includes(term)))
      .sort(sortTasks);
  }, [priorityFilter, search, statusFilter, tasks, typeFilter]);

  const selectedTask = useMemo(() => {
    if (selectedTaskId) return tasks.find(t => t.id === selectedTaskId) || filteredTasks[0] || null;
    return filteredTasks[0] || null;
  }, [filteredTasks, selectedTaskId, tasks]);

  const suggestedTasks = useMemo(() => activeTasks.sort(sortTasks).slice(0, 5), [activeTasks]);

  const openNew = () => {
    setEditingTask(null);
    setForm({ ...emptyForm, branch: selectedFacilitiesBranch || emptyForm.branch });
    setDialogOpen(true);
  };

  const openEdit = (task: MaintenanceTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      category: task.category,
      branch: task.branch,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      maintenance_type: task.maintenance_type || 'preventiva',
      due_date: task.due_date || '',
      estimated_cost: Number(task.estimated_cost) || 0,
      actual_cost: Number(task.actual_cost) || 0,
      supplier: task.supplier || '',
      notes: task.notes || '',
      recurrence_preset: getRecurrencePreset(task.recurrence_months),
      recurrence_months: task.recurrence_months?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleCategoryChange = (cat: string) => {
    const rec = MAINTENANCE_RECURRENCE[cat as keyof typeof MAINTENANCE_RECURRENCE];
    setForm(f => ({
      ...f,
      category: cat,
      recurrence_preset: getRecurrencePreset(rec?.months),
      recurrence_months: rec?.months?.toString() || '',
    }));
  };

  const handleRecurrencePresetChange = (value: string) => {
    setForm(f => ({
      ...f,
      recurrence_preset: value,
      recurrence_months: value === 'custom' ? f.recurrence_months : value === '0' ? '' : value,
    }));
  };

  const handleSave = () => {
    const payload: any = {
      title: form.title,
      category: form.category,
      branch: form.branch,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      maintenance_type: form.maintenance_type,
      due_date: form.due_date || null,
      completed_date: form.status === 'done' ? (editingTask?.completed_date || new Date().toISOString().split('T')[0]) : null,
      estimated_cost: form.estimated_cost || 0,
      actual_cost: form.actual_cost || null,
      supplier: form.supplier || null,
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

  const moveTask = (task: MaintenanceTask, newStatus: MaintenanceStatus) => {
    updateTask.mutate({
      id: task.id,
      status: newStatus,
      ...(newStatus === 'done' ? { completed_date: new Date().toISOString().split('T')[0] } : {}),
    }, {
      onSuccess: () => {
        if (newStatus === 'done' && task.recurrence_months && task.recurrence_months > 0) {
          const baseDate = task.due_date ? new Date(task.due_date) : new Date();
          const nextDue = addMonths(baseDate, task.recurrence_months);
          createTask.mutate({
            title: task.title,
            category: task.category,
            branch: task.branch,
            description: task.description,
            priority: task.priority,
            maintenance_type: task.maintenance_type,
            due_date: format(nextDue, 'yyyy-MM-dd'),
            supplier: task.supplier,
            estimated_cost: task.estimated_cost,
            notes: null,
            recurrence_months: task.recurrence_months,
            status: 'todo',
          } as any);
        }
      },
    });
  };

  const confirmDelete = () => {
    if (!editingTask) return;
    deleteTask.mutate(editingTask.id);
    setDeleteOpen(false);
    setDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="section-title text-xl">Central de Manutenções</h1>
          <p className="text-sm text-muted-foreground">Priorize vencimentos, acompanhe execução e avance tarefas sem arrastar cartões.</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nova Manutenção
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" />Atrasadas</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold text-destructive">{overdueTasks.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />Próx. 7 dias</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold text-warning">{dueSoonTasks.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><Wrench className="h-4 w-4" />Em execução</CardTitle></CardHeader>
          <CardContent><div className="number-safe text-2xl font-bold">{inProgressTasks.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />Concluídas</CardTitle></CardHeader>
          <CardContent>
            <div className="number-safe text-2xl font-bold text-success">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Fila operacional</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar manutenção" className="pl-9" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(option => (
                <Button key={option.key} variant={statusFilter === option.key ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(option.key)}>
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v as MaintenancePriority | 'all')}>
                <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={v => setTypeFilter(v as MaintenanceType | 'all')}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="flex h-56 items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">Nenhuma manutenção encontrada</div>
            ) : filteredTasks.map(task => {
              const due = getDueState(task);
              const nextStatus = getNextStatus(task.status);
              const selected = selectedTask?.id === task.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full rounded-md border bg-card p-3 text-left transition-colors hover:bg-muted/30 ${selected ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_150px_132px] lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={priorityClasses[task.priority]}>{priorityLabels[task.priority]}</Badge>
                        <Badge className={statusBadgeClasses[task.status]}>{statusLabels[task.status]}</Badge>
                        <Badge variant="outline">{task.maintenance_type === 'preventiva' ? 'Preventiva' : 'Corretiva'}</Badge>
                      </div>
                      <div>
                        <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{task.category}{task.supplier ? ` · ${task.supplier}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{BRANCH_LABELS[task.branch] || task.branch}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${due.className}`}>
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{due.label}</span>
                    </div>
                    <div className="flex gap-1 lg:justify-end">
                      {nextStatus && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={(e) => { e.stopPropagation(); moveTask(task, nextStatus); }}
                        >
                          {nextStatus === 'done' ? <ClipboardCheck className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); openEdit(task); }}>Editar</Button>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Próximas ações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {suggestedTasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ação pendente.</p>}
              {suggestedTasks.map(task => {
                const due = getDueState(task);
                return (
                  <div key={task.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className={`text-xs ${due.className}`}>{due.label}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTaskId(task.id)}>Ver</Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Detalhe rápido</CardTitle></CardHeader>
            <CardContent>
              {!selectedTask ? (
                <p className="text-sm text-muted-foreground">Selecione uma manutenção para ver detalhes.</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={priorityClasses[selectedTask.priority]}>{priorityLabels[selectedTask.priority]}</Badge>
                      <Badge className={statusBadgeClasses[selectedTask.status]}>{statusLabels[selectedTask.status]}</Badge>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold leading-tight">{selectedTask.title}</h2>
                      <p className="text-sm text-muted-foreground">{selectedTask.category}</p>
                    </div>
                  </div>
                  <Progress value={statusProgress[selectedTask.status]} className="h-2" />
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Filial</span><span className="text-right">{BRANCH_LABELS[selectedTask.branch] || selectedTask.branch}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Vencimento</span><span className={getDueState(selectedTask).className}>{selectedTask.due_date ? format(parseISO(selectedTask.due_date), 'dd/MM/yyyy') : 'Sem data'}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Recorrência</span><span>{selectedTask.recurrence_months ? `${selectedTask.recurrence_months} meses` : 'Sob demanda'}</span></div>
                    {selectedTask.supplier && <div className="flex justify-between gap-3"><span className="text-muted-foreground">Fornecedor</span><span className="text-right">{selectedTask.supplier}</span></div>}
                  </div>
                  {selectedTask.description && <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">{selectedTask.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {getNextStatus(selectedTask.status) && (
                      <Button size="sm" onClick={() => moveTask(selectedTask, getNextStatus(selectedTask.status)!)}>
                        Avançar etapa
                      </Button>
                    )}
                    {selectedTask.status === 'done' && (
                      <Button size="sm" variant="outline" onClick={() => moveTask(selectedTask, 'todo')}>
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reabrir
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEdit(selectedTask)}>Editar</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
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
                <Input type="number" min="0" value={form.recurrence_months} onChange={e => setForm(f => ({ ...f, recurrence_months: e.target.value }))} placeholder="Ex: 3" />
              </div>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Nome do fornecedor" />
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
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1 h-4 w-4" /> Excluir
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.title || !form.category}>{editingTask ? 'Salvar' : 'Criar'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir manutenção?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação remove a manutenção selecionada e não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
