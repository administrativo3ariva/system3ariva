// Helpers to map between NF data (stock branch, recipient name/city) and
// financial entities (cost center, company).

import { FinancialCompany } from './types';

/** Map a stock branch to the corresponding financial cost center */
export function branchToCostCenter(branch: string | null | undefined): string {
  if (!branch) return '';
  const map: Record<string, string> = {
    'BH-Matriz': 'BH',
    'Vêneto-BH': 'BH',
    'Vêneto-SP': 'SP',
  };
  return map[branch] || branch;
}

/** Map a stock branch to the city it operates in (for delivery validation) */
export function branchToCity(branch: string | null | undefined): string {
  if (!branch) return '';
  const map: Record<string, string> = {
    'BH-Matriz': 'Belo Horizonte',
    'Vêneto-BH': 'Belo Horizonte',
    'Vêneto-SP': 'São Paulo',
    'SP': 'São Paulo',
    'RJ': 'Rio de Janeiro',
    'FLO': 'Florianópolis',
    'ITA': 'Itajubá',
    'PAG': 'Pouso Alegre',
    'VAG': 'Varginha',
    'CPN': 'Campinas',
    'LIM': 'Limeira',
    'JUN': 'Jundiaí',
    'SJC': 'São José dos Campos',
  };
  return map[branch] || '';
}

function normalize(input: string | null | undefined): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns true if the recipient city matches the branch's city */
export function isCityMatchingBranch(city: string | null | undefined, branch: string | null | undefined): boolean {
  const expected = branchToCity(branch);
  if (!expected) return true; // no expected city → can't validate
  if (!city) return true; // no city extracted → don't block
  return normalize(city) === normalize(expected);
}

/**
 * Detect the financial company from the recipient (tomador) name on the NF,
 * or fallback to supplier text. Returns a value matching FINANCIAL_COMPANIES.
 */
export function detectCompanyFromText(...candidates: Array<string | null | undefined>): FinancialCompany | '' {
  const text = normalize(candidates.filter(Boolean).join(' '));
  if (!text) return '';

  // Order matters: more specific patterns first
  if (/\brv\s*corretora\b|\brvcs\b|\brv\s*c\s*s\b|corretora\s*de\s*seguros/.test(text)) return 'RVCS';
  if (/\b3\s*a\s*servicos\b|\btres\s*a\s*servicos\b/.test(text)) return '3A Serviços';
  if (/\bveneto\b/.test(text)) return 'Vêneto';
  if (/\briva\b|\briva\s*ai\b/.test(text)) return 'RIVA';
  if (/\b3\s*a\b|\btres\s*a\b/.test(text)) return '3A';

  return '';
}
