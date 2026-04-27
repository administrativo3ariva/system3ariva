import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { usePaymentRequests } from '@/hooks/use-payment-requests';
import { FINANCIAL_COST_CENTERS, FINANCIAL_COMPANIES, EXPENSE_CATEGORIES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, FileSpreadsheet, Filter, X, TrendingUp, TrendingDown, ArrowRightLeft, Split } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { expandAllocations, isAllocated } from '@/lib/allocation-utils';
import { normalizeSupplierName } from '@/lib/utils';

const GroupedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cartao = payload.find((p: any) => p.dataKey === 'cartao');
  const solic = payload.find((p: any) => p.dataKey === 'solicitacao');
  const total = (cartao ? Number(cartao.value) : 0) + (solic ? Number(solic.value) : 0);
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg min-w-[180px]">
      {label && <p className="mb-2 text-sm font-medium text-foreground">{label}</p>}
      {cartao && Number(cartao.value) > 0 && (
        <p className="text-sm font-semibold" style={{ color: 'hsl(221, 83%, 53%)' }}>
          Cartão Corporativo: {fmt(Number(cartao.value))}
        </p>
      )}
      {solic && Number(solic.value) > 0 && (
        <p className="text-sm font-semibold" style={{ color: 'hsl(142, 71%, 45%)' }}>
          Solicitações: {fmt(Number(solic.value))}
        </p>
      )}
      <p className="text-sm font-bold mt-1 pt-1 border-t border-border text-foreground">
        Total: {fmt(total)}
      </p>
    </div>
  );
};

type SourceType = 'cartao' | 'solicitacao';

const COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 84%, 60%)',
  'hsl(190, 90%, 50%)',
  'hsl(330, 80%, 55%)',
  'hsl(45, 93%, 47%)',
  'hsl(160, 60%, 45%)',
  'hsl(280, 65%, 60%)',
];

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinancialReports() {
  const { data: expenses = [] } = useExpenses();
  const { data: requests = [] } = usePaymentRequests();

  const defaultRange = getMonthRange();
  const [dateStart, setDateStart] = useState(defaultRange.start);
  const [dateEnd, setDateEnd] = useState(defaultRange.end);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedCostCenters, setSelectedCostCenters] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>(['cartao', 'solicitacao']);
  const [groupBy, setGroupBy] = useState<'category' | 'company' | 'cost_center' | 'supplier'>('category');

  // Merge and filter data — expand each entry into per-category allocation slices
  // so totals/groups reflect rateio precisely (a single NF can contribute to N categories).
  const filteredData = useMemo(() => {
    type Row = {
      id: string;
      description: string;
      amount: number;        // slice amount (after rateio)
      totalAmount: number;   // original entry total
      cost_center: string;
      company: string;
      category: string;      // category of THIS slice
      primaryCategory: string;
      isPrimary: boolean;
      isAllocated: boolean;
      allocationLabel: string; // e.g. "Rateado: Limpeza R$50 + Material R$30"
      supplier: string;
      date: string;
      source: SourceType;
      sourceLabel: string;
      card_name: string;
      status: string;
    };

    const buildRows = (
      entry: any,
      base: Omit<Row, 'amount' | 'category' | 'isPrimary' | 'isAllocated' | 'allocationLabel' | 'primaryCategory' | 'totalAmount'>
    ): Row[] => {
      const total = Number(entry.amount) || 0;
      const allocated = isAllocated(entry);
      const slices = expandAllocations(entry);
      const breakdownLabel = allocated
        ? 'Rateado: ' +
          slices
            .map(s => `${s.category} ${s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
            .join(' + ')
        : '';
      return slices.map(s => ({
        ...base,
        amount: s.amount,
        totalAmount: total,
        category: s.category,
        primaryCategory: entry.category,
        isPrimary: s.isPrimary,
        isAllocated: allocated,
        allocationLabel: breakdownLabel,
      }));
    };

    const allItems: Row[] = [
      ...expenses.flatMap(e =>
        buildRows(e, {
          id: e.id,
          description: e.description,
          cost_center: e.cost_center,
          company: e.company,
          supplier: normalizeSupplierName(e.supplier) || '—',
          date: e.expense_date,
          source: 'cartao',
          sourceLabel: 'Cartão Corporativo',
          card_name: e.card_name || '—',
          status: e.receipt_url ? 'Comprovado' : 'Pendente',
        })
      ),
      ...requests.flatMap(r =>
        buildRows(r, {
          id: r.id,
          description: r.description,
          cost_center: r.cost_center,
          company: r.company,
          supplier: normalizeSupplierName(r.supplier) || '—',
          date: r.request_date || r.created_at?.split('T')[0],
          source: 'solicitacao',
          sourceLabel: 'Solicitação de Pagamento',
          card_name: '—',
          status: r.status,
        })
      ),
    ];

    return allItems.filter(item => {
      if (item.date < dateStart || item.date > dateEnd) return false;
      if (selectedCompanies.length && !selectedCompanies.includes(item.company)) return false;
      if (selectedCostCenters.length && !selectedCostCenters.includes(item.cost_center)) return false;
      // Category filter matches the SLICE category, so rateio splits show up correctly
      if (selectedCategories.length && !selectedCategories.includes(item.category)) return false;
      if (!selectedSources.includes(item.source)) return false;
      return true;
    });
  }, [expenses, requests, dateStart, dateEnd, selectedCompanies, selectedCostCenters, selectedCategories, selectedSources]);

  // Summary stats
  const totalAmount = filteredData.reduce((s, i) => s + i.amount, 0);
  const totalCartao = filteredData.filter(i => i.source === 'cartao').reduce((s, i) => s + i.amount, 0);
  const totalSolicitacao = filteredData.filter(i => i.source === 'solicitacao').reduce((s, i) => s + i.amount, 0);

  // Grouped data for chart
  const groupedData = useMemo(() => {
    const map: Record<string, { cartao: number; solicitacao: number }> = {};
    filteredData.forEach(item => {
      const key = item[groupBy] || '—';
      if (!map[key]) map[key] = { cartao: 0, solicitacao: 0 };
      if (item.source === 'cartao') map[key].cartao += item.amount;
      else map[key].solicitacao += item.amount;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, cartao: v.cartao, solicitacao: v.solicitacao, total: v.cartao + v.solicitacao }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData, groupBy]);

  // Pie data by cost center
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach(i => {
      map[i.cost_center] = (map[i.cost_center] || 0) + i.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const toggleArrayItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const clearFilters = () => {
    const range = getMonthRange();
    setDateStart(range.start);
    setDateEnd(range.end);
    setSelectedCompanies([]);
    setSelectedCostCenters([]);
    setSelectedCategories([]);
    setSelectedSources(['cartao', 'solicitacao']);
  };

  const hasActiveFilters = selectedCompanies.length > 0 || selectedCostCenters.length > 0 || selectedCategories.length > 0;

  // Export XLSX
  const handleExport = () => {
    const mapRow = (item: typeof filteredData[0]) => ({
      'Data': item.date,
      'Descrição': item.description,
      'Valor (R$)': item.amount,
      'Valor Total Lançamento (R$)': item.totalAmount,
      'Rateado': item.isAllocated ? 'Sim' : 'Não',
      'Categoria (fatia)': item.category,
      'Tipo Fatia': item.isAllocated ? (item.isPrimary ? 'Principal' : 'Secundária') : 'Única',
      'Detalhe Rateio': item.allocationLabel,
      'Empresa': item.company,
      'Centro de Custo': item.cost_center,
      'Fornecedor': item.supplier,
      'Cartão': item.card_name,
      'Status': item.status,
    });

    const cartaoRows = filteredData.filter(i => i.source === 'cartao').map(mapRow);
    const solicitacaoRows = filteredData.filter(i => i.source === 'solicitacao').map(mapRow);

    const allocatedCount = new Set(
      filteredData.filter(i => i.isAllocated).map(i => `${i.source}:${i.id}`)
    ).size;

    // Summary sheet
    const summaryRows = [
      { 'Métrica': 'Total Geral (com rateio)', 'Valor (R$)': totalAmount },
      { 'Métrica': 'Total Cartão Corporativo', 'Valor (R$)': totalCartao },
      { 'Métrica': 'Total Solicitações', 'Valor (R$)': totalSolicitacao },
      { 'Métrica': 'Qtd. Fatias (linhas)', 'Valor (R$)': filteredData.length },
      { 'Métrica': 'Qtd. Lançamentos Rateados', 'Valor (R$)': allocatedCount },
      { 'Métrica': 'Período', 'Valor (R$)': `${dateStart} a ${dateEnd}` },
    ];

    // Grouped sheet (já usa amount = fatia, então rateio é refletido)
    const groupedRows = groupedData.map(g => ({
      [groupLabels[groupBy]]: g.name,
      'Cartão Corp. (R$)': g.cartao,
      'Solicitações (R$)': g.solicitacao,
      'Total (R$)': g.total,
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    const wsCartao = XLSX.utils.json_to_sheet(cartaoRows);
    const wsSolicitacao = XLSX.utils.json_to_sheet(solicitacaoRows);
    const wsGrouped = XLSX.utils.json_to_sheet(groupedRows);

    const colWidths = [
      { wch: 12 }, { wch: 36 }, { wch: 14 }, { wch: 18 }, { wch: 10 },
      { wch: 22 }, { wch: 12 }, { wch: 40 },
      { wch: 15 }, { wch: 16 }, { wch: 25 }, { wch: 22 }, { wch: 12 },
    ];
    wsCartao['!cols'] = colWidths;
    wsSolicitacao['!cols'] = colWidths;
    wsSummary['!cols'] = [{ wch: 32 }, { wch: 22 }];
    wsGrouped['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    // Apply formatting to all sheets
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
        left: { style: 'thin', color: { rgb: 'CCCCCC' } },
        right: { style: 'thin', color: { rgb: 'CCCCCC' } },
      },
    };

    const currencyFmt = '#,##0.00';
    const borderStyle = {
      top: { style: 'thin', color: { rgb: 'E0E0E0' } },
      bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
      left: { style: 'thin', color: { rgb: 'E0E0E0' } },
      right: { style: 'thin', color: { rgb: 'E0E0E0' } },
    };

    const applyFormatting = (ws: XLSX.WorkSheet, numCols: number, currencyCols: number[]) => {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

      // Format header row
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[addr]) ws[addr].s = headerStyle;
      }

      // Format data rows
      for (let r = 1; r <= range.e.r; r++) {
        const isEven = r % 2 === 0;
        for (let c = range.s.c; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) continue;
          const cellStyle: any = {
            border: borderStyle,
            alignment: { vertical: 'center' },
          };
          if (isEven) {
            cellStyle.fill = { fgColor: { rgb: 'F5F7FA' } };
          }
          if (currencyCols.includes(c)) {
            cellStyle.numFmt = currencyFmt;
            cellStyle.alignment = { horizontal: 'right', vertical: 'center' };
          }
          ws[addr].s = cellStyle;
        }
      }
    };

    applyFormatting(wsSummary, 2, [1]);
    // Cols moeda nas abas detalhadas: 2=Valor (fatia), 3=Valor Total Lançamento
    applyFormatting(wsCartao, 13, [2, 3]);
    applyFormatting(wsSolicitacao, 13, [2, 3]);
    applyFormatting(wsGrouped, 4, [1, 2, 3]);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    XLSX.utils.book_append_sheet(wb, wsCartao, 'Cartão Corporativo');
    XLSX.utils.book_append_sheet(wb, wsSolicitacao, 'Solicitações');
    XLSX.utils.book_append_sheet(wb, wsGrouped, `Por ${groupLabels[groupBy]}`);

    XLSX.writeFile(wb, `Relatorio_Financeiro_${dateStart}_${dateEnd}.xlsx`);
  };

  const groupLabels: Record<string, string> = {
    category: 'Categoria',
    company: 'Empresa',
    cost_center: 'Centro de Custo',
    supplier: 'Fornecedor',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione os parâmetros e exporte os dados em planilha
          </p>
        </div>
        <Button onClick={handleExport} disabled={filteredData.length === 0} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar XLSX
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> Parâmetros do Relatório
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs h-7">
                <X className="h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Inicial</Label>
              <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Final</Label>
              <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Agrupar por</Label>
              <Select value={groupBy} onValueChange={v => setGroupBy(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Categoria</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="cost_center">Centro de Custo</SelectItem>
                  <SelectItem value="supplier">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Origem</Label>
              <div className="flex gap-3 pt-2">
                <label className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={selectedSources.includes('cartao')}
                    onCheckedChange={() => setSelectedSources(s => toggleArrayItem(s, 'cartao'))}
                  />
                  Cartão
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={selectedSources.includes('solicitacao')}
                    onCheckedChange={() => setSelectedSources(s => toggleArrayItem(s, 'solicitacao'))}
                  />
                  Solicitações
                </label>
              </div>
            </div>
          </div>

          {/* Multi-select chips */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Empresas</Label>
              <div className="flex flex-wrap gap-1.5">
                {FINANCIAL_COMPANIES.map(c => (
                  <Badge
                    key={c}
                    variant={selectedCompanies.includes(c) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedCompanies(s => toggleArrayItem(s, c))}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Centros de Custo</Label>
              <div className="flex flex-wrap gap-1.5">
                {FINANCIAL_COST_CENTERS.map(c => (
                  <Badge
                    key={c}
                    variant={selectedCostCenters.includes(c) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedCostCenters(s => toggleArrayItem(s, c))}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categorias</Label>
              <div className="flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.map(c => (
                  <Badge
                    key={c}
                    variant={selectedCategories.includes(c) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedCategories(s => toggleArrayItem(s, c))}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Geral</p>
            <p className="text-xl font-bold tabular-nums text-foreground">{fmt(totalAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{filteredData.length} lançamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cartão Corp.</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{fmt(totalCartao)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
              <TrendingDown className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Solicitações</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{fmt(totalSolicitacao)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <ArrowRightLeft className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {filteredData.length > 0 ? fmt(totalAmount / filteredData.length) : 'R$ 0,00'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Gastos por {groupLabels[groupBy]}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupedData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip content={<GroupedTooltip />} />
                  <Bar dataKey="cartao" name="Cartão Corp." fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} stackId="a" />
                  <Bar dataKey="solicitacao" name="Solicitações" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribuição por Centro de Custo</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    style={{ fontSize: 9 }}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Prévia dos Dados ({filteredData.length} fatias)
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                — lançamentos rateados aparecem em uma linha por categoria
              </span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredData.length === 0} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Baixar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right w-28">Valor</TableHead>
                  <TableHead className="w-20">Empresa</TableHead>
                  <TableHead className="w-16">CC</TableHead>
                  <TableHead className="w-[180px]">Categoria</TableHead>
                  <TableHead className="w-40">Fornecedor</TableHead>
                  <TableHead className="w-24">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 50).map((item, idx) => (
                  <TableRow key={`${item.source}-${item.id}-${item.category}-${idx}`}>
                    <TableCell className="text-xs tabular-nums">{item.date}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{item.description}</span>
                        {item.isAllocated && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1 text-[9px] gap-0.5 border-amber-500/40 text-amber-700 dark:text-amber-400 shrink-0"
                            title={item.allocationLabel}
                          >
                            <Split className="h-2.5 w-2.5" />
                            {item.isPrimary ? 'Princ.' : 'Sec.'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums font-medium">
                      {fmt(item.amount)}
                      {item.isAllocated && (
                        <div className="text-[9px] text-muted-foreground font-normal">
                          de {fmt(item.totalAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{item.company}</TableCell>
                    <TableCell className="text-xs">{item.cost_center}</TableCell>
                    <TableCell className="text-xs w-[180px]">{item.category}</TableCell>
                    <TableCell className="text-xs truncate max-w-[160px]">{item.supplier}</TableCell>
                    <TableCell>
                      <Badge variant={item.source === 'cartao' ? 'default' : 'secondary'} className="text-[10px]">
                        {item.source === 'cartao' ? 'Cartão' : 'Solic.'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      Nenhum registro encontrado para os filtros selecionados
                    </TableCell>
                  </TableRow>
                )}
                {filteredData.length > 50 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-3">
                      Mostrando 50 de {filteredData.length} registros. Exporte para ver todos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
