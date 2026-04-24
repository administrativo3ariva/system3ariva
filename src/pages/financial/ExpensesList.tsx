import { useState } from 'react';
import { useExpenses, useDeleteExpense, useUpdateExpense } from '@/hooks/use-expenses';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { FinancialDetailDialog } from '@/components/FinancialDetailDialog';
import { FinancialFilters, useDateRangeFilter, filterByDateRange, type FilterConfig } from '@/components/FinancialFilters';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Eye, Pencil, AlertTriangle, CreditCard, Split } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { isAllocated, readAllocations } from '@/lib/allocation-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const FILTERS: FilterConfig[] = [
  { key: 'cost_center', label: 'Centro de Custo', allLabel: 'Todos Centros', options: FINANCIAL_COST_CENTERS },
  { key: 'company', label: 'Empresa', allLabel: 'Todas Empresas', options: FINANCIAL_COMPANIES },
  { key: 'category', label: 'Categoria', allLabel: 'Todas Categorias', options: EXPENSE_CATEGORIES },
];

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
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { dateFrom, dateTo, isDefaultRange, handleDateFromChange, handleDateToChange, clearDates } = useDateRangeFilter();
  const [viewItem, setViewItem] = useState<any | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const filtered = filterByDateRange(
    expenses.filter((e: any) =>
      Object.entries(filterValues).every(([k, v]) => !v || v === 'all' || (e as any)[k] === v)
    ),
    'expense_date' as any,
    dateFrom,
    dateTo
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

      <FinancialFilters
        filters={FILTERS}
        values={filterValues}
        onValueChange={handleFilterChange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onClearDates={clearDates}
        isDefaultRange={isDefaultRange}
      />

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
                <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {format(parseISO(date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{fmt(dayTotal)}</span>
                </div>
                <div className="divide-y">
                  {items.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors group">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', e.status === 'aprovado' ? 'bg-green-500' : e.status === 'rejeitado' ? 'bg-red-500' : 'bg-yellow-500')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{e.description}</p>
                        {e.supplier && <span className="text-[10px] text-muted-foreground">{e.supplier}</span>}
                        {!e.receipt_url && (
                          <span className="text-[10px] text-yellow-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3" /> Pendente de NF
                          </span>
                        )}
                        {e.is_installment && e.installment_count && (
                          <span className="text-[10px] text-primary mt-0.5 block">Parcela {e.installment_current || 1}/{e.installment_count}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-center hidden lg:block truncate">{e.company}</span>
                      <span className="text-xs text-muted-foreground w-14 text-center hidden md:block">{e.cost_center}</span>
                      <div className="w-[180px] text-center hidden xl:flex items-center justify-center gap-1.5">
                        <span className="text-xs text-muted-foreground truncate">{e.category}</span>
                        {isAllocated(e) && (
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 gap-0.5 shrink-0">
                                  <Split className="h-2.5 w-2.5" />Rateado
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                <p className="font-semibold mb-1">Rateio entre categorias</p>
                                <ul className="space-y-0.5">
                                  <li>• {e.category} (principal): {fmt(Number(e.amount) - readAllocations(e.allocations).reduce((s, a) => s + a.amount, 0))}</li>
                                  {readAllocations(e.allocations).map((a, i) => (
                                    <li key={i}>• {a.category}: {fmt(a.amount)}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="w-36 hidden lg:flex items-center justify-center">
                        {e.card_name ? (
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                            <CreditCard className="h-3 w-3" />
                            {e.card_name.replace('Cartão Final ', '')}
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground w-28 text-right">{fmt(Number(e.amount))}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(e)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Link to={`/financial/expenses/new?edit=${e.id}`}><Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button></Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
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
          primaryCategory={viewItem.category}
          allocations={viewItem.allocations}
        />
      )}
    </div>
  );
}
