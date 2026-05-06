import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, CreditCard, QrCode, Landmark, FileBarChart, ExternalLink, Download, Split } from 'lucide-react';
import { expandAllocations, type Allocation } from '@/lib/allocation-utils';
import { cn } from '@/lib/utils';

interface DetailField {
  label: string;
  value: string | null | undefined;
}

interface FinancialDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  status: string;
  statusColor: string;
  amount: number;
  paymentLabel?: string;
  fields: DetailField[];
  receiptUrl?: string | null;
  boletoUrl?: string | null;
  notes?: string | null;
  installmentInfo?: string | null;
  /** Primary category — used to compute allocation breakdown when allocations exist. */
  primaryCategory?: string;
  /** Secondary allocations (rateio). When present, breakdown is shown. */
  allocations?: Allocation[] | null | unknown;
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  pago: 'Pago',
  rejeitado: 'Rejeitado',
};

const statusStyles: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  aprovado: 'bg-green-100 text-green-800 border-green-200',
  pago: 'bg-blue-100 text-blue-800 border-blue-200',
  rejeitado: 'bg-red-100 text-red-800 border-red-200',
};

const paymentIcons: Record<string, typeof CreditCard> = {
  boleto: FileBarChart,
  pix: QrCode,
  transferencia: Landmark,
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function isPdf(url: string) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return url.toLowerCase().includes('.pdf');
  }
}

function isImage(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/.test(pathname);
  } catch {
    return false;
  }
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function FinancialDetailDialog({
  open, onOpenChange, title, status, amount, paymentLabel,
  fields, receiptUrl, boletoUrl, notes, installmentInfo,
  primaryCategory, allocations,
}: FinancialDetailDialogProps) {
  const PaymentIcon = paymentLabel ? (paymentIcons[paymentLabel.toLowerCase()] || CreditCard) : CreditCard;
  const isCard = paymentLabel?.toLowerCase().startsWith('cartão');

  // Compute rateio breakdown
  const slices = primaryCategory
    ? expandAllocations({ amount, category: primaryCategory, allocations })
    : [];
  const isRateado = slices.length > 1;

  const attachments: Array<{ url: string; label: string }> = [];
  if (boletoUrl) attachments.push({ url: boletoUrl, label: 'Boleto' });
  if (receiptUrl && receiptUrl !== boletoUrl) attachments.push({ url: receiptUrl, label: 'Comprovante / NF' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground leading-tight pr-8">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">Detalhes do registro financeiro</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className={statusStyles[status] || ''}>
              {statusLabels[status] || status}
            </Badge>
            {paymentLabel && (
              <Badge className="gap-1.5 bg-primary text-primary-foreground">
                {isCard ? <CreditCard className="h-3 w-3" /> : <PaymentIcon className="h-3 w-3" />}
                {paymentLabel}
              </Badge>
            )}
            {installmentInfo && (
              <Badge variant="outline" className="border-primary/30 text-primary">
                {installmentInfo}
              </Badge>
            )}
            {isRateado && (
              <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5">
                <Split className="h-3 w-3" />
                Rateado em {slices.length} categorias
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Body */}
        <div className="p-6 grid gap-6 sm:grid-cols-[1fr_auto]">
          {/* Left: Details */}
          <div className="space-y-5">
            {/* Amount */}
            <div className="rounded-lg border bg-muted/30 px-5 py-4">
              <p className="text-2xl font-bold tabular-nums text-foreground">{fmt(amount)}</p>
              {isRateado && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Valor distribuído entre {slices.length} categorias contábeis
                </p>
              )}
            </div>

            {/* Allocation breakdown */}
            {isRateado && (
              <div className="rounded-lg border bg-background overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
                  <Split className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Detalhamento do rateio</span>
                </div>
                <div className="divide-y">
                  {slices.map((s, i) => {
                    const pct = amount > 0 ? (s.amount / amount) * 100 : 0;
                    return (
                      <div key={`${s.category}-${i}`} className="px-4 py-2.5">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">{s.category}</span>
                            {s.isPrimary && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/40 text-primary">PRINCIPAL</Badge>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-semibold tabular-nums text-foreground">{fmt(s.amount)}</span>
                            <span className="text-[10px] text-muted-foreground ml-1.5 tabular-nums">({pct.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full', s.isPrimary ? 'bg-primary' : 'bg-amber-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {fields.filter(f => f.value).map(f => (
                <div key={f.label}>
                  <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                  <p className="text-sm font-medium text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Receipt preview */}
          {receiptUrl && (
            <div className="w-[220px] shrink-0">
              <div className="rounded-lg border overflow-hidden h-full flex flex-col">
             {receiptIsImage ? (
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={receiptUrl}
                      alt="Comprovante"
                      className="w-full object-contain cursor-pointer"
                    />
                  </a>
                ) : (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[200px] flex flex-col items-center justify-center gap-3 bg-muted/20 p-4 cursor-pointer hover:bg-muted/40 transition-colors no-underline"
                  >
                    <div className="rounded-full bg-primary/10 p-4">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {receiptIsPdf ? 'Documento PDF' : 'Comprovante'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Clique para visualizar</p>
                    </div>
                  </a>
                )}
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full rounded-none border-t text-xs h-9 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors no-underline"
                >
                  Abrir em nova aba <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <>
            <Separator />
            <div className="p-6 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Observações</span>
              </div>
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
          </>
        )}

        {/* No receipt warning */}
        {!receiptUrl && (
          <>
            <Separator />
            <div className="px-6 py-3 bg-yellow-500/5 border-t border-yellow-500/10">
              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">⚠ Pendente de NF / Comprovante</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
