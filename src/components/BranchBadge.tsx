import { Branch } from '@/lib/types';

const branchStyles: Record<string, string> = {
  'BH-Matriz': 'badge-bh-matriz',
  'Vêneto': 'badge-bh-algar',
  'SP': 'badge-sp',
  'RJ': 'badge-rj',
};

interface BranchBadgeProps {
  branch: Branch | string;
  floor?: string | null;
}

export function BranchBadge({ branch, floor }: BranchBadgeProps) {
  const cls = branchStyles[branch] || 'badge-default';
  const floorSuffix = branch === 'BH-Matriz' && floor
    ? `-${floor.replace('º andar', '')}`
    : '';
  return <span className={cls}>{branch}{floorSuffix && floorSuffix}</span>;
}
