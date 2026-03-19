import { useProducts } from './use-products';
import { PRODUCT_CATEGORIES } from '@/lib/mock-data';

/** Returns a merged, deduplicated, sorted list of categories from DB + defaults */
export function useCategories() {
  const { data: products = [] } = useProducts();
  const dbCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const all = [...new Set([...PRODUCT_CATEGORIES, ...dbCategories])].sort();
  return all;
}
