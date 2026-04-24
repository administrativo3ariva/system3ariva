import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  key: string;
  label: string;
  allLabel: string;
  options: readonly string[] | string[];
}

interface FinancialFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  dateFrom: Date;
  dateTo: Date;
  onDateFromChange: (d: Date) => void;
  onDateToChange: (d: Date) => void;
  onClearDates: () => void;
  /** Whether the date range is the default (current month) */
  isDefaultRange: boolean;
}

export function FinancialFilters({
  filters,
  values,
  onValueChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  isDefaultRange,
}: FinancialFiltersProps) {
  const activeCount = Object.values(values).filter(v => v !== 'all').length + (isDefaultRange ? 0 : 1);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filtros</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-xs">{activeCount} ativo(s)</Badge>
        )}
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${2 + filters.length}, minmax(0, 1fr))` }}
      >
        {/* Date range */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Data Inicial</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-9 text-sm',
                  isDefaultRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {format(dateFrom, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => d && onDateFromChange(d)}
                initialFocus
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Data Final</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-9 text-sm',
                  isDefaultRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {format(dateTo, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => d && onDateToChange(d)}
                initialFocus
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Select filters */}
        {filters.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">{f.label}</span>
            <Select value={values[f.key] || 'all'} onValueChange={(v) => onValueChange(f.key, v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{f.allLabel}</SelectItem>
                {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Clear button */}
      {!isDefaultRange && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={onClearDates}>
            <X className="h-3 w-3" />
            Limpar datas
          </Button>
        </div>
      )}
    </Card>
  );
}

/** Hook to manage date range state defaulting to current month */
export function useDateRangeFilter() {
  const now = new Date();
  const defaultFrom = startOfMonth(now);
  const defaultTo = endOfMonth(now);

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [isDefaultRange, setIsDefaultRange] = useState(true);

  const handleDateFromChange = (d: Date) => {
    setDateFrom(d);
    setIsDefaultRange(false);
  };

  const handleDateToChange = (d: Date) => {
    setDateTo(d);
    setIsDefaultRange(false);
  };

  const clearDates = () => {
    setDateFrom(startOfMonth(new Date()));
    setDateTo(endOfMonth(new Date()));
    setIsDefaultRange(true);
  };

  return { dateFrom, dateTo, isDefaultRange, handleDateFromChange, handleDateToChange, clearDates };
}

/** Filter items by date field within range */
export function filterByDateRange<T>(items: T[], dateField: keyof T, from: Date, to: Date): T[] {
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');
  return items.filter(item => {
    const d = item[dateField] as string;
    if (!d) return false;
    const dateStr = d.includes('T') ? d.split('T')[0] : d;
    return dateStr >= fromStr && dateStr <= toStr;
  });
}
