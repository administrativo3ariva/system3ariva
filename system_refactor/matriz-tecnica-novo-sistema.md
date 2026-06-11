# Matriz Tecnica Mestre - Novo Sistema Administrativo 3A RIVA

## Finalidade

Este documento e a fonte de verdade inicial para reconstruir o sistema administrativo. Ele consolida o que deve existir no novo sistema, usando como insumos:

- documento de requisitos do projeto;
- telas e fluxos do sistema atual;
- revisao de seguranca do sistema antigo;
- stack aprovada para a nova construcao;
- conhecimento extraido do codigo atual.

## Stack Alvo

- Frontend e backend: Next.js + TypeScript
- Autenticacao: Firebase Auth
- Arquivos: Firebase Storage, baseado em Google Cloud Storage
- Analytics: Firebase Analytics
- Banco relacional: PostgreSQL Neon Free/Launch
- ORM: Prisma
- Deploy: Vercel
- Exibicao corporativa: iframe na intranet

## Principios De Arquitetura

- O frontend nunca deve ser fonte de autoridade para permissao.
- Toda acao sensivel deve passar por validacao server-side.
- Usuario autenticado nao significa usuario autorizado.
- Usuario novo deve nascer pendente/inativo ate liberacao administrativa.
- Arquivos devem ficar no Firebase Storage; o PostgreSQL deve guardar metadados e referencias.
- O PostgreSQL deve ser a fonte de verdade dos dados de negocio.
- O Prisma schema deve documentar entidades e relacionamentos.
- A UI atual serve como referencia, nao como base tecnica obrigatoria.
- O novo sistema deve nascer com auditoria minima para acoes sensiveis.

## Modulos Do Sistema

| Modulo | Objetivo | Telas de referencia no sistema atual | Prioridade |
| --- | --- | --- | --- |
| Autenticacao e Administracao | Login, usuarios, status, papeis e permissoes | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/admin`, `/dashboard` | P0 |
| Estoque | Produtos, entradas, saidas, ajustes, colaboradores e indicadores | `/stock/dashboard`, `/stock/products`, `/stock/movements`, `/stock/collaborators`, `/stock/indicators` | P1 |
| Notas Fiscais/OCR | Upload, processamento, revisao, aprovacao e entrada em estoque | `/stock/nf-upload` | P1 |
| Financeiro | Despesas, solicitacoes, relatorios e status financeiro | `/financial/dashboard`, `/financial/expenses`, `/financial/expenses/new`, `/financial/requests`, `/financial/requests/new`, `/financial/reports` | P1 |
| Orcamento Operacional | Orcamento mensal por filial, macrobloco, categoria e consumo | `/financial/operational/overview`, `/financial/operational/budget`, `/financial/operational/adjust`, `/financial/operational/expenses` | P1 |
| Inventario Patrimonial | Cadastro, listagem, localizacao, fotos e status de bens | `/inventory/dashboard`, `/inventory/list`, `/inventory/register`, `/inventory/branches` | P2 |
| Facilities | Tarefas, calendario, kanban, desempenho e manutencoes | `/facilities/dashboard`, `/facilities/calendar`, `/facilities/kanban`, `/facilities/performance` | P2 |
| Dashboards e Relatorios | Indicadores consolidados e visoes executivas | dashboards de cada modulo | P2 |
| Auditoria e Governanca | Rastreabilidade de acoes sensiveis | nao tratado de forma centralizada no sistema atual | P0 |

## Entidades Principais

| Entidade | Descricao | Modulos relacionados |
| --- | --- | --- |
| User | Usuario interno sincronizado com Firebase Auth | Auth, Admin, Auditoria |
| Role | Papel de alto nivel, como admin, moderator e user | Auth, Admin |
| Permission | Permissao granular por modulo e acao | Auth, Admin, todos |
| UserPermission | Vinculo entre usuario, modulo e permissao | Auth, Admin |
| Branch | Filial/unidade/cost center operacional | Estoque, Financeiro, Patrimonio, Facilities |
| Department | Area/departamento interno | Estoque, Admin, Auditoria |
| Supplier | Fornecedor | NF, Estoque, Financeiro |
| FileObject | Metadados de arquivo armazenado no Firebase Storage | NF, Financeiro, Patrimonio, Facilities |
| Product | Item controlado em estoque | Estoque, NF |
| ProductCategory | Categoria de produto | Estoque, NF, Financeiro |
| StockMovement | Entrada, saida ou ajuste de estoque | Estoque, NF |
| Collaborator | Colaborador/beneficiario associado a unidade/departamento | Estoque |
| Invoice | Nota fiscal processada | NF, Estoque, Financeiro |
| InvoiceItem | Item extraido ou revisado da NF | NF, Estoque |
| Expense | Despesa financeira | Financeiro, Orcamento |
| PaymentRequest | Solicitacao de pagamento | Financeiro, Orcamento |
| OperationalBudget | Orcamento por ano, mes, filial, macrobloco e categoria | Orcamento |
| RecurringExpense | Despesa recorrente programada | Financeiro, Orcamento |
| Asset | Bem patrimonial | Patrimonio |
| FacilityTask | Tarefa ou manutencao de facilities | Facilities |
| AuditLog | Registro de acao sensivel | Todos |

## Relacionamentos-Chave

- `User` 1:N `AuditLog`
- `User` 1:N `FileObject`
- `User` N:N `Role`
- `User` N:N `Permission`
- `Branch` 1:N `Product`
- `Branch` 1:N `StockMovement`
- `Branch` 1:N `Expense`
- `Branch` 1:N `PaymentRequest`
- `Branch` 1:N `Asset`
- `Branch` 1:N `FacilityTask`
- `Supplier` 1:N `Invoice`
- `Supplier` 1:N `Expense`
- `Invoice` 1:N `InvoiceItem`
- `Invoice` 1:N `FileObject`
- `Invoice` 1:N `StockMovement`
- `Product` 1:N `InvoiceItem`
- `Product` 1:N `StockMovement`
- `Expense` 1:N `FileObject`
- `PaymentRequest` 1:N `FileObject`
- `Asset` 1:N `FileObject`
- `FacilityTask` 1:N `FileObject`

## Papeis E Permissoes

### Papeis iniciais

| Papel | Descricao |
| --- | --- |
| admin | Administra usuarios, permissoes, configuracoes e dados sensiveis |
| moderator | Opera modulos autorizados e aprova fluxos especificos |
| user | Acessa apenas telas e acoes explicitamente liberadas |

### Permissoes granulares sugeridas

| Modulo | Permissoes |
| --- | --- |
| admin | `admin:read`, `admin:write`, `admin:users`, `admin:permissions` |
| stock | `stock:read`, `stock:write`, `stock:approve`, `stock:delete` |
| nf | `nf:read`, `nf:upload`, `nf:review`, `nf:approve`, `nf:delete` |
| financial | `financial:read`, `financial:write`, `financial:approve`, `financial:pay`, `financial:delete` |
| budget | `budget:read`, `budget:write`, `budget:approve` |
| inventory | `inventory:read`, `inventory:write`, `inventory:delete` |
| facilities | `facilities:read`, `facilities:write`, `facilities:approve`, `facilities:delete` |
| reports | `reports:read`, `reports:export` |

## Regras De Seguranca Obrigatorias

- Nenhuma rota operacional deve ser acessivel sem Firebase Auth.
- Nenhuma rota operacional deve aceitar usuario sem perfil interno ativo.
- Nenhuma acao de escrita deve confiar apenas no frontend.
- APIs/server actions devem validar usuario, status e permissao.
- Arquivos privados devem ser lidos por fluxo autorizado, preferencialmente URL assinada curta.
- Upload deve validar tamanho, tipo declarado e assinatura real do arquivo quando aplicavel.
- Operacoes destrutivas devem exigir permissao elevada e gerar auditoria.
- Deletes financeiros e de documentos devem ser soft delete quando houver impacto de rastreabilidade.
- Dados financeiros, NF e permissao de usuario nunca devem depender de regra visual da tela.
- Erros tecnicos nao devem ser expostos ao usuario final.
- Logs devem guardar detalhes internos sem vazar segredo.

## Fluxos Criticos

### Login e liberacao de usuario

1. Usuario autentica via Firebase Auth.
2. Backend verifica se existe `User` interno vinculado ao Firebase UID.
3. Se nao existir, cria registro com status `pending`.
4. Usuario pendente nao acessa modulos operacionais.
5. Admin ativo libera usuario, atribui role e permissoes.
6. Acao fica registrada em `AuditLog`.

### Upload e processamento de NF

1. Usuario autorizado envia arquivo.
2. Backend valida permissao `nf:upload`.
3. Arquivo e salvo no Firebase Storage em path privado.
4. Metadados sao salvos em `FileObject`.
5. Processo OCR/IA extrai dados.
6. Saida e validada em schema runtime.
7. `Invoice` e `InvoiceItem` sao criados com status de revisao.
8. Usuario com `nf:review` ajusta dados se necessario.
9. Usuario com `nf:approve` aprova.
10. Aprovacao gera entradas de estoque e possiveis vinculos financeiros.

### Entrada, saida e ajuste de estoque

1. Entrada pode vir de NF aprovada ou lancamento manual autorizado.
2. Saida exige produto, quantidade, unidade, responsavel/motivo quando aplicavel.
3. Ajuste exige permissao elevada e auditoria.
4. Saldo deve ser derivado ou atualizado de forma transacional.

### Fluxo financeiro

1. Usuario autorizado cria despesa ou solicitacao.
2. Backend valida permissao, valor, categoria, filial e anexos.
3. Mudancas de status seguem transicoes permitidas.
4. Marcar como pago exige permissao especifica.
5. Exclusao deve preservar rastreabilidade.
6. Consumo orcamentario deve usar data e classificacao oficiais do requisito.

### Orcamento operacional

1. Admin/moderator autorizado define budget por ano, mes, filial, macrobloco e categoria.
2. Despesas e solicitacoes consomem orcamento conforme regra de categoria.
3. Categorias nao orcamentarias devem aparecer em relatorios, mas nao consumir budget.
4. Alteracoes em budget geram auditoria.

### Facilities

1. Usuario autorizado cria tarefa/manutencao.
2. Tarefa segue status padronizados.
3. Recorrencia preventiva gera proximas ocorrencias conforme categoria.
4. Custos estimado e real alimentam indicadores.

## Criterios De Aceite Por Modulo

| Modulo | Criterios minimos |
| --- | --- |
| Auth/Admin | Usuario pendente bloqueado; usuario inativo bloqueado; admin ativo gerencia usuarios; permissoes validadas no backend |
| Estoque | CRUD de produtos; movimentos com saldo correto; ajuste auditado; filtros por filial |
| NF/OCR | Upload privado; processamento validado; revisao antes de aprovar; aprovacao gera movimentos; erro tecnico nao vaza |
| Financeiro | Criar despesas/solicitacoes; transicoes de status controladas; anexos privados; soft delete; auditoria |
| Orcamento | Budget mensal; consumo por filial/macrobloco/categoria; categorias nao orcamentarias tratadas corretamente |
| Patrimonio | Cadastro/listagem; fotos privadas ou autorizadas; localizacao; historico basico |
| Facilities | Tarefas por status; calendario/kanban; recorrencia; indicadores |
| Dashboards | Indicadores batem com dados-fonte; filtros por periodo/filial/status |
| Auditoria | Acoes sensiveis registram ator, entidade, acao, timestamp e contexto |

## Dependencias Entre Modulos

| Modulo | Depende de |
| --- | --- |
| Auth/Admin | Fundacao Next.js, Firebase Auth, Prisma, Neon |
| Storage | Auth/Admin |
| NF/OCR | Auth/Admin, Storage, Fornecedores, Produtos |
| Estoque | Auth/Admin, Produtos, Filiais |
| Financeiro | Auth/Admin, Fornecedores, Storage |
| Orcamento | Financeiro, Filiais, Categorias |
| Patrimonio | Auth/Admin, Storage, Filiais |
| Facilities | Auth/Admin, Storage, Filiais |
| Dashboards | Modulos operacionais com dados reais |
| Auditoria | Deve existir desde a fundacao |

## Ordem De Implementacao

1. Fundacao Next.js, TypeScript, Prisma, Neon, Firebase e Vercel.
2. Auth/Admin com usuarios, status, roles e permissoes.
3. Auditoria minima.
4. Storage seguro.
5. Cadastros estruturais: filiais, fornecedores, categorias.
6. NF/OCR com revisao.
7. Estoque.
8. Financeiro.
9. Orcamento operacional.
10. Patrimonio.
11. Facilities.
12. Dashboards e relatorios.
13. Hardening final e homologacao.

## Insumos Pendentes Para Completar

- Prints finais das telas atuais.
- Confirmacao de perfis reais da area de negocio.
- Confirmacao das filiais/unidades ativas.
- Confirmacao das categorias financeiras oficiais.
- Decisao sobre IA/OCR provider.
- Decisao sobre politica de retencao de arquivos.
- Definicao de quais relatorios precisam exportacao.

