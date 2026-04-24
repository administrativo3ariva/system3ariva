import { useMemo } from 'react';
import { Plus, Trash2, Split, AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/CurrencyInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Allocation = { category: string; amount: number };

interface Props {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  totalAmount: number;
  primaryCategory: string;
  allocations: Allocation[];
  onChange: (next: Allocation[]) => void;
  categoryOptions: readonly string[];
}

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function AllocationSplitter({
  enabled,
  onToggle,
  totalAmount,
  primaryCategory,
  allocations,
  onChange,
  categoryOptions,
}: Props) {
  const sum = useMemo(
    () => allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0),
    [allocations]
  );
  const remaining = +(totalAmount - sum).toFixed(2);
  const overflow = remaining < -0.001;
  const balanced = Math.abs(remaining) < 0.01 && allocations.length > 0;

  const usedCategories = new Set(allocations.map((a) => a.category).filter(Boolean));
  const availableFor = (current: string) =>
    categoryOptions.filter((c) => c === current || !usedCategories.has(c));

  const addRow = () => {
    const firstFree =
      categoryOptions.find((c) => !usedCategories.has(c) && c !== primaryCategory) || '';
    onChange([...allocations, { category: firstFree, amount: Math.max(remaining, 0) }]);
  };

  const updateRow = (idx: number, patch: Partial<Allocation>) => {
    onChange(allocations.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const removeRow = (idx: number) => {
    onChange(allocations.filter((_, i) => i !== idx));
  };

  const distributeEvenly = () => {
    if (allocations.length === 0 || totalAmount <= 0) return;
    const each = +(totalAmount / allocations.length).toFixed(2);
    const next = allocations.map((a, i) => ({
      ...a,
      amount: i === allocations.length - 1
        ? +(totalAmount - each * (allocations.length - 1)).toFixed(2)
        : each,
    }));
    onChange(next);
  };

  const fillRemaining = (idx: number) => {
    const others = allocations.reduce(
      (s, a, i) => s + (i === idx ? 0 : Number(a.amount) || 0),
      0
    );
    const fill = +(totalAmount - others).toFixed(2);
    if (fill < 0) return;
    updateRow(idx, { amount: fill });
  };

  const primaryRemaining = +(totalAmount - sum).toFixed(2);
  const pctSum = totalAmount > 0 ? Math.min(100, (sum / totalAmount) * 100) : 0;

  return (
    <div className="rounded-lg border bg-muted/20">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
              enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Split className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Ratear esta NF entre categorias</p>
            <p className="text-xs text-muted-foreground">
              Divida o valor total em mais de uma categoria contábil
            </p>
          </div>
        </div>
        <div
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            enabled ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all',
              enabled ? 'left-[22px]' : 'left-0.5'
            )}
          />
        </div>
      </button>

      {enabled && (
        <div className="border-t p-4 space-y-4">
          {/* Primary category row */}
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Categoria principal</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {primaryCategory || <span className="text-muted-foreground italic">Selecione acima</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Restante alocado</p>
                <p
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    primaryRemaining < 0 ? 'text-destructive' : 'text-foreground'
                  )}
                >
                  {fmt(Math.max(primaryRemaining, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Allocation rows */}
          <div className="space-y-2">
            {allocations.map((a, idx) => (
              <div
                key={idx}
                className="flex items-end gap-2 rounded-md border bg-background p-3"
              >
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                  <Select
                    value={a.category}
                    onValueChange={(v) => updateRow(idx, { category: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFor(a.category)
                        .filter((c) => c !== primaryCategory)
                        .map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
                  <CurrencyInput
                    value={a.amount}
                    onChange={(v) => updateRow(idx, { amount: v })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  title="Preencher com restante"
                  onClick={() => fillRemaining(idx)}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeRow(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add / distribute */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={allocations.length >= categoryOptions.length - 1}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar categoria
            </Button>
            {allocations.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={distributeEvenly}>
                <Wand2 className="h-4 w-4 mr-1.5" />
                Distribuir igualmente
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full transition-all',
                  overflow ? 'bg-destructive' : balanced ? 'bg-green-500' : 'bg-primary'
                )}
                style={{ width: `${pctSum}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Rateado:{' '}
                <span className="font-medium text-foreground tabular-nums">{fmt(sum)}</span>{' '}
                de <span className="tabular-nums">{fmt(totalAmount)}</span>
              </span>
              {overflow ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Excede em {fmt(Math.abs(remaining))}
                </Badge>
              ) : balanced ? (
                <Badge variant="outline" className="gap-1 border-green-500/40 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Totalmente rateado
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  Restante: <span className="tabular-nums">{fmt(remaining)}</span> p/ {primaryCategory || 'principal'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function validateAllocations(
  allocations: Allocation[],
  total: number
): string | null {
  if (allocations.length === 0) return 'Adicione ao menos uma categoria de rateio';
  for (const a of allocations) {
    if (!a.category) return 'Selecione a categoria de cada linha de rateio';
    if (!a.amount || a.amount <= 0) return 'Cada rateio deve ter valor maior que zero';
  }
  const sum = allocations.reduce((s, a) => s + Number(a.amount), 0);
  if (sum > total + 0.01) return 'A soma dos rateios não pode ultrapassar o valor total da NF';
  return null;
}
