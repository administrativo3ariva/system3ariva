---
name: Operational Budget Module
description: Gestão Operacional with MONTHLY budget by branch × macrobloco × category, consumption from card+payment requests, no manual entries
type: feature
---
# Módulo Operacional (Gestão Financeira)

## Estrutura
- Posicionado entre "Solic. Pagamento" e "Relatórios" no menu Financeiro.
- Collapsible com 4 telas:
  - Visão Geral (`/financial/operational/overview`)
  - Orçamento (`/financial/operational/budget`)
  - Ajustes de Orçamento (`/financial/operational/adjust`)
  - Despesas Operacionais (`/financial/operational/expenses`) — read-only

## Modelo de dados (MENSAL puro)
- Tabela: `operational_budgets_monthly` com granularidade `(year, month, branch, macrobloco, category)` UNIQUE.
- Cada linha = orçamento de UMA competência mensal específica.
- A tabela antiga `operational_budgets` (anual ÷ 12) foi removida; valores migrados gerando 12 linhas mensais.
- A tabela `operational_expenses` permanece no DB mas NÃO é mais usada (lançamento manual removido).

## Macroblocos (4) e categorias (14)
1. **Suprimentos**: Material de Escritório & TI / Material de Limpeza / Material de Uso & Consumo
2. **Patrimônio e Manutenção**: Eletrodoméstico / Reparo & Manutenção / Bens de Pequeno Valor & Patrimônio Leve
3. **Serviços e Apoio Operacional**: Serviços / Mobilidade & Deslocamento / Logística & Entregas / Assinaturas & Conteúdo
4. **Ocupação e Infraestrutura**: Ocupação Imobiliária / Infraestrutura Predial / Tributos Imobiliários / Seguros Patrimoniais

## Buckets de status (em `buildConsumedList`)
- **realizado**: payment_request `pago` OU expense diferente de pendente/aprovado/rejeitado/cancelado
- **comprometido**: payment_request `pendente`/`aprovado` OU expense `pendente`/`aprovado`
- **cancelado**: status `rejeitado`/`cancelado` (não conta no orçamento)

## Visão Geral
- Filtros: mês (default = mês atual) + filial.
- KPIs: Orçamento do mês, Realizado, Saldo, % Consumido, Comprometido fixo (= orçamento de Ocupação e Infraestrutura), Comprometido (pendente/aprovado), Lançamentos no mês, Categorias estouradas/80%+.
- Gráficos: Evolução mensal (12 meses), Tendência acumulada, Por macrobloco, Por filial OU pizza por categoria (depende do filtro).
- Alertas embutidos: estouradas, 80%+, filiais em risco, sem classificação, categorias com despesa sem orçamento.

## Orçamento (visualização)
- Filtros: mês + filial. Mostra tabela por macrobloco com Orçamento Mensal, Realizado, Saldo, % Consumido. Categoria com despesa mas sem orçamento aparece como "Sem orçamento" warning.

## Ajustes de Orçamento
- Edição manual por (mês + filial + categoria). Ações: Duplicar do mês anterior, Reajuste em lote ±%, Salvar bloco/tudo.
- Bulk upsert via `useBulkUpsertBudget` (onConflict `year,month,branch,macrobloco,category`).

## Despesas Operacionais (read-only)
- SEM lançamento manual. Apenas filtra automaticamente lançamentos cuja categoria pertence aos macroblocos **Serviços e Apoio Operacional** OU **Ocupação e Infraestrutura**.
- Filtros: mês, filial, macrobloco, status, busca textual. Sort por data/valor/filial/categoria.
- Colunas: data, descrição, fornecedor, empresa, filial, CC, macrobloco, categoria, pagamento, origem (Cartão/Solicitação), status, valor.

## Mapeamento de filial
`COST_CENTER_TO_BRANCH` em `lib/operational-utils.ts`. CC `FLO` → filial `FLN` (corrigido conforme spec).
