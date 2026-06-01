import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Check, Search, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: 'pendente' | 'ativo' | 'inativo';
  created_at: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProfileRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, status, created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar usuários');
    else setProfiles((data || []) as ProfileRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (p: ProfileRow) => {
    setBusyId(p.id);
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'ativo' })
      .eq('user_id', p.user_id);
    setBusyId(null);
    if (error) toast.error('Erro ao aprovar usuário');
    else {
      toast.success(`${p.full_name || p.email} aprovado!`);
      setProfiles((prev) => prev.map((x) => x.user_id === p.user_id ? { ...x, status: 'ativo' } : x));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    setBusyId(target.id);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ userId: target.user_id }),
    });
    setBusyId(null);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || 'Erro ao remover usuário');
      return;
    }
    toast.success('Usuário removido com sucesso!');
    setProfiles((prev) => prev.filter((x) => x.user_id !== target.user_id));
  };

  const filtered = profiles.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (p.full_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  const statusBadge = (s: ProfileRow['status']) => {
    if (s === 'ativo') return <Badge className="bg-green-500/15 text-green-400 hover:bg-green-500/20 border-green-500/30">Ativo</Badge>;
    if (s === 'pendente') return <Badge className="bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/30">Pendente</Badge>;
    return <Badge variant="secondary">Inativo</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Painel do Administrador
              </h1>
              <p className="text-sm text-muted-foreground">Gerencie usuários cadastrados no sistema</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle>Usuários ({filtered.length})</CardTitle>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((p) => {
                      const isSelf = p.user_id === user?.id;
                      const busy = busyId === p.id;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.full_name || '—'}
                            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{statusBadge(p.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status === 'pendente' && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white h-8"
                                  onClick={() => handleApprove(p)}
                                  disabled={busy}
                                >
                                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                  Aprovar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setConfirmDelete(p)}
                                disabled={busy || isSelf}
                                title={isSelf ? 'Você não pode remover sua própria conta' : 'Remover usuário'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário <strong>{confirmDelete?.full_name || confirmDelete?.email}</strong>?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sim, Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
