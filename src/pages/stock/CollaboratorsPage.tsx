import { useState } from 'react';
import { Plus, UserCheck, UserX, Pencil } from 'lucide-react';
import { useCollaborators, useAddCollaborator, useUpdateCollaborator } from '@/hooks/use-collaborators';
import { useApp } from '@/contexts/AppContext';
import { BRANCH_LABELS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BranchBadge } from '@/components/BranchBadge';
import { FloorPicker } from '@/components/FloorPicker';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export default function CollaboratorsPage() {
  const { selectedBranch } = useApp();
  const { data: collaborators = [], isLoading } = useCollaborators();
  const addCollaborator = useAddCollaborator();
  const updateCollaborator = useUpdateCollaborator();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', department: '', floor: '', sala: '' });

  const resetForm = () => setForm({ name: '', department: '', floor: '' });

  const handleSave = () => {
    const floorValue = selectedBranch === 'BH-Matriz' ? (form.floor || null) : null;
    if (editId) {
      updateCollaborator.mutate({ id: editId, name: form.name, department: form.department, floor: floorValue }, {
        onSuccess: () => { resetForm(); setEditId(null); setDialogOpen(false); }
      });
    } else {
      addCollaborator.mutate({ name: form.name, unit: selectedBranch, department: form.department, active: true, floor: floorValue }, {
        onSuccess: () => { resetForm(); setDialogOpen(false); }
      });
    }
  };

  const startEdit = (c: typeof collaborators[0]) => {
    setForm({ name: c.name, department: c.department, floor: c.floor || '' });
    setEditId(c.id);
    setDialogOpen(true);
  };

  const toggleActive = (c: typeof collaborators[0]) => {
    updateCollaborator.mutate({ id: c.id, active: !c.active });
  };

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">Responsáveis — {BRANCH_LABELS[selectedBranch] || selectedBranch}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) { setEditId(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editId ? 'Editar' : 'Cadastrar'} Colaborador</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome Completo</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Departamento</Label>
                <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              {selectedBranch === 'BH-Matriz' && (
                <FloorPicker
                  value={form.floor}
                  onChange={v => setForm(f => ({ ...f, floor: v }))}
                />
              )}
              <Button onClick={handleSave} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {editId ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collaborators.map(c => (
              <TableRow key={c.id} className="table-row-hover">
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><BranchBadge branch={c.unit} floor={c.floor} /></TableCell>
                <TableCell className="text-sm">{c.department}</TableCell>
                <TableCell>
                  {c.active
                    ? <Badge className="bg-success/10 text-success border-success/20"><UserCheck className="h-3 w-3 mr-1" />Ativo</Badge>
                    : <Badge variant="secondary"><UserX className="h-3 w-3 mr-1" />Inativo</Badge>
                  }
                </TableCell>
                <TableCell>
                  <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
