import React, { useState, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Package,
  ArrowUpDown, AlertTriangle, Lightbulb, Download, Filter, CalendarDays, X,
  Building2, Users, ChevronDown,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, LineChart, Line, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList,
} from 'recharts';

import { useAllMovements } from '@/hooks/use-all-movements';
import { useAllProducts } from '@/hooks/use-all-products';
import { useAllCollaborators } from '@/hooks/use-all-collaborators';
import { STOCK_BRANCHES, BRANCH_LABELS, type StockBranch } from '@/lib/types';
import { useCategories } from '@/hooks/use-categories';
import {
  type PeriodPreset, getDateRange, filterMovements, getPreviousPeriodRange,
  getSameRangeLastYear, pctChange, totalGasto, sumSaidas,
  monthlyBreakdown, formatBRL, formatPct,
} from '@/lib/indicators-utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

/* ─── colors ─── */
const COLORS = [
  'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(210 70% 55%)',
  'hsl(150 60% 45%)', 'hsl(35 90% 55%)', 'hsl(280 60% 55%)',
  'hsl(0 70% 55%)', 'hsl(190 70% 45%)', 'hsl(55 80% 50%)', 'hsl(320 60% 50%)',
];

/* ─── Variation badge ─── */
function VarBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">Sem base</span>;
  const up = value > 0;
  return (
    <Badge variant={up ? 'destructive' : 'default'} className="text-xs gap-1">
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPct(value)}
    </Badge>
  );
}

/* ─── KPI Card ─── */
function KpiCardInline({ title, value, sub, variation, icon: Icon }: {
  title: string; value: string; sub?: string; variation?: number | null; icon: React.ElementType;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-lg font-bold tracking-tight truncate">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
            {variation !== undefined && <VarBadge value={variation ?? null} />}
          </div>
          <div className="rounded-lg p-2 bg-primary/10 text-primary shrink-0">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Custom recharts tooltip ─── */
function CustomTooltip({ active, payload, label, prefix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function StockIndicators() {
  const { data: allMovements = [], isLoading: lm } = useAllMovements();
  const { data: allProducts = [], isLoading: lp } = useAllProducts();
  const { data: allCollabs = [], isLoading: lc } = useAllCollaborators();
  const categories = useCategories();

  /* ─── Filters state ─── */
  const [period, setPeriod] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [selBranches, setSelBranches] = useState<string[]>([]);
  const [selCategories, setSelCategories] = useState<string[]>([]);
  const [selItem, setSelItem] = useState<string>('__all__');
  const [viewMode, setViewMode] = useState<'value' | 'qty' | 'perCapita'>('value');

  const loading = lm || lp || lc;

  /* ─── Derived ─── */
  const productMap = useMemo(() => new Map(allProducts.map(p => [p.id, p])), [allProducts]);
  const range = useMemo(() => getDateRange(period, customFrom, customTo), [period, customFrom, customTo]);
  const prevRange = useMemo(() => getPreviousPeriodRange(range), [range]);
  const yrRange = useMemo(() => getSameRangeLastYear(range), [range]);

  const filtered = useMemo(() => filterMovements(allMovements, range, selBranches, selCategories, productMap, selItem !== '__all__' ? selItem : undefined), [allMovements, range, selBranches, selCategories, productMap, selItem]);
  const prevFiltered = useMemo(() => filterMovements(allMovements, prevRange, selBranches, selCategories, productMap, selItem !== '__all__' ? selItem : undefined), [allMovements, prevRange, selBranches, selCategories, productMap, selItem]);
  const yrFiltered = useMemo(() => filterMovements(allMovements, yrRange, selBranches, selCategories, productMap, selItem !== '__all__' ? selItem : undefined), [allMovements, yrRange, selBranches, selCategories, productMap, selItem]);

  /* YTD */
  const now = new Date();
  const ytdRange = useMemo(() => ({ from: startOfYear(now), to: endOfMonth(now) }), []);
  const ytdPrevRange = useMemo(() => ({ from: subMonths(startOfYear(now), 12), to: subMonths(endOfMonth(now), 12) }), []);
  const ytdFiltered = useMemo(() => filterMovements(allMovements, ytdRange, selBranches, selCategories, productMap, selItem !== '__all__' ? selItem : undefined), [allMovements, ytdRange, selBranches, selCategories, productMap, selItem]);
  const ytdPrevFiltered = useMemo(() => filterMovements(allMovements, ytdPrevRange, selBranches, selCategories, productMap, selItem !== '__all__' ? selItem : undefined), [allMovements, ytdPrevRange, selBranches, selCategories, productMap, selItem]);

  /* ─── KPIs ─── */
  const gastoAtual = useMemo(() => totalGasto(filtered, productMap), [filtered, productMap]);
  const gastoAnterior = useMemo(() => totalGasto(prevFiltered, productMap), [prevFiltered, productMap]);
  const gastoYrAnterior = useMemo(() => totalGasto(yrFiltered, productMap), [yrFiltered, productMap]);
  const varMensal = pctChange(gastoAtual, gastoAnterior);
  const varAnual = pctChange(gastoAtual, gastoYrAnterior);

  const ytdGasto = useMemo(() => totalGasto(ytdFiltered, productMap), [ytdFiltered, productMap]);
  const ytdGastoPrev = useMemo(() => totalGasto(ytdPrevFiltered, productMap), [ytdPrevFiltered, productMap]);
  const varYtd = pctChange(ytdGasto, ytdGastoPrev);

  /* custo médio */
  const entradas = filtered.filter(m => m.type === 'entrada');
  const custoMedio = entradas.length > 0
    ? entradas.reduce((s, m) => s + m.quantity * (productMap.get(m.product_id)?.unit_price ?? 0), 0) / entradas.reduce((s, m) => s + m.quantity, 0)
    : 0;

  /* consumo */
  const consumoAtual = sumSaidas(filtered);
  const consumoAnterior = sumSaidas(prevFiltered);
  const varConsumo = pctChange(consumoAtual, consumoAnterior);

  /* item mais consumido */
  const itemConsumo = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    filtered.filter(m => m.type === 'saida').forEach(m => {
      const e = map.get(m.product_id) || { name: m.product_name, qty: 0 };
      e.qty += m.quantity;
      map.set(m.product_id, e);
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [filtered]);

  /* ─── Chart data ─── */

  // 1) Evolução mensal (all movements in broader range for trend)
  const monthlyData = useMemo(() => {
    const broader = filterMovements(allMovements, { from: subMonths(range.from, 5), to: range.to }, selBranches, selCategories, productMap, selItem !== '__all__' ? selItem : undefined);
    return monthlyBreakdown(broader, productMap).map(d => ({
      ...d,
      label: format(parseISO(d.month + '-01'), 'MMM/yy', { locale: ptBR }),
    }));
  }, [allMovements, range, selBranches, selCategories, productMap, selItem]);

  // 2) Gasto por filial
  const branchData = useMemo(() => {
    const map = new Map<string, { gasto: number; collabs: number }>();
    STOCK_BRANCHES.forEach(b => map.set(b, { gasto: 0, collabs: 0 }));
    filtered.filter(m => m.type === 'entrada').forEach(m => {
      const e = map.get(m.unit) || { gasto: 0, collabs: 0 };
      e.gasto += m.quantity * (productMap.get(m.product_id)?.unit_price ?? 0);
      map.set(m.unit, e);
    });
    allCollabs.forEach(c => {
      const e = map.get(c.unit);
      if (e) e.collabs++;
    });
    return Array.from(map.entries())
      .map(([b, v]) => ({
        branch: BRANCH_LABELS[b] || b,
        gasto: v.gasto,
        perCapita: v.collabs > 0 ? v.gasto / v.collabs : 0,
        collabs: v.collabs,
      }))
      .filter(d => d.gasto > 0)
      .sort((a, b) => b.gasto - a.gasto);
  }, [filtered, productMap, allCollabs]);

  // 3) Gasto por categoria
  const catData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter(m => m.type === 'entrada').forEach(m => {
      const p = productMap.get(m.product_id);
      const cat = p?.category || 'Outros';
      map.set(cat, (map.get(cat) || 0) + m.quantity * (p?.unit_price ?? 0));
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, productMap]);

  // 4) Top 10 itens por gasto
  const topGasto = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    filtered.filter(m => m.type === 'entrada').forEach(m => {
      const p = productMap.get(m.product_id);
      const e = map.get(m.product_id) || { name: m.product_name, value: 0 };
      e.value += m.quantity * (p?.unit_price ?? 0);
      map.set(m.product_id, e);
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filtered, productMap]);

  // 5) Top 10 itens por consumo
  const topConsumo = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    filtered.filter(m => m.type === 'saida').forEach(m => {
      const e = map.get(m.product_id) || { name: m.product_name, qty: 0 };
      e.qty += m.quantity;
      map.set(m.product_id, e);
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [filtered]);

  // 6) Custo médio por item ao longo do tempo (top 5 items)
  const avgCostTimeline = useMemo(() => {
    const topIds = topGasto.slice(0, 5).map(t => {
      for (const [id, p] of productMap) if (p.name === t.name || id === Object.keys(t)[0]) return id;
      return '';
    }).filter(Boolean);
    // simpler: use product_name
    const topNames = topGasto.slice(0, 5).map(t => t.name);
    const broader = filterMovements(allMovements, { from: subMonths(range.from, 5), to: range.to }, selBranches, selCategories, productMap, selItem !== '__all__' ? selItem : undefined);
    const monthMap = new Map<string, Map<string, { totalVal: number; totalQty: number }>>();
    broader.filter(m => m.type === 'entrada' && topNames.includes(m.product_name)).forEach(m => {
      const mon = format(parseISO(m.date), 'yyyy-MM');
      if (!monthMap.has(mon)) monthMap.set(mon, new Map());
      const im = monthMap.get(mon)!;
      const e = im.get(m.product_name) || { totalVal: 0, totalQty: 0 };
      const p = productMap.get(m.product_id);
      e.totalVal += m.quantity * (p?.unit_price ?? 0);
      e.totalQty += m.quantity;
      im.set(m.product_name, e);
    });
    return Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([mon, im]) => {
      const row: any = { month: format(parseISO(mon + '-01'), 'MMM/yy', { locale: ptBR }) };
      topNames.forEach(n => {
        const e = im.get(n);
        row[n] = e ? e.totalVal / e.totalQty : null;
      });
      return row;
    });
  }, [allMovements, range, topGasto, productMap, selBranches, selCategories, selItem]);

  // 7) Variação de consumo por item
  const consumoVar = useMemo(() => {
    const curr = new Map<string, { name: string; qty: number }>();
    const prev = new Map<string, { name: string; qty: number }>();
    filtered.filter(m => m.type === 'saida').forEach(m => {
      const e = curr.get(m.product_id) || { name: m.product_name, qty: 0 };
      e.qty += m.quantity;
      curr.set(m.product_id, e);
    });
    prevFiltered.filter(m => m.type === 'saida').forEach(m => {
      const e = prev.get(m.product_id) || { name: m.product_name, qty: 0 };
      e.qty += m.quantity;
      prev.set(m.product_id, e);
    });
    const allIds = new Set([...curr.keys(), ...prev.keys()]);
    return Array.from(allIds).map(id => {
      const c = curr.get(id);
      const p = prev.get(id);
      const pctV = pctChange(c?.qty ?? 0, p?.qty ?? 0);
      return { name: c?.name || p?.name || id, var: pctV ?? 0, current: c?.qty ?? 0, previous: p?.qty ?? 0 };
    }).sort((a, b) => Math.abs(b.var) - Math.abs(a.var)).slice(0, 10);
  }, [filtered, prevFiltered]);

  /* ─── Tables data ─── */

  // Table 1: Detalhamento por item
  const tableItems = useMemo(() => {
    const map = new Map<string, {
      name: string; category: string; branch: string;
      qtyComprada: number; qtyConsumida: number; valorComprado: number;
    }>();
    filtered.forEach(m => {
      const p = productMap.get(m.product_id);
      const key = m.product_id;
      const e = map.get(key) || {
        name: m.product_name, category: p?.category || '-', branch: m.unit,
        qtyComprada: 0, qtyConsumida: 0, valorComprado: 0,
      };
      if (m.type === 'entrada') {
        e.qtyComprada += m.quantity;
        e.valorComprado += m.quantity * (p?.unit_price ?? 0);
      }
      if (m.type === 'saida') e.qtyConsumida += m.quantity;
      map.set(key, e);
    });
    // prev for variation
    const prevMap = new Map<string, { valorComprado: number; qtyConsumida: number }>();
    prevFiltered.forEach(m => {
      const p = productMap.get(m.product_id);
      const e = prevMap.get(m.product_id) || { valorComprado: 0, qtyConsumida: 0 };
      if (m.type === 'entrada') e.valorComprado += m.quantity * (p?.unit_price ?? 0);
      if (m.type === 'saida') e.qtyConsumida += m.quantity;
      prevMap.set(m.product_id, e);
    });
    return Array.from(map.entries()).map(([id, v]) => {
      const prev = prevMap.get(id);
      return {
        ...v,
        custoMedio: v.qtyComprada > 0 ? v.valorComprado / v.qtyComprada : 0,
        varCusto: pctChange(v.valorComprado, prev?.valorComprado ?? 0),
        varConsumo: pctChange(v.qtyConsumida, prev?.qtyConsumida ?? 0),
      };
    }).sort((a, b) => b.valorComprado - a.valorComprado);
  }, [filtered, prevFiltered, productMap]);

  // Table 2: Resumo por filial
  const tableBranch = useMemo(() => {
    return branchData.map(b => {
      const branchMoves = filtered.filter(m => (BRANCH_LABELS[m.unit] || m.unit) === b.branch);
      const topItem = (() => {
        const m2 = new Map<string, { name: string; qty: number }>();
        branchMoves.filter(m => m.type === 'saida').forEach(m => {
          const e = m2.get(m.product_id) || { name: m.product_name, qty: 0 };
          e.qty += m.quantity;
          m2.set(m.product_id, e);
        });
        return Array.from(m2.values()).sort((a, b2) => b2.qty - a.qty)[0]?.name || '-';
      })();
      const topExpensive = (() => {
        const m2 = new Map<string, { name: string; val: number }>();
        branchMoves.filter(m => m.type === 'entrada').forEach(m => {
          const p = productMap.get(m.product_id);
          const e = m2.get(m.product_id) || { name: m.product_name, val: 0 };
          e.val += m.quantity * (p?.unit_price ?? 0);
          m2.set(m.product_id, e);
        });
        return Array.from(m2.values()).sort((a, b2) => b2.val - a.val)[0]?.name || '-';
      })();
      return { ...b, topItem, topExpensive };
    });
  }, [branchData, filtered, productMap]);

  // Table 3: Resumo por categoria
  const tableCat = useMemo(() => {
    const total = catData.reduce((s, c) => s + c.value, 0);
    const prevCatMap = new Map<string, { gasto: number; consumo: number }>();
    prevFiltered.forEach(m => {
      const p = productMap.get(m.product_id);
      const cat = p?.category || 'Outros';
      const e = prevCatMap.get(cat) || { gasto: 0, consumo: 0 };
      if (m.type === 'entrada') e.gasto += m.quantity * (p?.unit_price ?? 0);
      if (m.type === 'saida') e.consumo += m.quantity;
      prevCatMap.set(cat, e);
    });
    return catData.map(c => {
      const consumo = filtered.filter(m => m.type === 'saida' && (productMap.get(m.product_id)?.category || 'Outros') === c.name).reduce((s, m) => s + m.quantity, 0);
      const prev = prevCatMap.get(c.name);
      return {
        ...c,
        participacao: total > 0 ? (c.value / total) * 100 : 0,
        consumo,
        varCusto: pctChange(c.value, prev?.gasto ?? 0),
        varConsumo: pctChange(consumo, prev?.consumo ?? 0),
      };
    });
  }, [catData, prevFiltered, filtered, productMap]);

  /* ─── Insights ─── */
  const insights = useMemo(() => {
    const msgs: string[] = [];
    if (varMensal !== null) {
      msgs.push(varMensal > 0
        ? `Os custos com suprimentos subiram ${varMensal.toFixed(1)}% em relação ao período anterior.`
        : `Os custos com suprimentos caíram ${Math.abs(varMensal).toFixed(1)}% em relação ao período anterior.`
      );
    }
    if (catData.length > 0) {
      msgs.push(`A categoria "${catData[0].name}" foi a maior responsável pelos gastos no período (${catData[0].pct.toFixed(1)}%).`);
    }
    if (branchData.length > 0) {
      msgs.push(`A filial "${branchData[0].branch}" apresentou o maior gasto total: ${formatBRL(branchData[0].gasto)}.`);
    }
    if (itemConsumo.length > 0) {
      msgs.push(`O item "${itemConsumo[0].name}" foi o mais consumido no período (${itemConsumo[0].qty} unidades).`);
    }
    if (consumoVar.length > 0 && consumoVar[0].var > 20) {
      msgs.push(`O item "${consumoVar[0].name}" teve alta de ${consumoVar[0].var.toFixed(1)}% no consumo, indicando possível aumento de demanda ou desperdício.`);
    }
    return msgs;
  }, [varMensal, catData, branchData, itemConsumo, consumoVar]);

  /* ─── Filter toggle helpers ─── */
  const toggleBranch = (b: string) => setSelBranches(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const toggleCat = (c: string) => setSelCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  /* ─── Export CSV ─── */
  function exportCSV(headers: string[], rows: string[][], filename: string) {
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  /* ─── BH Per-floor data ─────
   * Floors with collaborators: 3º, 5º (Algar), 8º, 9º. 10º is meeting room only.
   * Strategy: for movements at unit BH-Matriz with `floor` set → attributed directly.
   * For movements at BH-Matriz without `floor` → split proportionally by collaborator count.
   */
  const FLOOR_KEYS = ['3º andar', 'Algar', '8º andar', '9º andar'] as const;
  const FLOOR_DISPLAY: Record<string, string> = {
    '3º andar': '3º andar',
    'Algar': '5º andar (Algar)',
    '8º andar': '8º andar',
    '9º andar': '9º andar',
  };

  const bhFloorData = useMemo(() => {
    // collaborator counts per floor (only BH-Matriz)
    const collabCounts: Record<string, number> = {};
    FLOOR_KEYS.forEach(f => { collabCounts[f] = 0; });
    allCollabs.filter(c => c.unit === 'BH-Matriz').forEach(c => {
      const f = c.floor;
      if (f && FLOOR_KEYS.includes(f as any)) collabCounts[f]++;
    });
    const totalCollabs = Object.values(collabCounts).reduce((a, b) => a + b, 0);

    // BH movements within current filter range/categories/item
    const bhMoves = filtered.filter(m => m.unit === 'BH-Matriz');

    type FloorAgg = { gastoDirect: number; gastoShared: number; consumoDirect: number; consumoShared: number; itens: Map<string, { name: string; qty: number; val: number }> };
    const agg: Record<string, FloorAgg> = {};
    FLOOR_KEYS.forEach(f => {
      agg[f] = { gastoDirect: 0, gastoShared: 0, consumoDirect: 0, consumoShared: 0, itens: new Map() };
    });

    let unallocGasto = 0;
    let unallocConsumo = 0;
    const unallocItems = new Map<string, { name: string; qty: number; val: number }>();

    bhMoves.forEach(m => {
      const p = productMap.get(m.product_id);
      const val = m.quantity * (p?.unit_price ?? 0);
      const f = m.floor;
      if (f && FLOOR_KEYS.includes(f as any)) {
        const a = agg[f];
        if (m.type === 'entrada') a.gastoDirect += val;
        if (m.type === 'saida') a.consumoDirect += m.quantity;
        const e = a.itens.get(m.product_id) || { name: m.product_name, qty: 0, val: 0 };
        if (m.type === 'saida') e.qty += m.quantity;
        if (m.type === 'entrada') e.val += val;
        a.itens.set(m.product_id, e);
      } else {
        if (m.type === 'entrada') unallocGasto += val;
        if (m.type === 'saida') unallocConsumo += m.quantity;
        const e = unallocItems.get(m.product_id) || { name: m.product_name, qty: 0, val: 0 };
        if (m.type === 'saida') e.qty += m.quantity;
        if (m.type === 'entrada') e.val += val;
        unallocItems.set(m.product_id, e);
      }
    });

    // Proportional split by collaborator share
    FLOOR_KEYS.forEach(f => {
      const share = totalCollabs > 0 ? collabCounts[f] / totalCollabs : 0;
      agg[f].gastoShared = unallocGasto * share;
      agg[f].consumoShared = unallocConsumo * share;
      // also distribute item amounts proportionally
      unallocItems.forEach((v, k) => {
        const e = agg[f].itens.get(k) || { name: v.name, qty: 0, val: 0 };
        e.qty += v.qty * share;
        e.val += v.val * share;
        agg[f].itens.set(k, e);
      });
    });

    return {
      collabCounts,
      totalCollabs,
      unalloc: { gasto: unallocGasto, consumo: unallocConsumo },
      rows: FLOOR_KEYS.map(f => {
        const a = agg[f];
        const collabs = collabCounts[f];
        const gasto = a.gastoDirect + a.gastoShared;
        const consumo = a.consumoDirect + a.consumoShared;
        const topItens = Array.from(a.itens.values()).sort((x, y) => y.val - x.val).slice(0, 5);
        return {
          floor: f,
          label: FLOOR_DISPLAY[f],
          collabs,
          gastoDirect: a.gastoDirect,
          gastoShared: a.gastoShared,
          gasto,
          consumoDirect: a.consumoDirect,
          consumoShared: a.consumoShared,
          consumo,
          gastoPerCollab: collabs > 0 ? gasto / collabs : 0,
          topItens,
        };
      }),
    };
  }, [allCollabs, filtered, productMap]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const topCostNames = topGasto.slice(0, 5).map(t => t.name);



  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title text-xl">Indicadores de Estoque</h1>
        <p className="text-sm text-muted-foreground">Análise gerencial de suprimentos — todas as filiais</p>
      </div>

      {/* ─── FILTERS ─── */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1.5 bg-primary/10">
                <Filter className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold">Filtros</span>
              {(selBranches.length > 0 || selCategories.length > 0 || selItem !== '__all__') && (
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {selBranches.length + selCategories.length + (selItem !== '__all__' ? 1 : 0)} ativos
                </Badge>
              )}
            </div>
            {(selBranches.length > 0 || selCategories.length > 0 || selItem !== '__all__') && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground" onClick={() => { setSelBranches([]); setSelCategories([]); setSelItem('__all__'); }}>
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            {/* Period */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Período</label>
              <Select value={period} onValueChange={v => setPeriod(v as PeriodPreset)}>
                <SelectTrigger className="h-9 text-xs">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mês atual</SelectItem>
                  <SelectItem value="3m">Últimos 3 meses</SelectItem>
                  <SelectItem value="6m">Últimos 6 meses</SelectItem>
                  <SelectItem value="ytd">Ano atual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {period === 'custom' && (
                <div className="flex gap-1.5 mt-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs flex-1 h-8 font-normal">
                        {customFrom ? format(customFrom, 'dd/MM/yy') : 'Início'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs flex-1 h-8 font-normal">
                        {customTo ? format(customTo, 'dd/MM/yy') : 'Fim'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customTo} onSelect={setCustomTo} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Branches multi-select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Filiais</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between text-xs font-normal">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {selBranches.length === 0 ? 'Todas as filiais' : `${selBranches.length} selecionada${selBranches.length > 1 ? 's' : ''}`}
                      </span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="max-h-72 overflow-y-auto space-y-0.5">
                    {STOCK_BRANCHES.map(b => (
                      <label key={b} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer text-xs">
                        <Checkbox checked={selBranches.includes(b)} onCheckedChange={() => toggleBranch(b)} />
                        <span>{BRANCH_LABELS[b] || b}</span>
                      </label>
                    ))}
                  </div>
                  {selBranches.length > 0 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs" onClick={() => setSelBranches([])}>
                      Limpar
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Categories multi-select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Categorias</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between text-xs font-normal">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {selCategories.length === 0 ? 'Todas as categorias' : `${selCategories.length} selecionada${selCategories.length > 1 ? 's' : ''}`}
                      </span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="max-h-72 overflow-y-auto space-y-0.5">
                    {categories.map(c => (
                      <label key={c} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer text-xs">
                        <Checkbox checked={selCategories.includes(c)} onCheckedChange={() => toggleCat(c)} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                  {selCategories.length > 0 && (
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs" onClick={() => setSelCategories([])}>
                      Limpar
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Item select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Item</label>
              <Select value={selItem} onValueChange={setSelItem}>
                <SelectTrigger className="h-9 text-xs">
                  <Package className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Todos os itens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os itens</SelectItem>
                  {allProducts
                    .filter(p => allMovements.some(m => m.product_id === p.id))
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({BRANCH_LABELS[p.unit] || p.unit})</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips */}
          {(selBranches.length > 0 || selCategories.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/40">
              {selBranches.map(b => (
                <Badge key={`b-${b}`} variant="secondary" className="text-[10px] gap-1 pl-2 pr-1 py-0.5">
                  {BRANCH_LABELS[b] || b}
                  <button onClick={() => toggleBranch(b)} className="hover:bg-background/50 rounded-sm p-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              {selCategories.map(c => (
                <Badge key={`c-${c}`} variant="secondary" className="text-[10px] gap-1 pl-2 pr-1 py-0.5">
                  {c}
                  <button onClick={() => toggleCat(c)} className="hover:bg-background/50 rounded-sm p-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="bh-andar" className="text-xs gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Por Andar (BH)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardInline title="Gasto Total no Período" value={formatBRL(gastoAtual)} sub={`Anterior: ${formatBRL(gastoAnterior)}`} variation={varMensal} icon={DollarSign} />
        <KpiCardInline title="Variação Mensal" value={formatPct(varMensal)} sub={varMensal !== null ? (varMensal > 0 ? 'Custos subiram' : 'Custos caíram') : undefined} variation={varMensal} icon={ArrowUpDown} />
        <KpiCardInline title="Variação YTD" value={formatPct(varYtd)} sub={`YTD: ${formatBRL(ytdGasto)}`} variation={varYtd} icon={TrendingUp} />
        <KpiCardInline title="Custo Médio por Item" value={formatBRL(custoMedio)} sub={`${entradas.length} entradas no período`} icon={Package} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardInline title="Gasto por Filial (Top)" value={branchData[0] ? formatBRL(branchData[0].gasto) : 'N/A'} sub={branchData[0]?.branch || ''} icon={BarChart3} />
        <KpiCardInline title="Categoria Líder" value={catData[0]?.name || 'N/A'} sub={catData[0] ? `${catData[0].pct.toFixed(1)}% do total` : ''} icon={PieChart} />
        <KpiCardInline title="Consumo no Período" value={`${consumoAtual} un.`} sub={itemConsumo[0] ? `Mais consumido: ${itemConsumo[0].name}` : ''} variation={varConsumo} icon={TrendingDown} />
        <KpiCardInline title="Variação de Consumo" value={formatPct(varConsumo)} sub={varConsumo !== null ? (varConsumo > 0 ? 'Consumo subiu' : 'Consumo caiu') : undefined} variation={varConsumo} icon={AlertTriangle} />
      </div>

      {/* ─── CHARTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Evolução mensal */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução do Gasto Mensal</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} content={<CustomTooltip prefix="R$ " />} />
                  <Bar dataKey="gasto" name="Gasto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line dataKey="gasto" type="monotone" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Gasto por filial */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Gasto por Filial</CardTitle>
              <Select value={viewMode} onValueChange={v => setViewMode(v as any)}>
                <SelectTrigger className="w-32 text-xs h-7"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Valor total</SelectItem>
                  <SelectItem value="perCapita">Por colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="branch" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} content={<CustomTooltip prefix="R$ " />} />
                  <Bar dataKey={viewMode === 'perCapita' ? 'perCapita' : 'gasto'} name={viewMode === 'perCapita' ? 'Por colaborador' : 'Gasto'} fill="hsl(210 70% 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Gasto por categoria (donut) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip prefix="R$ " />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Top 10 itens por gasto */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top 10 Itens por Gasto</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: Math.max(280, topGasto.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topGasto}
                  layout="vertical"
                  margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
                  barCategoryGap={6}
                >
                  <defs>
                    <linearGradient id="topGastoGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={150}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + '…' : v}
                  />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} content={<CustomTooltip prefix="R$ " />} />
                  <Bar dataKey="value" name="Gasto" fill="url(#topGastoGrad)" radius={[0, 6, 6, 0]} barSize={18}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(v: number) => `R$${(v / 1000).toFixed(1)}k`}
                      style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 5. Top 10 itens por consumo */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top 10 Itens por Consumo</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: Math.max(280, topConsumo.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topConsumo}
                  layout="vertical"
                  margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
                  barCategoryGap={6}
                >
                  <defs>
                    <linearGradient id="topConsumoGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(150 60% 45%)" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(190 70% 45%)" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={150}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + '…' : v}
                  />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} content={<CustomTooltip />} />
                  <Bar dataKey="qty" name="Quantidade" fill="url(#topConsumoGrad)" radius={[0, 6, 6, 0]} barSize={18}>
                    <LabelList
                      dataKey="qty"
                      position="right"
                      formatter={(v: number) => v.toLocaleString('pt-BR')}
                      style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 6. Custo médio ao longo do tempo */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução do Custo Médio (Top 5)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgCostTimeline}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v.toFixed(0)}`} />
                  <Tooltip cursor={{ stroke: 'hsl(var(--muted-foreground) / 0.3)' }} content={<CustomTooltip prefix="R$ " />} />
                  {topCostNames.map((name, i) => (
                    <Line key={name} dataKey={name} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── INSIGHTS ─── */}
      {insights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((msg, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {msg}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ─── TABLES ─── */}
      {/* Table 1 — Detalhamento por Item */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Detalhamento por Item</CardTitle>
            <Button variant="outline" size="sm" className="text-xs" onClick={() =>
              exportCSV(
                ['Item', 'Categoria', 'Filial', 'Qtd Comprada', 'Qtd Consumida', 'Valor Comprado', 'Custo Médio', 'Var Custo %', 'Var Consumo %'],
                tableItems.map(r => [r.name, r.category, r.branch, String(r.qtyComprada), String(r.qtyConsumida), r.valorComprado.toFixed(2), r.custoMedio.toFixed(2), r.varCusto !== null ? r.varCusto.toFixed(1) : '-', r.varConsumo !== null ? r.varConsumo.toFixed(1) : '-']),
                'detalhamento_item.csv'
              )
            }>
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-xs text-right">Qtd Comprada</TableHead>
                  <TableHead className="text-xs text-right">Qtd Consumida</TableHead>
                  <TableHead className="text-xs text-right">Valor Comprado</TableHead>
                  <TableHead className="text-xs text-right">Custo Médio</TableHead>
                  <TableHead className="text-xs text-right">Var. Custo</TableHead>
                  <TableHead className="text-xs text-right">Var. Consumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableItems.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Nenhum dado encontrado para o período selecionado.</TableCell></TableRow>
                )}
                {tableItems.slice(0, 20).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs">{r.category}</TableCell>
                    <TableCell className="text-xs text-right">{r.qtyComprada}</TableCell>
                    <TableCell className="text-xs text-right">{r.qtyConsumida}</TableCell>
                    <TableCell className="text-xs text-right">{formatBRL(r.valorComprado)}</TableCell>
                    <TableCell className="text-xs text-right">{formatBRL(r.custoMedio)}</TableCell>
                    <TableCell className="text-xs text-right"><VarBadge value={r.varCusto} /></TableCell>
                    <TableCell className="text-xs text-right"><VarBadge value={r.varConsumo} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Table 2 — Resumo por Filial */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Resumo por Filial</CardTitle>
            <Button variant="outline" size="sm" className="text-xs" onClick={() =>
              exportCSV(
                ['Filial', 'Gasto Total', 'Por Colaborador', 'Colaboradores', 'Item Mais Consumido', 'Item Mais Caro'],
                tableBranch.map(r => [r.branch, r.gasto.toFixed(2), r.perCapita.toFixed(2), String(r.collabs), r.topItem, r.topExpensive]),
                'resumo_filial.csv'
              )
            }>
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Filial</TableHead>
                  <TableHead className="text-xs text-right">Gasto Total</TableHead>
                  <TableHead className="text-xs text-right">Por Colaborador</TableHead>
                  <TableHead className="text-xs text-right">Colaboradores</TableHead>
                  <TableHead className="text-xs">Mais Consumido</TableHead>
                  <TableHead className="text-xs">Mais Caro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableBranch.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Sem dados.</TableCell></TableRow>
                )}
                {tableBranch.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-medium">{r.branch}</TableCell>
                    <TableCell className="text-xs text-right">{formatBRL(r.gasto)}</TableCell>
                    <TableCell className="text-xs text-right">{r.collabs > 0 ? formatBRL(r.perCapita) : '-'}</TableCell>
                    <TableCell className="text-xs text-right">{r.collabs}</TableCell>
                    <TableCell className="text-xs">{r.topItem}</TableCell>
                    <TableCell className="text-xs">{r.topExpensive}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Table 3 — Resumo por Categoria */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Resumo por Categoria</CardTitle>
            <Button variant="outline" size="sm" className="text-xs" onClick={() =>
              exportCSV(
                ['Categoria', 'Gasto Total', 'Participação %', 'Consumo', 'Var Custo %', 'Var Consumo %'],
                tableCat.map(r => [r.name, r.value.toFixed(2), r.participacao.toFixed(1), String(r.consumo), r.varCusto !== null ? r.varCusto.toFixed(1) : '-', r.varConsumo !== null ? r.varConsumo.toFixed(1) : '-']),
                'resumo_categoria.csv'
              )
            }>
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-xs text-right">Gasto Total</TableHead>
                  <TableHead className="text-xs text-right">Participação</TableHead>
                  <TableHead className="text-xs text-right">Consumo</TableHead>
                  <TableHead className="text-xs text-right">Var. Custo</TableHead>
                  <TableHead className="text-xs text-right">Var. Consumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableCat.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Sem dados.</TableCell></TableRow>
                )}
                {tableCat.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs text-right">{formatBRL(r.value)}</TableCell>
                    <TableCell className="text-xs text-right">{r.participacao.toFixed(1)}%</TableCell>
                    <TableCell className="text-xs text-right">{r.consumo}</TableCell>
                    <TableCell className="text-xs text-right"><VarBadge value={r.varCusto} /></TableCell>
                    <TableCell className="text-xs text-right"><VarBadge value={r.varConsumo} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="bh-andar" className="space-y-6 mt-0">
          <BHFloorView data={bhFloorData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════ BH Floor View ═══════════════ */
function BHFloorView({ data }: { data: any }) {
  const { rows, totalCollabs, unalloc } = data;
  const totalGastoBH = rows.reduce((s: number, r: any) => s + r.gasto, 0);
  const totalConsumoBH = rows.reduce((s: number, r: any) => s + r.consumo, 0);

  if (totalCollabs === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Nenhum colaborador cadastrado em BH-Matriz com andar definido. Cadastre colaboradores em <strong>Estoque → Colaboradores</strong> e atribua o andar para visualizar este painel.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">BH (Matriz) — Visão por Andar</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> {totalCollabs} colaboradores
          </div>
          <div className="text-muted-foreground">
            Movimentações sem andar específico são <strong className="text-foreground">rateadas proporcionalmente</strong> ao número de colaboradores por andar.
          </div>
        </CardContent>
      </Card>

      {/* KPIs per floor */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {rows.map((r: any) => (
          <Card key={r.floor} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                  <p className="text-lg font-bold">{formatBRL(r.gasto)}</p>
                </div>
                <div className="rounded-lg p-2 bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.collabs} colab.</span>
                <span>{r.collabs > 0 ? `${formatBRL(r.gastoPerCollab)}/colab.` : '—'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Gasto por Andar</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="gastoDirect" stackId="g" name="Direto (lançado no andar)" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="gastoShared" stackId="g" name="Rateio (proporcional)" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Consumo por Andar (unidades)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={(v: number) => `${Number(v).toFixed(1)} un.`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="consumoDirect" stackId="c" name="Direto" fill="hsl(150 60% 45%)" />
                  <Bar dataKey="consumoShared" stackId="c" name="Rateio" fill="hsl(35 90% 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detalhamento por Andar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Andar</TableHead>
                <TableHead className="text-xs text-right">Colaboradores</TableHead>
                <TableHead className="text-xs text-right">Gasto Direto</TableHead>
                <TableHead className="text-xs text-right">Rateio</TableHead>
                <TableHead className="text-xs text-right">Gasto Total</TableHead>
                <TableHead className="text-xs text-right">% do Gasto BH</TableHead>
                <TableHead className="text-xs text-right">Por Colab.</TableHead>
                <TableHead className="text-xs text-right">Consumo (un.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.floor}>
                  <TableCell className="text-xs font-medium">{r.label}</TableCell>
                  <TableCell className="text-xs text-right">{r.collabs}</TableCell>
                  <TableCell className="text-xs text-right">{formatBRL(r.gastoDirect)}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{formatBRL(r.gastoShared)}</TableCell>
                  <TableCell className="text-xs text-right font-semibold">{formatBRL(r.gasto)}</TableCell>
                  <TableCell className="text-xs text-right">{totalGastoBH > 0 ? ((r.gasto / totalGastoBH) * 100).toFixed(1) : '0.0'}%</TableCell>
                  <TableCell className="text-xs text-right">{r.collabs > 0 ? formatBRL(r.gastoPerCollab) : '—'}</TableCell>
                  <TableCell className="text-xs text-right">{r.consumo.toFixed(1)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="text-xs">Total BH</TableCell>
                <TableCell className="text-xs text-right">{totalCollabs}</TableCell>
                <TableCell className="text-xs text-right">{formatBRL(rows.reduce((s: number, r: any) => s + r.gastoDirect, 0))}</TableCell>
                <TableCell className="text-xs text-right">{formatBRL(unalloc.gasto)}</TableCell>
                <TableCell className="text-xs text-right">{formatBRL(totalGastoBH)}</TableCell>
                <TableCell className="text-xs text-right">100%</TableCell>
                <TableCell className="text-xs text-right">{totalCollabs > 0 ? formatBRL(totalGastoBH / totalCollabs) : '—'}</TableCell>
                <TableCell className="text-xs text-right">{totalConsumoBH.toFixed(1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top items per floor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((r: any) => (
          <Card key={r.floor}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{r.label}</span>
                <Badge variant="secondary" className="text-[10px]">{r.collabs} colab.</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {r.topItens.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sem movimentações no período.</p>
              ) : (
                <div className="space-y-2">
                  {r.topItens.map((it: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1">{it.name}</span>
                      <div className="flex gap-3 ml-2 shrink-0">
                        <span className="text-muted-foreground">{it.qty.toFixed(1)} un.</span>
                        <span className="font-medium w-24 text-right">{formatBRL(it.val)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
