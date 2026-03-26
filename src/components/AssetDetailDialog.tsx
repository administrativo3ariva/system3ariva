import { Eye, ImageIcon, Tag, MapPin, Calendar, Hash, Package, DollarSign } from 'lucide-react';
import { DbAsset } from '@/hooks/use-assets';
import { BranchBadge } from '@/components/BranchBadge';
import { Branch } from '@/lib/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface AssetDetailDialogProps {
  asset: DbAsset;
  trigger?: React.ReactNode;
}

export function AssetDetailDialog({ asset, trigger }: AssetDetailDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
          <Eye className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogTitle className="sr-only">Detalhes do patrimônio: {asset.name}</DialogTitle>
          
          {/* Image */}
          <div className="aspect-[4/3] bg-muted relative">
            {asset.image_url ? (
              <img
                src={asset.image_url}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <span className="text-xs font-mono bg-primary text-primary-foreground px-2 py-1 rounded-md shadow">
                {asset.code}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{asset.name}</h2>
              {asset.description && (
                <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <DetailRow icon={Tag} label="Categoria" value={asset.category} />
              <DetailRow icon={MapPin} label="Filial" value={
                <BranchBadge branch={asset.branch as Branch} floor={asset.floor} />
              } />
              <DetailRow icon={Package} label="Quantidade" value={String(asset.quantity)} />
              <DetailRow icon={DollarSign} label="Valor Unit." value={`R$ ${Number(asset.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <DetailRow icon={DollarSign} label="Valor Total" value={
                <span className="font-semibold text-foreground">R$ {Number(asset.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              } />
              <DetailRow icon={Calendar} label="Aquisição" value={asset.acquisition_date ? new Date(asset.acquisition_date).toLocaleDateString('pt-BR') : '—'} />
              <DetailRow icon={Tag} label="Condição" value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  asset.condition === 'Novo' ? 'bg-green-500/10 text-green-600' :
                  asset.condition === 'Bom' ? 'bg-blue-500/10 text-blue-600' :
                  asset.condition === 'Regular' ? 'bg-yellow-500/10 text-yellow-600' :
                  asset.condition === 'Ruim' ? 'bg-orange-500/10 text-orange-600' :
                  asset.condition === 'Inservível' ? 'bg-red-500/10 text-red-600' :
                  'bg-muted text-muted-foreground'
                }`}>{asset.condition || 'Bom'}</span>
              } />
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${asset.inventoried ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${asset.inventoried ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                {asset.inventoried ? 'Conferido' : 'Pendente'}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
