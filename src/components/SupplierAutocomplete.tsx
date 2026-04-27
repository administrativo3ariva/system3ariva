import { useState, useRef, useEffect } from 'react';
import { useSuppliers, Supplier } from '@/hooks/use-suppliers';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Building2, Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (name: string) => void;
  onSelectSupplier?: (supplier: Supplier) => void;
  placeholder?: string;
}

export function SupplierAutocomplete({ value, onChange, onSelectSupplier, placeholder = 'Digite o nome do fornecedor' }: Props) {
  const { data: suppliers = [] } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalizedValue = value.trim().replace(/\s+/g, ' ').toLowerCase();
  const filtered = normalizedValue.length >= 2
    ? suppliers
        .filter(s => s.name.toLowerCase().includes(normalizedValue))
        .slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto">
          {filtered.map(s => (
            <button
              key={s.id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2",
              )}
              onMouseDown={e => {
                e.preventDefault();
                onChange(s.name);
                onSelectSupplier?.(s);
                setOpen(false);
              }}
            >
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.name}</p>
                {s.cnpj_cpf && <p className="text-xs text-muted-foreground">{s.cnpj_cpf}</p>}
              </div>
              {s.payment_method && (
                <span className="text-xs text-muted-foreground capitalize shrink-0">
                  {s.payment_method}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
