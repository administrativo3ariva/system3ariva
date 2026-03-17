import { useState, useRef } from 'react';
import { Upload, FileText, Check, X, Eye, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { useNfUploads, useUploadAndProcessNf, useUpdateNfUpload, useDeleteNfUpload, useApproveNf } from '@/hooks/use-nf-uploads';
import type { DbNfUpload } from '@/hooks/use-nf-uploads';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { BranchBadge } from '@/components/BranchBadge';

export default function NfUploadPage() {
  const { selectedBranch } = useApp();
  const { data: nfUploads = [], isLoading } = useNfUploads();
  const uploadNf = useUploadAndProcessNf();
  const updateNfUpload = useUpdateNfUpload();
  const deleteNfUpload = useDeleteNfUpload();
  const approveNf = useApproveNf();
  const [previewNf, setPreviewNf] = useState<DbNfUpload | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    approveNf.mutate(nf);
    setPreviewNf(null);
  };

  const handleReject = (id: string) => {
    updateNfUpload.mutate({ id, status: 'rejeitado' });
    setPreviewNf(null);
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
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nfUploads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
        <DialogContent className="max-w-2xl">
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

              <div className="grid grid-cols-3 gap-4">
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
              </div>

              <div>
                <Label className="text-muted-foreground text-xs mb-2 block">Itens Extraídos via IA</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(previewNf.nf_items || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum item extraído
                        </TableCell>
                      </TableRow>
                    )}
                    {(previewNf.nf_items || []).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{item.name}</TableCell>
                        <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm">R$ {Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium text-sm">R$ {Number(item.total_price).toFixed(2)}</TableCell>
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
