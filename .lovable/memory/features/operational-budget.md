---
name: Operational Budget Module
description: Gestão Operacional with budget by branch × macrobloco × category, annual/12 split, consumption from card+paid requests+own entries
type: feature
---
# Módulo Operacional (Gestão Financeira)

## Estrutura
- Posicionado entre "Solicitações de Pagamento" e "Relatórios" no menu Financeiro.
- Collapsible com 4 telas:
  - Visão Geral (`/financial/operational/overview`)
  - Orçamento (`/financial/operational/budget`)
  - Ajustes de Orçamento (`/financial/operational/adjust`)
  - Despesas Operacionais (`/financial/operational/expenses`)

## Orçamento
- Granularidade: **Filial × Macrobloco × Categoria** (ano = 2026, configurável depois).
- Tabela: `operational_budgets`. Annual amount divide automaticamente em 12 colunas (jan_amount..dec_amount).

## Macroblocos (4) e categorias (14)
1. **Suprimentos**: Material de Escritório & TI / Material de Limpeza / Material de Uso & Consumo
2. **Patrimônio e Manutenção**: Eletrodoméstico / Reparo & Manutenção / Bens de Pequeno Valor & Patrimônio Leve
3. **Serviços e Apoio Operacional**: Serviços / Mobilidade & Deslocamento / Logística & Entregas / Assinaturas & Conteúdo
4. **Ocupação e Infraestrutura**: Ocupação Imobiliária / Infraestrutura Predial / Tributos Imobiliários / Seguros Patrimoniais

## Consumo do orçamento
Soma 3 fontes (via `buildConsumedList` em `lib/operational-utils.ts`):
- Despesas de cartão corporativo (`expenses`)
- Solicitações de pagamento com status `pago`
- Lançamentos próprios da tabela `operational_expenses`

CC do financeiro mapeia para filial via `COST_CENTER_TO_BRANCH` (BH→BH-Matriz etc).
Categorias fora do catálogo aparecem na seção "Sem Classificação" da Visão Geral.

## Tabelas
- `operational_budgets`: branch, macrobloco, category, year, annual_amount + 12 mensais, UNIQUE(branch,macrobloco,category,year)
- `operational_expenses`: description, amount, branch, macrobloco, category, expense_date, supplier, notes, receipt_url
