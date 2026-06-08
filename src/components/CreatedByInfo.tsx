import { User } from 'lucide-react';
import { useProfileById } from '@/hooks/use-profile-by-id';

interface CreatedByInfoProps {
  /** UUID of the user that created the record (column `created_by`). */
  userId?: string | null;
  /** Optional fallback label (e.g. legacy `user` text column). */
  fallbackLabel?: string | null;
  /** Layout: compact (single line) or block (Nome / Email rows). */
  variant?: 'compact' | 'block';
}

/**
 * Displays the author (name + email) of an entry, based on profiles.user_id.
 * Used in detail dialogs/sheets for stock movements, expenses and payment requests.
 */
export function CreatedByInfo({ userId, fallbackLabel, variant = 'block' }: CreatedByInfoProps) {
  const { data: profile, isLoading } = useProfileById(userId);

  const name = profile?.full_name?.trim() || null;
  const email = profile?.email?.trim() || null;

  if (variant === 'compact') {
    const text = !userId
      ? (fallbackLabel || 'Não registrado')
      : isLoading
        ? 'Carregando...'
        : name && email
          ? `${name} (${email})`
          : (name || email || fallbackLabel || 'Não registrado');
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-foreground truncate">{text}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Lançado por
        </span>
      </div>
      {!userId ? (
        <p className="text-sm text-muted-foreground italic">
          {fallbackLabel ? `${fallbackLabel} (não rastreado)` : 'Não registrado'}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            {name || fallbackLabel || '—'}
          </p>
          <p className="text-xs text-muted-foreground">{email || '—'}</p>
        </div>
      )}
    </div>
  );
}
