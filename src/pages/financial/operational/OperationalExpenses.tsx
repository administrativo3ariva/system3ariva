import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { ALL_BRANCHES, BRANCH_LABELS, OPERATIONAL_CATEGORIES_BY_MACROBLOCO, MONTH_LABELS_PT, CATEGORY_TO_MACROBLOCO } from '@/lib/types';
import { buildConsumedList, fmtBRL, OPERATIONAL_EXPENSES_MACROBLOCOS } from '@/lib/operational-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, ArrowUpDown } from 'lucide-react';

const YEAR = 2026;

const ELIGIBLE_CATEGORIES = new Set(
  OPERATIONAL_EXPENSES_MACROBLOCOS.flatMap(m => OPERATIONAL_CATEGORIES_BY_MACROBLOCO[m])
);

type SortKey = 'date' | 'amount' | 'branch' | 'category';

export default function OperationalExpenses() {
  const { data: cardExpenses = [] } = useExpenses();
  const { data: payments = [] } = usePaymentRequests();

  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterMacro, setFilterMacro] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const all = useMemo(() => buildConsumedList({
    year: YEAR,
    expenses: cardExpenses as Parameters<typeof buildConsumedList>[0]['expenses'],
    payments: payments as Parameters<typeof buildConsumedList>[0]['payments'],
  }), [cardExpenses, payments]);

  // Auto-include only categories belonging to the 2 operational macroblocks (or unclassified for visibility)
  const opOnly = useMemo(() => all.filter(c => {
    const macro = CATEGORY_TO_MACROBLOCO[c.category];
    return macro && OPERATIONAL_EXPENSES_MACROBLOCOS.includes(macro);
  }), [all]);

  const filtered = useMemo(() => {
    let list = opOnly;
    if (filterBranch !== 'all') list = list.filter(i => i.branch === filterBranch);
    if (filterMonth !== 'all') list = list.filter(i => new Date(i.date).getMonth() + 1 === Number(filterMonth));
    if (filterMacro !== 'all') list = list.filter(i => i.macrobloco === filterMacro);
    if (filterStatus !== 'all') list = list.filter(i => i.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.description.toLowerCase().includes(q) ||
        (i.supplier || '').toLowerCase().includes(q) ||
        (i.company || '').toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'branch') cmp = a.branch.localeCompare(b.branch);
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [opOnly, filterBranch, filterMonth, filterMacro, filterStatus, search, sortKey, sortAsc]);

  const realizado = filtered.filter(i => i.status === 'realizado').reduce((s, i) => s + i.amount, 0);
  const comprometido = filtered.filter(i => i.status === 'comprometido').reduce((s, i) => s + i.amount, 0);
  const cancelado = filtered.filter(i => i.status === 'cancelado').reduce((s, i) => s + i.amount, 0);

  // Lançamentos potencialmente sem classificação (descrição parece operacional mas categoria não está em ELIGIBLE)
  const unclassifiedCount = all.filter(c => !CATEGORY_TO_MACROBLOCO[c.category]).length;

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Despesas Operacionais</h1>
        <p className="text-sm text-muted-foreground">
          Visão automática dos lançamentos classificados em <strong>Serviços e Apoio Operacional</strong> e <strong>Ocupação e Infraestrutura</strong>, vindos de Cartão Corporativo e Solicitações de Pagamento.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Realizado (Pagos)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmtBRL(realizado)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Comprometido</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{fmtBRL(comprometido)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cancelados/Rejeitados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-muted-foreground">{fmtBRL(cancelado)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lançamentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filtered.length}</div></CardContent></Card>
      </div>

      {unclassifiedCount > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 text-sm">
            <strong className="text-warning">{unclassifiedCount}</strong> lançamento{unclassifiedCount > 1 ? 's têm' : ' tem'} categoria não vinculada a nenhum macrobloco operacional. Eles não aparecem aqui — verifique a classificação no cadastro do lançamento.
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar descrição, fornecedor, empresa…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTH_LABELS_PT.map((l, i) => <SelectItem key={i} value={String(i + 1)}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger><SelectValue placeholder="Filial" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas filiais</SelectItem>
              {ALL_BRANCHES.map(b => <SelectItem key={b} value={b}>{BRANCH_LABELS[b] || b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMacro} onValueChange={setFilterMacro}>
            <SelectTrigger><SelectValue placeholder="Macrobloco" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos macroblocos</SelectItem>
              {OPERATIONAL_EXPENSES_MACROBLOCOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="comprometido">Comprometido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Lançamentos</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('date')}>Data <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('branch')}>Filial</TableHead>
                <TableHead>CC</TableHead>
                <TableHead>Macrobloco</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('category')}>Categoria</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => toggleSort('amount')}>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">Nenhum lançamento operacional para os filtros selecionados.</TableCell></TableRow>
              )}
              {filtered.map(i => (
                <TableRow key={`${i.source}-${i.id}`}>
                  <TableCell className="whitespace-nowrap text-sm">{format(new Date(i.date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                  <TableCell className="max-w-xs truncate">{i.description}</TableCell>
                  <TableCell className="text-sm">{i.supplier || '—'}</TableCell>
                  <TableCell className="text-sm">{i.company || '—'}</TableCell>
                  <TableCell className="text-sm">{BRANCH_LABELS[i.branch] || i.branch}</TableCell>
                  <TableCell className="text-sm">{i.cost_center || '—'}</TableCell>
                  <TableCell className="text-sm">{i.macrobloco}</TableCell>
                  <TableCell className="text-sm">{i.category}</TableCell>
                  <TableCell className="text-sm">{i.payment_method || '—'}</TableCell>
                  <TableCell>
                    {i.source === 'card' && <Badge variant="secondary">Cartão</Badge>}
                    {i.source === 'request' && <Badge variant="outline">Solicitação</Badge>}
                  </TableCell>
                  <TableCell>
                    {i.status === 'realizado' && <Badge className="bg-success/20 text-success hover:bg-success/20">Realizado</Badge>}
                    {i.status === 'comprometido' && <Badge variant="default">Comprometido</Badge>}
                    {i.status === 'cancelado' && <Badge variant="outline" className="text-muted-foreground">Cancelado</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{fmtBRL(i.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
