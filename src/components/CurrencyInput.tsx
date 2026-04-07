import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Formats a number of cents into BRL display: "1.234,56"
 */
function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const centavos = abs % 100;
  const reaisStr = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cents < 0 ? '-' : ''}${reaisStr},${centavos.toString().padStart(2, '0')}`;
}

export function CurrencyInput({ value, onChange, onBlur, className, disabled, placeholder }: CurrencyInputProps) {
  // value is in reais (e.g. 1234.56), internally we work in cents
  const [cents, setCents] = useState(() => Math.round((value || 0) * 100));

  // Sync if external value changes significantly
  React.useEffect(() => {
    const externalCents = Math.round((value || 0) * 100);
    if (Math.abs(externalCents - cents) > 0) {
      setCents(externalCents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const displayValue = formatCents(cents);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: Backspace, Delete, Tab, Escape, Enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newCents = Math.floor(cents / 10);
        setCents(newCents);
        onChange(newCents / 100);
      }
      return;
    }

    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const newCents = cents * 10 + parseInt(e.key, 10);
    // Cap at 999,999,999.99
    if (newCents > 99999999999) return;
    setCents(newCents);
    onChange(newCents / 100);
  }, [cents, onChange]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground select-none">
        R$
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onKeyDown={handleKeyDown}
        onChange={() => {}} // controlled via keyDown
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn('pl-10 text-right font-mono tabular-nums', className)}
      />
    </div>
  );
}
