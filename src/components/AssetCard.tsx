import { ImageIcon, Calendar, Tag, MapPin, Hash } from 'lucide-react';
import { DbAsset } from '@/hooks/use-assets';
import { BranchBadge } from '@/components/BranchBadge';
import { Branch } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface AssetCardProps {
  asset: DbAsset;
  actions?: React.ReactNode;
}

export function AssetCard({ asset, actions }: AssetCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {asset.image_url ? (
          <img
            src={asset.image_url}
            alt={asset.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        {actions && (
          <div className="absolute top-2 right-2">{actions}</div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{asset.name}</h3>
          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
            {asset.code}
          </span>
        </div>

        {asset.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />{asset.category}
          </span>
          <BranchBadge branch={asset.branch as Branch} floor={asset.floor} />
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            asset.condition === 'Novo' ? 'bg-green-500/10 text-green-600' :
            asset.condition === 'Bom' ? 'bg-blue-500/10 text-blue-600' :
            asset.condition === 'Regular' ? 'bg-yellow-500/10 text-yellow-600' :
            asset.condition === 'Ruim' ? 'bg-orange-500/10 text-orange-600' :
            asset.condition === 'Inservível' ? 'bg-red-500/10 text-red-600' :
            'bg-muted text-muted-foreground'
          }`}>{asset.condition || 'Bom'}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Qtd: {asset.quantity}
          </span>
          <span className="font-semibold text-sm">
            R$ {Number(asset.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
