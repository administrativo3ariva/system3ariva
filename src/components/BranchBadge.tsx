import { Branch } from '@/lib/types';

const branchStyles: Record<string, string> = {
  'BH-Matriz': 'badge-bh-matriz',
  'BH-Algar': 'badge-bh-algar',
  'Vêneto': 'badge-bh-algar',
  'SP': 'badge-sp',
  'RJ': 'badge-rj',
};

export function BranchBadge({ branch }: { branch: Branch | string }) {
  const cls = branchStyles[branch] || 'badge-default';
  return <span className={cls}>{branch}</span>;
}
