import { useState } from 'react';
import { Upload, FileText, Check, X, Eye } from 'lucide-react';
import { useNfUploads, useAddNfUpload, useUpdateNfUpload } from '@/hooks/use-nf-uploads';
import type { DbNfUpload } from '@/hooks/use-nf-uploads';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function NfUploadPage() {
  const { data: nfUploads = [], isLoading } = useNfUploads();
  const addNfUpload = useAddNfUpload();
  const updateNfUpload = useUpdateNfUpload();
  const [previewNf, setPreviewNf] = useState<DbNfUpload | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = () => {
    addNfUpload.mutate({
      file_name: `NF-${Math.floor(Math.random() * 9000 + 1000)}.pdf`,
      upload_date: new Date().toISOString().split('T')[0],
      status: 'pendente',
      supplier: 'Fornecedor Simulado',
      total_value: 523.40,
      items: [
        { name: 'Produto extraído via OCR', quantity: 10, unit_price: 52.34, total_price: 523.40 },
      ],
    });
  };

  const handleApprove = (id: string) => {
    updateNfUpload.mutate({ id, status: 'aprovado' });
    setPreviewNf(null);
  };

  const handleReject = (id: string) => {
    updateNfUpload.mutate({ id, status: 'rejeitado' });
    setPreviewNf(null);
  };

  const statusBadge = (s: string) => {
    if (s === 'aprovado') return <Badge className="bg-success/10 text-success border-success/20">Aprovado</Badge>;
    if (s === 'rejeitado') return <Badge variant="destructive">Rejeitado</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  if (isLoading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-xl">Upload de Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">Faça upload de NFs para extração automática via OCR</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(); }}
        onClick={handleUpload}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Arraste uma NF aqui ou clique para simular upload</p>
        <p className="text-xs text-muted-foreground mt-1">PDF ou imagem — extração automática via OCR</p>
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
            {nfUploads.map(nf => (
              <TableRow key={nf.id} className="table-row-hover">
                <TableCell className="font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {nf.file_name}
                </TableCell>
                <TableCell className="text-sm">{nf.supplier || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(nf.upload_date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right font-medium">
                  {nf.total_value ? `R$ ${Number(nf.total_value).toFixed(2)}` : '—'}
                </TableCell>
                <TableCell>{statusBadge(nf.status)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewNf(nf)}>
                    <Eye className="h-4 w-4" />
                  </Button>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Fornecedor</Label>
                  <Input defaultValue={previewNf.supplier || ''} className="mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Data</Label>
                  <Input defaultValue={previewNf.upload_date} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs mb-2 block">Itens Extraídos</Label>
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
                    {(previewNf.nf_items || []).map((item, i) => (
                      <TableRow key={i}>
                        <TableCell><Input defaultValue={item.name} className="h-8" /></TableCell>
                        <TableCell className="text-right"><Input defaultValue={item.quantity} className="h-8 w-16 ml-auto text-right" /></TableCell>
                        <TableCell className="text-right"><Input defaultValue={Number(item.unit_price).toFixed(2)} className="h-8 w-24 ml-auto text-right" /></TableCell>
                        <TableCell className="text-right font-medium">R$ {Number(item.total_price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => handleReject(previewNf.id)} className="text-destructive">
                  <X className="h-4 w-4 mr-2" /> Rejeitar
                </Button>
                <Button onClick={() => handleApprove(previewNf.id)} className="bg-success text-success-foreground hover:bg-success/90">
                  <Check className="h-4 w-4 mr-2" /> Aprovar Entrada
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
