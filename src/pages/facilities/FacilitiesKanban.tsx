import { useState } from 'react';
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
import { Plus, GripVertical, Trash2, ChevronRight, Calendar } from 'lucide-react';
import { BRANCH_LABELS, ALL_BRANCHES, MAINTENANCE_CATEGORIES, MAINTENANCE_RECURRENCE, MaintenanceTask, MaintenanceStatus, MaintenancePriority, MaintenanceType } from '@/lib/types';
import { format, parseISO } from 'date-fns';

const COLUMNS: { key: MaintenanceStatus; label: string; color: string }[] = [
  { key: 'todo', label: 'Para Fazer', color: 'border-t-muted-foreground' },
  { key: 'approval', label: 'Em Aprovação', color: 'border-t-primary' },
  { key: 'in_progress', label: 'Em Execução', color: 'border-t-blue-500' },
  { key: 'done', label: 'Finalizada', color: 'border-t-green-500' },
];

const priorityColors: Record<string, string> = {
  urgente: 'bg-destructive text-destructive-foreground',
  alta: 'bg-orange-500/20 text-orange-400',
  media: 'bg-primary/20 text-primary',
  baixa: 'bg-muted text-muted-foreground',
};

const priorityLabels: Record<string, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

type FormData = {
  title: string;
  category: string;
  branch: string;
  description: string;
  priority: MaintenancePriority;
  maintenance_type: 'preventiva' | 'corretiva';
  due_date: string;
  supplier: string;
  estimated_cost: string;
  notes: string;
  recurrence_months: string;
};

const emptyForm: FormData = {
  title: '',
  category: '',
  branch: 'BH-Matriz',
  description: '',
  priority: 'media',
  maintenance_type: 'preventiva',
  due_date: '',
  supplier: '',
  estimated_cost: '',
  notes: '',
  recurrence_months: '',
};

export default function FacilitiesKanban() {
  const { selectedFacilitiesBranch } = useApp();
  const { data: tasks = [], isLoading } = useMaintenanceTasks(selectedFacilitiesBranch || undefined);
  const updateTask = useUpdateMaintenanceTask();
  const createTask = useCreateMaintenanceTask();
  const deleteTask = useDeleteMaintenanceTask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const openNew = () => {
    setEditingTask(null);
    setForm(emptyForm);
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
    setForm(f => ({
      ...f,
      category: cat,
      recurrence_months: rec?.months?.toString() || '',
    }));
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

  const moveTask = (task: MaintenanceTask, newStatus: MaintenanceStatus) => {
    updateTask.mutate({
      id: task.id,
      status: newStatus,
      ...(newStatus === 'done' ? { completed_date: new Date().toISOString().split('T')[0] } : {}),
    });
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id);
    setDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="section-title text-xl">Kanban de Manutenções</h1>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Manutenção
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="flex flex-col">
              <div className={`rounded-t-lg border-t-4 ${col.color} bg-card border border-t-0 px-3 py-2 flex items-center justify-between`}>
                <span className="text-sm font-semibold">{col.label}</span>
                <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
              </div>
              <div className="flex-1 space-y-2 p-2 bg-muted/30 rounded-b-lg border border-t-0 min-h-[200px]">
                {colTasks.map(task => {
                  const colIdx = COLUMNS.findIndex(c => c.key === col.key);
                  const nextCol = colIdx < COLUMNS.length - 1 ? COLUMNS[colIdx + 1] : null;
                  return (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(task)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-tight">{task.title}</span>
                          <Badge className={`text-[9px] shrink-0 ${priorityColors[task.priority]}`}>
                            {priorityLabels[task.priority]}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{BRANCH_LABELS[task.branch] || task.branch}</Badge>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(task.due_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                        {nextCol && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs mt-1"
                            onClick={(e) => { e.stopPropagation(); moveTask(task, nextCol.key); }}
                          >
                            Mover para {nextCol.label} <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
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
                <Label>Filial</Label>
                <Select value={form.branch} onValueChange={v => setForm(f => ({ ...f, branch: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <Label>Data Prevista</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recorrência (meses)</Label>
                <Input type="number" min="0" value={form.recurrence_months} onChange={e => setForm(f => ({ ...f, recurrence_months: e.target.value }))} placeholder="Ex: 3" />
              </div>
              <div>
                <Label>Custo Estimado (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.estimated_cost} onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))} />
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
