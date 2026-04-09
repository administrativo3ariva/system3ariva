import { useState } from 'react';
import { usePaymentRequests, useDeletePaymentRequest, useUpdatePaymentRequest } from '@/hooks/use-payment-requests';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES } from '@/lib/types';
import { FinancialDetailDialog } from '@/components/FinancialDetailDialog';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [filterCC, setFilterCC] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewItem, setViewItem] = useState<any | null>(null);

  const filtered = requests.filter((r: any) =>
    (filterCC === 'all' || r.cost_center === filterCC) &&
    (filterCompany === 'all' || r.company === filterCompany) &&
    (filterStatus === 'all' || r.status === filterStatus)
  );

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

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bank-statement style list */}
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
                {/* Day header */}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{dateLabel}</span>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{fmt(dayTotal)}</span>
                </div>

                {/* Items */}
                <div className="divide-y">
                  {items.map((r: any) => {
                    const pm = paymentMethodLabels[r.payment_method] || null;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors group"
                      >
                        {/* Status dot */}
                        <div className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          r.status === 'pago' ? 'bg-blue-500' :
                          r.status === 'aprovado' ? 'bg-green-500' :
                          r.status === 'rejeitado' ? 'bg-red-500' : 'bg-yellow-500'
                        )} />

                        {/* Description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.description}</p>
                          {r.supplier && (
                            <span className="text-[10px] text-muted-foreground">{r.supplier}</span>
                          )}
                          {!r.receipt_url && (
                            <span className="text-[10px] text-yellow-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3" /> Pendente de NF
                            </span>
                          )}
                        </div>

                        {/* Company */}
                        <span className="text-xs text-muted-foreground w-16 text-center hidden lg:block">{r.company}</span>

                        {/* Cost Center */}
                        <span className="text-xs text-muted-foreground w-12 text-center hidden md:block">{r.cost_center}</span>

                        {/* Category */}
                        <span className="text-xs text-muted-foreground min-w-[140px] text-center hidden xl:block">{r.category}</span>

                        {/* Payment method */}
                        <div className="w-32 hidden lg:flex items-center justify-center">
                          {pm ? (
                            <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                              <pm.icon className="h-3 w-3" />
                              {pm.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>

                        {/* Amount */}
                        <span className="text-sm font-semibold tabular-nums text-foreground w-28 text-right">
                          {fmt(Number(r.amount))}
                        </span>

                        {/* Paid toggle */}
                        <div className="flex items-center gap-2 w-20 justify-center">
                          <button
                            onClick={() => {
                              const newStatus = r.status === 'pago' ? 'pendente' : 'pago';
                              updateReq.mutate({ id: r.id, status: newStatus });
                            }}
                            className={cn(
                              'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-colors border',
                              r.status === 'pago'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                            )}
                          >
                            <div className={cn(
                              'w-2 h-2 rounded-full transition-colors',
                              r.status === 'pago' ? 'bg-green-500' : 'bg-muted-foreground/40'
                            )} />
                            {r.status === 'pago' ? 'Pago' : 'Pagar'}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(r)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Link to={`/financial/requests/new?edit=${r.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            if (confirm('Excluir esta solicitação?')) deleteReq.mutate(r.id);
                          }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
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

      {/* Detail Dialog */}
      {viewItem && (
        <FinancialDetailDialog
          open={!!viewItem}
          onOpenChange={(open) => { if (!open) setViewItem(null); }}
          title={viewItem.description}
          status={viewItem.status}
          statusColor=""
          amount={Number(viewItem.amount)}
          paymentLabel={
            viewItem.payment_method
              ? paymentMethodLabels[viewItem.payment_method]?.label || viewItem.payment_method
              : undefined
          }
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
