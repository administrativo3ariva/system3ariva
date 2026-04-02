import { BH_MATRIZ_FLOORS, BhMatrizFloor } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface FloorPickerProps {
  value: string;
  onChange: (floor: string) => void;
  label?: string;
  sala?: string;
  onSalaChange?: (sala: string) => void;
}

const floorMeta: Record<string, { short: string; color: string }> = {
  '3º andar': { short: '3º', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25' },
  '8º andar': { short: '8º', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' },
  '9º andar': { short: '9º', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' },
  '10º andar': { short: '10º', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25' },
  'Algar': { short: '5º', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25' },
};

const SALAS_8 = ['801', '803'] as const;

export function FloorPicker({ value, onChange, label = 'Andar', sala, onSalaChange }: FloorPickerProps) {
  return (
    <div className="grid gap-2">
      <Label className="flex items-center gap-1.5">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      <div className="flex gap-2">
        {BH_MATRIZ_FLOORS.map(floor => {
          const meta = floorMeta[floor];
          const selected = value === floor;
          return (
            <button
              key={floor}
              type="button"
              onClick={() => onChange(floor)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-150',
                selected
                  ? `${meta.color} ring-1 ring-current shadow-sm`
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20'
              )}
            >
              <span className="text-lg font-bold leading-none">{meta.short}</span>
              <span className="text-[10px] opacity-70">{floor === 'Algar' ? 'Algar' : 'andar'}</span>
            </button>
          );
        })}
      </div>

      {/* Sala picker for 8º andar */}
      {value === '8º andar' && onSalaChange && (
        <div className="grid gap-1.5 mt-1">
          <Label className="text-xs text-muted-foreground">Sala</Label>
          <div className="flex gap-2">
            {SALAS_8.map(s => {
              const selected = sala === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSalaChange(s)}
                  className={cn(
                    'flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150',
                    selected
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-1 ring-current shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20'
                  )}
                >
                  Sala {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
