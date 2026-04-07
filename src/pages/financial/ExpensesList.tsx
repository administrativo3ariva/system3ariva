import { useState } from 'react';
import { useExpenses, useDeleteExpense, useUpdateExpense } from '@/hooks/use-expenses';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
};

export default function ExpensesList() {
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const [filterCC, setFilterCC] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = expenses.filter(e =>
    (filterCC === 'all' || e.cost_center === filterCC) &&
    (filterCompany === 'all' || e.company === filterCompany) &&
    (filterCategory === 'all' || e.category === filterCategory) &&
    (filterStatus === 'all' || e.status === filterStatus)
  );

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Despesas Lançadas</h1>
        <Link to="/financial/expenses/new"><Button><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button></Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={filterCC} onValueChange={setFilterCC}>
          <SelectTrigger><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Centros</SelectItem>
            {FINANCIAL_COST_CENTERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Empresas</SelectItem>
            {FINANCIAL_COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Total: {fmt(filtered.reduce((s, e) => s + Number(e.amount), 0))} — {filtered.length} registro(s)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Centro Custo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cartão</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(e.expense_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{e.description}</TableCell>
                    <TableCell>{e.cost_center}</TableCell>
                    <TableCell>{e.company}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell>{e.card_name || '—'}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(Number(e.amount))}</TableCell>
                    <TableCell>
                      <Select value={e.status} onValueChange={(v) => updateExpense.mutate({ id: e.id, status: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteExpense.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma despesa encontrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
