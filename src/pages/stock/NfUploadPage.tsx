import { useState, useRef, useEffect } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Upload, FileText, Check, X, Eye, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { useNfUploads, useUploadAndProcessNf, useUpdateNfUpload, useDeleteNfUpload, useApproveNf } from '@/hooks/use-nf-uploads';
import type { DbNfUpload, DbNfItem } from '@/hooks/use-nf-uploads';
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

export default function NfUploadPage() {
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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCategories = [...PRODUCT_CATEGORIES, ...customCategories.filter(c => !PRODUCT_CATEGORIES.includes(c))];

  useEffect(() => {
    if (previewNf) {
      setEditedItems(
        (previewNf.nf_items || []).map(item => ({ ...item, category: item.category || '' }))
      );
    }
  }, [previewNf]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        uploadNf.mutate({ file, unit: selectedBranch });
      } else {
        import('sonner').then(({ toast }) => toast.error(`Formato não suportado: ${file.name}`));
      }
    });
  };

  const handleApprove = (nf: DbNfUpload) => {
    approveNf.mutate({ ...nf, nf_items: editedItems });
    setPreviewNf(null);
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
              <TableHead>Arquivo</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Produtos</TableHead>
              <TableHead className="text-right">Frete</TableHead>
              <TableHead className="text-right">Outras Desp.</TableHead>
              <TableHead className="text-right">Descontos</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nfUploads.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhuma NF enviada para {selectedBranch}
                </TableCell>
              </TableRow>
            )}
            {nfUploads.map(nf => (
              <TableRow key={nf.id} className="table-row-hover">
                <TableCell className="font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {nf.file_name}
                  {nf.file_url && (
                    <a href={nf.file_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-sm">{nf.supplier || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(nf.upload_date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right text-sm">
                  {(() => {
                    const itemsTotal = (nf.nf_items || []).reduce((s, i) => s + Number(i.total_price), 0);
                    return itemsTotal ? `R$ ${itemsTotal.toFixed(2)}` : '—';
                  })()}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {nf.freight_value ? `R$ ${Number(nf.freight_value).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {nf.other_expenses ? `R$ ${Number(nf.other_expenses).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {nf.discount_value ? `R$ ${Number(nf.discount_value).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {nf.total_value ? `R$ ${Number(nf.total_value).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell>{statusBadge(nf.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
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
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Fornecedor</Label>
                  <Input defaultValue={previewNf.supplier || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Data</Label>
                  <Input defaultValue={previewNf.upload_date} className="mt-1" readOnly />
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
                  <div className={`p-3 rounded-md border text-sm ${diff > 0.05 ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-success/10 border-success/30 text-success'}`}>
                    <div className="flex justify-between">
                      <span>Produtos: R$ {itemsTotal.toFixed(2)}</span>
                      <span>Frete: R$ {freight.toFixed(2)}</span>
                      <span>Outras: R$ {otherExp.toFixed(2)}</span>
                      <span>Descontos: -R$ {discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-1">
                      <span>Calculado: R$ {calculatedTotal.toFixed(2)}</span>
                      <span>NF: R$ {nfTotal.toFixed(2)}</span>
                      {diff > 0.05 && <span>Diferença: R$ {diff.toFixed(2)}</span>}
                    </div>
                  </div>
                );
              })()}

              <div>
                <Label className="text-muted-foreground text-xs mb-2 block flex items-center gap-1">
                  <Pencil className="h-3 w-3" /> Itens Extraídos via IA <span className="text-muted-foreground/60">(editável)</span>
                </Label>
                <Table>
                  <TableHeader>
                     <TableRow>
                      <TableHead className="min-w-[250px]">Item</TableHead>
                      <TableHead className="min-w-[130px]">Categoria</TableHead>
                      <TableHead className="min-w-[70px]">Und.</TableHead>
                      <TableHead className="text-right min-w-[80px]">Qtd</TableHead>
                      <TableHead className="text-right min-w-[100px]">Valor Unit.</TableHead>
                      <TableHead className="text-right min-w-[80px]">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum item extraído
                        </TableCell>
                      </TableRow>
                    )}
                    {editedItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
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
                        <TableCell>
                          {addingCategoryForIndex === i ? (
                            <div className="flex gap-1">
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
                              <SelectTrigger className="h-8 text-sm w-32">
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
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
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
                            className="h-8 text-sm text-right w-20 ml-auto"
                          />
                        </TableCell>
                        <TableCell>
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
                            className="h-8 text-sm text-right w-24 ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          R$ {Number(item.total_price).toFixed(2)}
                        </TableCell>
                        <TableCell>
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
              </div>

              {previewNf.status === 'pendente' && (
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => handleReject(previewNf.id)} className="text-destructive">
                    <X className="h-4 w-4 mr-2" /> Rejeitar
                  </Button>
                  <Button onClick={() => handleApprove(previewNf)} className="bg-success text-success-foreground hover:bg-success/90">
                    <Check className="h-4 w-4 mr-2" /> Aprovar Entrada
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}