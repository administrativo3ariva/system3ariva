import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pencil, Plus, CreditCard, Landmark } from 'lucide-react';
import { Upload, FileText, Check, X, Eye, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { useNfUploads, useUploadAndProcessNf, useUpdateNfUpload, useDeleteNfUpload, useApproveNf } from '@/hooks/use-nf-uploads';
import type { DbNfUpload, DbNfItem } from '@/hooks/use-nf-uploads';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { BranchBadge } from '@/components/BranchBadge';
import { PRODUCT_CATEGORIES } from '@/lib/mock-data';
import { formatCityName } from '@/lib/city-format';
import { branchToCostCenter, branchToCity, isCityMatchingBranch, detectCompanyFromText } from '@/lib/nf-mapping';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type FinancialLinkChoice = 'expense' | 'payment';

export default function NfUploadPage() {
  const navigate = useNavigate();
  const { selectedBranch } = useApp();
  const { data: nfUploads = [], isLoading } = useNfUploads();
  const uploadNf = useUploadAndProcessNf();
  const updateNfUpload = useUpdateNfUpload();
  const deleteNfUpload = useDeleteNfUpload();
  const approveNf = useApproveNf();
  const [previewNf, setPreviewNf] = useState<DbNfUpload | null>(null);
  const [editedItems, setEditedItems] = useState<DbNfItem[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [addingCategoryForIndex, setAddingCategoryForIndex] = useState<number | null>(null);
  const [financialLink, setFinancialLink] = useState<FinancialLinkChoice | ''>('');
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dragOver, setDragOver] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<DbNfUpload | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeName, setMergeName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelected = (i: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleMergeSelected = () => {
    const indices = Array.from(selectedIndices).sort((a, b) => a - b);
    if (indices.length < 2) {
      toast.error('Selecione pelo menos 2 itens para mesclar.');
      return;
    }
    const name = mergeName.trim();
    if (!name) {
      toast.error('Informe um nome para o conjunto.');
      return;
    }
    const selectedItems = indices.map(i => editedItems[i]);
    const totalQty = selectedItems.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const totalPrice = selectedItems.reduce((s, it) => s + Number(it.total_price || 0), 0);
    const unitPrice = totalQty > 0 ? totalPrice / totalQty : 0;
    const first = selectedItems[0];
    const merged: DbNfItem = {
      ...first,
      name,
      quantity: +totalQty.toFixed(3),
      unit_price: +unitPrice.toFixed(4),
      total_price: +totalPrice.toFixed(2),
    };
    const remaining = editedItems.filter((_, i) => !selectedIndices.has(i));
    const insertAt = indices[0];
    const next = [...remaining.slice(0, insertAt), merged, ...remaining.slice(insertAt)];
    setEditedItems(next);
    setSelectedIndices(new Set());
    setMergeName('');
    setMergeOpen(false);
    toast.success(`${indices.length} itens mesclados em "${name}".`);
  };

  const allCategories = [...PRODUCT_CATEGORIES, ...customCategories.filter(c => !PRODUCT_CATEGORIES.includes(c))];

  useEffect(() => {
    if (previewNf) {
      setEditedItems(
        (previewNf.nf_items || []).map(item => ({ ...item, category: item.category || '' }))
      );
      setFinancialLink('');
      setSelectedIndices(new Set());
      setEntryDate(previewNf.issue_date || new Date().toISOString().split('T')[0]);
    }
  }, [previewNf]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        import('sonner').then(({ toast }) => toast.error(`Arquivo muito grande: ${file.name}. Máximo 50MB.`));
        return;
      }
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        uploadNf.mutate({ file, unit: selectedBranch });
      } else {
        import('sonner').then(({ toast }) => toast.error(`Formato não suportado: ${file.name}`));
      }
    });
  };

  // Aggregate items by category (skips items without category)
  const buildAllocationsFromItems = (items: DbNfItem[]) => {
    const map = new Map<string, number>();
    for (const it of items) {
      const cat = (it.category || '').trim();
      if (!cat) continue;
      map.set(cat, (map.get(cat) || 0) + Number(it.total_price || 0));
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount: +amount.toFixed(2) }))
      .sort((a, b) => b.amount - a.amount);
  };

  const handleApprove = (nf: DbNfUpload) => {
    if (!financialLink) {
      toast.error('Selecione o vínculo financeiro (Cartão Corporativo ou Solicitação de Pagamento).');
      return;
    }
    const uncategorized = editedItems.filter(i => !i.category);
    if (uncategorized.length > 0) {
      toast.error(`Classifique a categoria de todos os ${editedItems.length} itens antes de aprovar.`);
      return;
    }
    const allocations = buildAllocationsFromItems(editedItems);
    if (allocations.length === 0) {
      toast.error('Nenhuma categoria identificada para vincular ao financeiro.');
      return;
    }

    // City consistency alert: warn if NF recipient city differs from branch's city
    if (!isCityMatchingBranch(nf.recipient_city, nf.unit)) {
      setPendingApproval(nf);
      return;
    }

    executeApproval(nf);
  };

  const executeApproval = async (nf: DbNfUpload) => {
    const allocations = buildAllocationsFromItems(editedItems);

    // nf_items are fully replaced inside useApproveNf based on editedItems,
    // so merges/edits never leave orphan rows behind.

    approveNf.mutate(
      { nf: { ...nf, nf_items: editedItems }, entryDate },
      {
        onSuccess: () => {
          setPreviewNf(null);
          setPendingApproval(null);
          // Total used at financial form = total NF (or sum of items as fallback)
          const itemsTotal = editedItems.reduce((s, i) => s + Number(i.total_price || 0), 0);
          const total = Number(nf.total_value) || itemsTotal;
          const detectedCompany = detectCompanyFromText(nf.recipient_name, nf.recipient_doc);
          const costCenter = branchToCostCenter(nf.unit);
          const params = new URLSearchParams({
            from_nf: 'true',
            nf_id: nf.id,
            nf_name: nf.file_name,
            amount: String(total),
            allocations: JSON.stringify(allocations),
          });
          if (nf.supplier) params.set('supplier', nf.supplier);
          if (nf.file_url) params.set('receipt_url', nf.file_url);
          if (nf.issue_date) params.set('issue_date', nf.issue_date);
          if (costCenter) params.set('cost_center', costCenter);
          if (detectedCompany) params.set('company', detectedCompany);

          const target = financialLink === 'expense' ? '/financial/expenses/new' : '/financial/requests/new';
          toast.success('Estoque atualizado. Complete os dados do lançamento financeiro.');
          navigate(`${target}?${params.toString()}`);
        },
      }
    );
  };

  const handleReject = (id: string) => {
    updateNfUpload.mutate({ id, status: 'rejeitado' });
    setPreviewNf(null);
  };

  const handleDeleteItem = (index: number) => {
    setEditedItems(items => items.filter((_, i) => i !== index));
  };

  const handleAddCategory = (index: number) => {
    if (newCategoryInput.trim()) {
      const cat = newCategoryInput.trim();
      if (!customCategories.includes(cat) && !PRODUCT_CATEGORIES.includes(cat)) {
        setCustomCategories(prev => [...prev, cat]);
      }
      const updated = [...editedItems];
      updated[index] = { ...updated[index], category: cat };
      setEditedItems(updated);
      setNewCategoryInput('');
      setAddingCategoryForIndex(null);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'aprovado') return <Badge className="bg-success/10 text-success border-success/20">Aprovado</Badge>;
    if (s === 'vinculado') return <Badge className="bg-primary/10 text-primary border-primary/20">Vinculado</Badge>;
    if (s === 'rejeitado') return <Badge variant="destructive">Rejeitado</Badge>;
    if (s === 'processando') return <Badge variant="outline" className="text-accent border-accent/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processando</Badge>;
    if (s === 'erro_ocr') return <Badge variant="destructive">Erro OCR</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Upload de Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">
          Faça upload de NFs para <BranchBadge branch={selectedBranch} /> — extração automática via IA
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
        } ${uploadNf.isPending ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadNf.isPending ? (
          <>
            <Loader2 className="h-10 w-10 mx-auto text-accent mb-3 animate-spin" />
            <p className="text-sm font-medium">Enviando e processando NF...</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Arraste uma NF aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">PDF ou imagem — os itens serão adicionados ao estoque de <strong>{selectedBranch}</strong></p>
          </>
        )}
      </div>

      <div className="bg-card rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-center">Arquivo</TableHead>
              <TableHead className="whitespace-nowrap text-center">Fornecedor</TableHead>
              <TableHead className="whitespace-nowrap text-center">Data Emissão</TableHead>
              <TableHead className="whitespace-nowrap text-center">Produtos</TableHead>
              <TableHead className="whitespace-nowrap text-center">Frete</TableHead>
              <TableHead className="whitespace-nowrap text-center">Valor Total</TableHead>
              <TableHead className="whitespace-nowrap text-center">Status</TableHead>
              <TableHead className="whitespace-nowrap text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nfUploads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma NF enviada para {selectedBranch}
                </TableCell>
              </TableRow>
            )}
            {nfUploads.map(nf => (
              <TableRow key={nf.id} className="table-row-hover">
                <TableCell className="font-medium text-sm text-center">
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[220px]">{nf.file_name}</span>
                    {nf.file_url && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(nf.file_url!);
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = nf.file_name;
                            a.target = '_blank';
                            a.rel = 'noopener noreferrer';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          } catch {
                            window.open(nf.file_url!, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        title={`Abrir ${nf.file_name}`}
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-center">{nf.supplier || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap text-center">{nf.issue_date ? new Date(nf.issue_date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date(nf.upload_date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-sm whitespace-nowrap tabular-nums text-center">
                  {(() => {
                    const itemsTotal = (nf.nf_items || []).reduce((s, i) => s + Number(i.total_price), 0);
                    return itemsTotal ? `R$ ${itemsTotal.toFixed(2)}` : '—';
                  })()}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap tabular-nums text-center">
                  {nf.freight_value ? `R$ ${Number(nf.freight_value).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap tabular-nums text-center">
                  {nf.total_value ? `R$ ${Number(nf.total_value).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="text-center">{statusBadge(nf.status)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewNf(nf)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteNfUpload.mutate(nf.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!previewNf} onOpenChange={() => setPreviewNf(null)}>
        <DialogContent className="max-w-7xl w-[97vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Conferência — {previewNf?.file_name}</DialogTitle>
          </DialogHeader>
          {previewNf && (
            <div className="space-y-4">
              {previewNf.file_url && previewNf.file_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) && (
                <div className="border rounded-lg overflow-hidden max-h-48">
                  <img src={previewNf.file_url} alt="NF" className="w-full object-contain max-h-48" />
                </div>
              )}

              {/* Fornecedor & Tomador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fornecedor / Emitente</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nome / Razão Social</Label>
                      <Input
                        defaultValue={previewNf.supplier || ''}
                        onBlur={e => updateNfUpload.mutate({ id: previewNf.id, supplier: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">CNPJ</Label>
                      <Input
                        defaultValue={(previewNf as any).supplier_cnpj || ''}
                        placeholder="XX.XXX.XXX/XXXX-XX"
                        onBlur={e => updateNfUpload.mutate({ id: previewNf.id, supplier_cnpj: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tomador / Destinatário</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nome / Razão Social</Label>
                      <Input
                        defaultValue={(previewNf as any).recipient_name || ''}
                        onBlur={e => updateNfUpload.mutate({ id: previewNf.id, recipient_name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Tipo</Label>
                      <Select
                        defaultValue={(previewNf as any).recipient_doc_type || 'CNPJ'}
                        onValueChange={val => updateNfUpload.mutate({ id: previewNf.id, recipient_doc_type: val })}
                      >
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                          <SelectItem value="CPF">CPF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">{(previewNf as any).recipient_doc_type === 'CPF' ? 'CPF' : 'CNPJ'}</Label>
                      <Input
                        defaultValue={(previewNf as any).recipient_doc || ''}
                        placeholder={(previewNf as any).recipient_doc_type === 'CPF' ? 'XXX.XXX.XXX-XX' : 'XX.XXX.XXX/XXXX-XX'}
                        onBlur={e => updateNfUpload.mutate({ id: previewNf.id, recipient_doc: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Cidade de Entrega</Label>
                      <Input
                        key={`city-${previewNf.id}-${(previewNf as any).recipient_city || ''}`}
                        defaultValue={formatCityName((previewNf as any).recipient_city || '')}
                        placeholder="Ex.: Belo Horizonte"
                        onBlur={e => {
                          const formatted = formatCityName(e.target.value);
                          if (e.target.value !== formatted) e.target.value = formatted;
                          updateNfUpload.mutate({ id: previewNf.id, recipient_city: formatted });
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados fiscais */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Data Emissão</Label>
                  <Input
                    type="date"
                    defaultValue={previewNf.issue_date || previewNf.upload_date}
                    onChange={e => updateNfUpload.mutate({ id: previewNf.id, issue_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Filial destino</Label>
                  <div className="mt-1"><BranchBadge branch={previewNf.unit} /></div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Frete</Label>
                  <Input
                    type="number" step="0.01"
                    defaultValue={previewNf.freight_value ?? 0}
                    onChange={e => updateNfUpload.mutate({ id: previewNf.id, freight_value: Number(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Outras Despesas</Label>
                  <Input
                    type="number" step="0.01"
                    defaultValue={previewNf.other_expenses ?? 0}
                    onChange={e => updateNfUpload.mutate({ id: previewNf.id, other_expenses: Number(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Descontos</Label>
                  <Input
                    type="number" step="0.01"
                    defaultValue={previewNf.discount_value ?? 0}
                    onChange={e => updateNfUpload.mutate({ id: previewNf.id, discount_value: Number(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Totals reconciliation */}
              {(() => {
                const itemsTotal = editedItems.reduce((s, i) => s + Number(i.total_price), 0);
                const freight = Number(previewNf.freight_value) || 0;
                const otherExp = Number(previewNf.other_expenses) || 0;
                const discount = Number(previewNf.discount_value) || 0;
                const calculatedTotal = itemsTotal + freight + otherExp - discount;
                const nfTotal = Number(previewNf.total_value) || 0;
                const diff = Math.abs(calculatedTotal - nfTotal);
                return (
                  <div className={`p-4 rounded-lg border text-sm ${diff > 0.05 ? 'bg-warning/10 border-warning/30' : 'bg-success/10 border-success/30'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Produtos</span>
                        <span className="font-medium">R$ {itemsTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Frete</span>
                        <span className="font-medium">R$ {freight.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Outras Despesas</span>
                        <span className="font-medium">R$ {otherExp.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Descontos</span>
                        <span className="font-medium text-destructive">- R$ {discount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between pt-3 border-t ${diff > 0.05 ? 'border-warning/20' : 'border-success/20'}`}>
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">Total Calculado</span>
                          <span className="font-semibold text-base">R$ {calculatedTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">Total NF</span>
                          <span className="font-semibold text-base">R$ {nfTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      {diff > 0.05 && (
                        <div className="flex flex-col items-end">
                          <span className="text-muted-foreground text-xs">Diferença</span>
                          <span className="font-semibold text-base text-warning">R$ {diff.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Itens Extraídos via IA <span className="text-muted-foreground/60">(editável)</span>
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={selectedIndices.size < 2}
                    onClick={() => { setMergeName(''); setMergeOpen(true); }}
                  >
                    Mesclar selecionados ({selectedIndices.size})
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] text-center">
                        <input
                          type="checkbox"
                          checked={editedItems.length > 0 && selectedIndices.size === editedItems.length}
                          onChange={e => {
                            if (e.target.checked) setSelectedIndices(new Set(editedItems.map((_, i) => i)));
                            else setSelectedIndices(new Set());
                          }}
                        />
                      </TableHead>
                      <TableHead className="min-w-[220px] text-center">Item</TableHead>
                      <TableHead className="min-w-[150px] text-center">Categoria</TableHead>
                      <TableHead className="min-w-[70px] text-center">Und.</TableHead>
                      <TableHead className="min-w-[80px] text-center">Qtd</TableHead>
                      <TableHead className="min-w-[100px] text-center">Valor Unit.</TableHead>
                      <TableHead className="min-w-[90px] text-center">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhum item extraído
                        </TableCell>
                      </TableRow>
                    )}
                    {editedItems.map((item, i) => (
                      <TableRow key={i} className={selectedIndices.has(i) ? 'bg-muted/40' : ''}>
                        <TableCell className="align-middle text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.has(i)}
                            onChange={() => toggleSelected(i)}
                          />
                        </TableCell>
                        <TableCell className="align-middle">
                          <Input
                            value={item.name}
                            onChange={e => {
                              const updated = [...editedItems];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setEditedItems(updated);
                            }}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="align-middle">
                          {addingCategoryForIndex === i ? (
                            <div className="flex gap-1 justify-center">
                              <Input
                                value={newCategoryInput}
                                onChange={e => setNewCategoryInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCategory(i)}
                                placeholder="Nova categoria"
                                className="h-8 text-sm w-28"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleAddCategory(i)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setAddingCategoryForIndex(null); setNewCategoryInput(''); }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Select
                              value={item.category || ''}
                              onValueChange={v => {
                                if (v === '__new__') {
                                  setAddingCategoryForIndex(i);
                                  return;
                                }
                                const updated = [...editedItems];
                                updated[i] = { ...updated[i], category: v };
                                setEditedItems(updated);
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm w-full min-w-[140px]">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {allCategories.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                                <SelectItem value="__new__">
                                  <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Nova categoria</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex justify-center">
                            <Select
                              value={item.unit_of_measure || 'UN'}
                              onValueChange={v => {
                                const updated = [...editedItems];
                                updated[i] = { ...updated[i], unit_of_measure: v };
                                setEditedItems(updated);
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['UN', 'CX', 'KG', 'PCT', 'PC', 'FR', 'LT', 'ML', 'G'].map(u => (
                                  <SelectItem key={u} value={u}>{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <Input
                            type="number"
                            step={(item.unit_of_measure || 'UN') === 'KG' ? '0.001' : '1'}
                            value={item.quantity}
                            onChange={e => {
                              const updated = [...editedItems];
                              const qty = Number(e.target.value) || 0;
                              updated[i] = { ...updated[i], quantity: qty, total_price: qty * updated[i].unit_price };
                              setEditedItems(updated);
                            }}
                            className="h-8 text-sm text-center w-20 mx-auto"
                          />
                        </TableCell>
                        <TableCell className="align-middle">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={e => {
                              const updated = [...editedItems];
                              const price = Number(e.target.value) || 0;
                              updated[i] = { ...updated[i], unit_price: price, total_price: updated[i].quantity * price };
                              setEditedItems(updated);
                            }}
                            className="h-8 text-sm text-center w-24 mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center font-medium text-sm tabular-nums whitespace-nowrap align-middle">
                          R$ {Number(item.total_price).toFixed(2)}
                        </TableCell>
                        {/* per-item financial link removed — link is global at the bottom */}
                        <TableCell className="align-middle text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteItem(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2">
                  Classifique a categoria de cada item. Ao aprovar, os itens entram no estoque e o sistema abre o lançamento financeiro com os valores rateados por categoria.
                </p>
              </div>

              {/* Global financial link selector */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Vínculo Financeiro</p>
                  <p className="text-xs text-muted-foreground">
                    Como esta NF deve ser registrada na Gestão Financeira? Após aprovar a entrada de estoque,
                    o lançamento será aberto com o rateio por categoria já preenchido.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFinancialLink('expense')}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      financialLink === 'expense'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-muted hover:border-muted-foreground/40'
                    }`}
                  >
                    <CreditCard className={`h-5 w-5 shrink-0 ${financialLink === 'expense' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${financialLink === 'expense' ? 'text-primary' : 'text-foreground'}`}>
                        Despesa de Cartão Corporativo
                      </p>
                      <p className="text-xs text-muted-foreground truncate">Lançamento direto no cartão</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialLink('payment')}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      financialLink === 'payment'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-muted hover:border-muted-foreground/40'
                    }`}
                  >
                    <Landmark className={`h-5 w-5 shrink-0 ${financialLink === 'payment' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${financialLink === 'payment' ? 'text-primary' : 'text-foreground'}`}>
                        Solicitação de Pagamento
                      </p>
                      <p className="text-xs text-muted-foreground truncate">Boleto, PIX ou transferência</p>
                    </div>
                  </button>
                </div>
                {(() => {
                  const allocs = buildAllocationsFromItems(editedItems);
                  if (allocs.length === 0) return null;
                  return (
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Rateio que será enviado ao financeiro {allocs.length > 1 ? `(${allocs.length} categorias)` : '(1 categoria)'}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allocs.map((a) => (
                          <Badge key={a.category} variant="outline" className="gap-1.5">
                            <span>{a.category}</span>
                            <span className="tabular-nums text-muted-foreground">
                              R$ {a.amount.toFixed(2)}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {previewNf.status === 'pendente' && (
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => handleReject(previewNf.id)} className="text-destructive">
                    <X className="h-4 w-4 mr-2" /> Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleApprove(previewNf)}
                    disabled={!financialLink || approveNf.isPending}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {approveNf.isPending ? 'Processando...' : 'Aprovar Entrada'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mesclar itens selecionados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedIndices.size} itens serão combinados em um único item, somando quantidades e valores.
            </p>
            <div>
              <Label className="text-xs">Nome do conjunto</Label>
              <Input
                value={mergeName}
                onChange={e => setMergeName(e.target.value)}
                placeholder="Ex.: Material de limpeza geral"
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancelar</Button>
              <Button onClick={handleMergeSelected}>Mesclar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingApproval} onOpenChange={(open) => { if (!open) setPendingApproval(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-warning/15 text-warning">!</span>
              Cidade de entrega divergente
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  A NF tem como cidade de entrega
                  {' '}<strong>{formatCityName(pendingApproval?.recipient_city || '') || '—'}</strong>,
                  mas a filial selecionada é
                  {' '}<strong>{pendingApproval?.unit}</strong>
                  {' '}({branchToCity(pendingApproval?.unit) || 'cidade não mapeada'}).
                </p>
                <p>
                  Confirme que esta NF deve mesmo dar entrada no estoque de <strong>{pendingApproval?.unit}</strong>.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (pendingApproval) executeApproval(pendingApproval); }}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Confirmar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}