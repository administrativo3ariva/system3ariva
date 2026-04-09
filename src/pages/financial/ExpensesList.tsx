import { useState } from 'react';
import { useExpenses, useDeleteExpense, useUpdateExpense } from '@/hooks/use-expenses';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { FinancialDetailDialog } from '@/components/FinancialDetailDialog';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Eye, Pencil, AlertTriangle, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {};
  items.forEach(item => {
    const date = item.expense_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function ExpensesList() {
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const [filterCC, setFilterCC] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewItem, setViewItem] = useState<any | null>(null);

  const filtered = expenses.filter((e: any) =>
    (filterCC === 'all' || e.cost_center === filterCC) &&
    (filterCompany === 'all' || e.company === filterCompany) &&
    (filterCategory === 'all' || e.category === filterCategory) &&
    (filterStatus === 'all' || e.status === filterStatus)
  );

  const grouped = groupByDate(filtered);
  const total = filtered.reduce((s: number, e: any) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas Lançadas</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} registro(s) • Total: {fmt(total)}</p>
        </div>
        <Link to="/financial/expenses/new"><Button><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button></Link>
      </div>

      {/* Filters */}
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

      {/* Bank-statement style list */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Carregando...</p>
      ) : grouped.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma despesa encontrada</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => {
            const dayTotal = items.reduce((s: number, e: any) => s + Number(e.amount), 0);
            return (
              <Card key={date}>
                {/* Day header */}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {format(parseISO(date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{fmt(dayTotal)}</span>
                </div>

                {/* Items */}
                <div className="divide-y">
                  {items.map((e: any) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors group"
                    >
                      {/* Status indicator */}
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        e.status === 'aprovado' ? 'bg-green-500' :
                        e.status === 'rejeitado' ? 'bg-red-500' : 'bg-yellow-500'
                      )} />

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{e.description}</p>
                        {(e as any).supplier && (
                          <span className="text-[10px] text-muted-foreground">{(e as any).supplier}</span>
                        )}
                        {!e.receipt_url && (
                          <span className="text-[10px] text-yellow-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3" /> Pendente de NF
                          </span>
                        )}
                        {e.is_installment && e.installment_count && (
                          <span className="text-[10px] text-primary mt-0.5 block">
                            Parcela {e.installment_current || 1}/{e.installment_count}
                          </span>
                        )}
                      </div>

                      {/* Company */}
                      <span className="text-xs text-muted-foreground w-16 text-center hidden lg:block">{e.company}</span>

                      {/* Cost Center */}
                      <span className="text-xs text-muted-foreground w-12 text-center hidden md:block">{e.cost_center}</span>

                      {/* Category */}
                      <span className="text-xs text-muted-foreground min-w-[140px] text-center hidden xl:block">{e.category}</span>

                      {/* Card / Payment */}
                      <div className="w-36 hidden lg:flex items-center justify-center">
                        {e.card_name ? (
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                            <CreditCard className="h-3 w-3" />
                            {e.card_name.replace('Cartão Final ', '')}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Amount */}
                      <span className="text-sm font-semibold tabular-nums text-foreground w-28 text-right">
                        {fmt(Number(e.amount))}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(e)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Link to={`/financial/expenses/new?edit=${e.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteExpense.mutate(e.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {viewItem && (
        <FinancialDetailDialog
          open={!!viewItem}
          onOpenChange={(open) => { if (!open) setViewItem(null); }}
          title={viewItem.description}
          status={viewItem.status}
          statusColor=""
          amount={Number(viewItem.amount)}
          paymentLabel={viewItem.card_name || undefined}
          installmentInfo={viewItem.is_installment && viewItem.installment_count ? `Parcela ${viewItem.installment_current || 1}/${viewItem.installment_count}` : null}
          fields={[
            { label: 'Data', value: format(parseISO(viewItem.expense_date), 'dd/MM/yyyy') },
            { label: 'Fornecedor', value: viewItem.supplier },
            { label: 'Categoria', value: viewItem.category },
            { label: 'Empresa', value: viewItem.company },
            { label: 'Centro de Custo', value: viewItem.cost_center },
            { label: 'Cartão', value: viewItem.card_name },
          ]}
          receiptUrl={viewItem.receipt_url}
          notes={viewItem.notes}
        />
      )}
    </div>
  );
}
