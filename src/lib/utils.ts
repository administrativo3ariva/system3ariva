import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza nome de fornecedor: trim, colapsa espaços internos.
 * Mantém capitalização original. Use para evitar duplicatas como
 * "Apoio Mineiro " vs "Apoio Mineiro".
 */
export function normalizeSupplierName(name?: string | null): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Chave para agrupamento case-insensitive de fornecedores
 * (usado em dashboards/relatórios para mesclar variações de digitação).
 */
export function supplierKey(name?: string | null): string {
  return normalizeSupplierName(name).toLowerCase();
}
