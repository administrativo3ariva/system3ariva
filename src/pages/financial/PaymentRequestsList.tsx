import { useState } from 'react';
import { usePaymentRequests, useDeletePaymentRequest, useUpdatePaymentRequest } from '@/hooks/use-payment-requests';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES } from '@/lib/types';
import { FinancialDetailDialog } from '@/components/FinancialDetailDialog';
import { FinancialFilters, useDateRangeFilter, filterByDateRange, type FilterConfig } from '@/components/FinancialFilters';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Eye, Pencil, FileBarChart, QrCode, Landmark, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const paymentMethodLabels: Record<string, { label: string; icon: typeof FileBarChart }> = {
  boleto: { label: 'Boleto', icon: FileBarChart },
  pix: { label: 'PIX', icon: QrCode },
  transferencia: { label: 'Transferência', icon: Landmark },
};

/** Derive display status based on DB status + receipt_url */
function getDisplayStatus(r: any): string {
  if (r.status === 'pago') return 'Pago';
  if (!r.receipt_url) return 'Pendente NF';
  return 'Pendente Pagamento';
}

const STATUS_OPTIONS = ['Pago', 'Pendente Pagamento', 'Pendente NF'] as const;

const FILTERS: FilterConfig[] = [
  { key: 'cost_center', label: 'Centro de Custo', allLabel: 'Todos Centros', options: FINANCIAL_COST_CENTERS },
  { key: 'company', label: 'Empresa', allLabel: 'Todas Empresas', options: FINANCIAL_COMPANIES },
  { key: 'display_status', label: 'Status', allLabel: 'Todos Status', options: STATUS_OPTIONS as unknown as string[] },
];

function groupByDate(items: any[], dateField: string) {
  const groups: Record<string, any[]> = {};
  items.forEach(item => {
    const date = item[dateField] || item.created_at?.split('T')[0] || 'sem-data';
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function PaymentRequestsList() {
  const { data: requests = [], isLoading } = usePaymentRequests();
  const deleteReq = useDeletePaymentRequest();
  const updateReq = useUpdatePaymentRequest();
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const { dateFrom, dateTo, isDefaultRange, handleDateFromChange, handleDateToChange, clearDates } = useDateRangeFilter();
  const [viewItem, setViewItem] = useState<any | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  // Enrich with display_status, then filter
  const enriched = requests.map((r: any) => ({ ...r, display_status: getDisplayStatus(r) }));

  const filtered = enriched.filter((r: any) => {
    // Apply select filters
    for (const [k, v] of Object.entries(filterValues)) {
      if (v && v !== 'all' && r[k] !== v) return false;
    }
    // Apply date range: use due_date, fallback to created_at
    const dateStr = r.due_date || r.created_at?.split('T')[0];
    if (!dateStr) return true;
    const d = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const fromStr = format(dateFrom, 'yyyy-MM-dd');
    const toStr = format(dateTo, 'yyyy-MM-dd');
    return d >= fromStr && d <= toStr;
  });

  const grouped = groupByDate(filtered, 'due_date');
  const total = filtered.reduce((s: number, r: any) => s + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitações de Pagamento</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} registro(s) • Total: {fmt(total)}</p>
        </div>
        <Link to="/financial/requests/new"><Button><Plus className="mr-2 h-4 w-4" />Nova Solicitação</Button></Link>
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
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma solicitação encontrada</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => {
            const dayTotal = items.reduce((s: number, r: any) => s + Number(r.amount), 0);
            const dateLabel = date === 'sem-data'
              ? 'Sem data de vencimento'
              : format(parseISO(date), "dd 'de' MMMM, yyyy", { locale: ptBR });
            return (
              <Card key={date}>
                <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{dateLabel}</span>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{fmt(dayTotal)}</span>
                </div>
                <div className="divide-y">
                  {items.map((r: any) => {
                    const pm = paymentMethodLabels[r.payment_method] || null;
                    return (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors group">
                        <div className={cn('w-2 h-2 rounded-full shrink-0', r.status === 'pago' ? 'bg-blue-500' : r.status === 'aprovado' ? 'bg-green-500' : r.status === 'rejeitado' ? 'bg-red-500' : 'bg-yellow-500')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.description}</p>
                          {r.supplier && <span className="text-[10px] text-muted-foreground">{r.supplier}</span>}
                          {!r.receipt_url && (
                            <span className="text-[10px] text-yellow-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3" /> Pendente de NF
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-center hidden lg:block">{r.company}</span>
                        <span className="text-xs text-muted-foreground w-12 text-center hidden md:block">{r.cost_center}</span>
                        <span className="text-xs text-muted-foreground min-w-[140px] text-center hidden xl:block">{r.category}</span>
                        <div className="w-32 hidden lg:flex items-center justify-center">
                          {pm ? (
                            <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                              <pm.icon className="h-3 w-3" />
                              {pm.label}
                            </Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-foreground w-28 text-right">{fmt(Number(r.amount))}</span>
                        <div className="flex items-center gap-2 w-20 justify-center">
                          <button
                            onClick={() => updateReq.mutate({ id: r.id, status: r.status === 'pago' ? 'pendente' : 'pago' })}
                            className={cn(
                              'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-colors border',
                              r.status === 'pago' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                            )}
                          >
                            <div className={cn('w-2 h-2 rounded-full transition-colors', r.status === 'pago' ? 'bg-green-500' : 'bg-muted-foreground/40')} />
                            {r.status === 'pago' ? 'Pago' : 'Pagar'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(r)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Link to={`/financial/requests/new?edit=${r.id}`}><Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button></Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteReq.mutate(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
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
          paymentLabel={viewItem.payment_method ? paymentMethodLabels[viewItem.payment_method]?.label || viewItem.payment_method : undefined}
          fields={[
            { label: 'Fornecedor', value: viewItem.supplier },
            { label: 'Categoria', value: viewItem.category },
            { label: 'Empresa', value: viewItem.company },
            { label: 'Centro de Custo', value: viewItem.cost_center },
            { label: 'Vencimento', value: viewItem.due_date ? format(parseISO(viewItem.due_date), 'dd/MM/yyyy') : null },
            { label: 'Data Pagamento', value: viewItem.payment_date ? format(parseISO(viewItem.payment_date), 'dd/MM/yyyy') : null },
            { label: 'Chave PIX', value: viewItem.pix_key },
            { label: 'Banco', value: viewItem.bank_name },
            { label: 'Agência', value: viewItem.bank_agency },
            { label: 'Conta', value: viewItem.bank_account },
          ]}
          receiptUrl={viewItem.receipt_url || viewItem.boleto_url}
          notes={viewItem.notes}
        />
      )}
    </div>
  );
}
