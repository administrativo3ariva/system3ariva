import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig<T extends string = string> = { key: T; direction: SortDirection };

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHead({ children, sortKey, currentSort, onSort, className }: SortableTableHeadProps) {
  const active = currentSort.key === sortKey;
  const Icon = active
    ? currentSort.direction === 'asc' ? ArrowUp : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:text-foreground transition-colors', className)}
      onClick={() => onSort(sortKey)}
    >
      <div className={cn('flex items-center gap-1', className?.includes('text-right') && 'justify-end')}>
        {children}
        <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-foreground' : 'text-muted-foreground/50')} />
      </div>
    </TableHead>
  );
}

export function toggleSort<T extends string>(current: SortConfig<T>, key: T): SortConfig<T> {
  if (current.key === key) {
    if (current.direction === 'asc') return { key, direction: 'desc' };
    if (current.direction === 'desc') return { key: '' as T, direction: null };
    return { key, direction: 'asc' };
  }
  return { key, direction: 'asc' };
}

export function sortData<T>(data: T[], sort: SortConfig, getValue: (item: T, key: string) => any): T[] {
  if (!sort.key || !sort.direction) return data;
  return [...data].sort((a, b) => {
    const va = getValue(a, sort.key);
    const vb = getValue(b, sort.key);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === 'string' ? va.localeCompare(vb, 'pt-BR') : va - vb;
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}
