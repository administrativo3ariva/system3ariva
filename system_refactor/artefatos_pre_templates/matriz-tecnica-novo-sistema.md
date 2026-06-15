# Matriz Tecnica Mestre - Novo Sistema Administrativo 3A RIVA

## Finalidade

Este documento e a fonte de verdade inicial para reconstruir o sistema administrativo. Ele consolida o que deve existir no novo sistema, usando como insumos:

- documento de requisitos do projeto;
- telas e fluxos do sistema atual;
- revisao de seguranca do sistema antigo;
- stack aprovada para a nova construcao;
- conhecimento extraido do codigo atual.

## Status Da Matriz

Versao atual: `0.3 - matriz tecnica com security by design`.

Esta matriz comecou como rascunho tecnico inicial e foi enriquecida por varreduras especializadas no codigo antigo:

- Auth/Admin/Seguranca;
- Estoque e NF/OCR;
- Financeiro e Orcamento Operacional;
- Inventario Patrimonial e Facilities;
- Banco, entidades e contratos de dados.

A matriz ainda deve receber:

- prints finais das telas;
- validacao do documento de requisitos por modulo;
- confirmacao das permissoes reais da area de negocio;
- refinamento final do futuro `schema.prisma`.

## Objetivo De Seguranca Do Novo Sistema

O novo sistema deve nascer seguro por desenho, nao apenas corrigir falhas do sistema antigo. A seguranca deve ser tratada como requisito arquitetural desde a fundacao.

Objetivos obrigatorios:

- impedir acesso publico a qualquer recurso operacional;
- autenticar identidade com Firebase Auth;
- autorizar acesso no backend com base em usuario interno, status, papel, permissao e escopo;
- tratar middleware e guards visuais apenas como conveniencia de UX, nunca como unica barreira;
- validar autenticacao, autorizacao e input em toda Server Action, Route Handler e funcao de acesso a dados;
- impedir que usuario pendente, inativo ou sem perfil interno acesse rotas, APIs, arquivos ou dados;
- impedir que um usuario ativo opere modulos sem permissao explicita;
- proteger documentos, NFs, boletos, comprovantes e imagens no Firebase Storage;
- registrar auditoria de acoes administrativas, financeiras, patrimoniais, estoque, NF e facilities;
- evitar vazamento de detalhes tecnicos, tokens, dados bancarios, documentos ou logs sensiveis;
- manter consistencia e rastreabilidade mesmo quando houver erro parcial, retry ou clique duplicado.

## Modelo De Autorizacao Para Neon + Prisma

O documento de requisitos original menciona Row Level Security. Como a stack aprovada usa Neon PostgreSQL com Prisma, a expectativa deve ser traduzida para um modelo equivalente de seguranca:

- PostgreSQL/Neon e a fonte de verdade dos dados.
- Prisma e a camada padrao de acesso ao banco.
- Toda consulta ou mutation sensivel deve passar por uma camada server-side de autorizacao.
- A autorizacao deve verificar usuario autenticado, status ativo, permissao de modulo, acao e escopo por filial quando aplicavel.
- Nenhuma mutation deve aceitar `userId`, `role`, `status`, `createdBy` ou `updatedBy` vindo cegamente do client.
- Campos de autoria devem ser definidos pelo servidor.
- Constraints do banco devem complementar a seguranca: valores positivos, status permitidos, unicidade, FKs e integridade referencial.
- Se forem usadas policies nativas no Postgres/Neon futuramente, elas devem reforcar o modelo, nao substituir validacao no backend.

Padrao esperado em toda operacao server-side:

1. validar input com schema runtime;
2. validar token/sessao Firebase no servidor;
3. buscar usuario interno no PostgreSQL;
4. bloquear usuario ausente, pendente ou inativo;
5. validar permissao de modulo e acao;
6. validar escopo da entidade, como filial, dono ou vinculo;
7. executar operacao com Prisma;
8. registrar auditoria quando a acao for sensivel.

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

## Achados Dos Agentes Por Modulo

### Auth/Admin/Seguranca

Fluxos identificados:

- login com e-mail/senha e Google OAuth;
- cadastro de usuario com aprovacao posterior;
- recuperacao e redefinicao de senha;
- dashboard pos-login;
- painel admin para aprovar e remover usuarios.

Regras confirmadas:

- usuario novo deve nascer `pending`;
- usuario `pending` ou `inactive` nao acessa rotas nem APIs operacionais;
- admin pode aprovar/inativar/remover usuarios, mas nao deve excluir a propria conta;
- menu e rota protegida sao apenas UX; seguranca real deve estar no backend.

Decisao para o novo sistema:

- Firebase Auth identifica o usuario;
- PostgreSQL guarda perfil, status, roles e permissoes;
- backend Next.js valida token, status e permissao antes de qualquer acao Prisma.

### Estoque E NF/OCR

Fluxos identificados:

- CRUD de produtos por filial;
- movimentacoes de entrada, saida e ajuste;
- saida com responsavel;
- upload de NF;
- processamento IA/OCR;
- revisao manual de itens;
- aprovacao da NF com geracao de entrada em estoque;
- redirecionamento para financeiro.

Regras confirmadas:

- NF nasce pendente;
- itens precisam ser revisados antes da aprovacao;
- todos os itens precisam de categoria antes de aprovar;
- cidade divergente da filial exige confirmacao;
- produto abaixo do estoque minimo gera alerta;
- frete fiscal e taxas operacionais devem ser tratados separadamente.

Decisoes para o novo sistema:

- aprovacao de NF deve ser uma transacao backend;
- `StockMovement` deve se vincular explicitamente a NF/item quando origem for NF;
- responsavel de saida deve ser `collaborator_id`, nao texto livre;
- produto com historico deve ser inativado, nao excluido fisicamente;
- saldo precisa ser reconciliavel pelos movimentos;
- OCR/IA deve ter limite de tamanho, tipo, rate limit e schema runtime.

### Financeiro E Orcamento Operacional

Fluxos identificados:

- despesas de cartao corporativo;
- solicitacoes de pagamento;
- fornecedores e dados de pagamento;
- anexos financeiros;
- dashboard financeiro;
- relatorios com exportacao XLSX;
- orcamento mensal por filial, macrobloco e categoria;
- despesas recorrentes;
- consumo orcamentario consolidando despesas e solicitacoes.

Regras confirmadas:

- despesa de cartao conta como realizado, exceto rejeitada/cancelada;
- solicitacao paga conta como realizado;
- solicitacao pendente/aprovada conta como comprometido;
- `request_date` e a data oficial da solicitacao;
- `Compras TI` nao consome orcamento operacional;
- orcamento tem unicidade por ano, mes, filial, macrobloco e categoria;
- rateio nao pode ultrapassar o total.

Decisoes para o novo sistema:

- regra de consumo orcamentario deve viver em uma camada unica no backend;
- status financeiro nao pode ser alterado diretamente pelo client;
- marcar como pago exige permissao especifica;
- anexos financeiros devem usar Storage privado;
- rateios devem ser normalizados ou rigidamente validados;
- recorrencias devem ser geradas de forma idempotente no backend;
- exclusoes financeiras devem ser soft delete com auditoria.

### Inventario Patrimonial

Fluxos identificados:

- dashboard patrimonial;
- cadastro de bem;
- listagem em tabela/grid;
- edicao em painel;
- acompanhamento por filial;
- marcacao de item inventariado;
- imagem/anexo do bem.

Regras confirmadas:

- codigo patrimonial atual e gerado no frontend;
- `total_price = quantity * unit_price`;
- item nasce como nao inventariado;
- condicao padrao atual e `Bom`;
- imagem atual aceita upload ou URL manual.

Decisoes para o novo sistema:

- codigo patrimonial deve ser gerado no servidor com unicidade por filial;
- total deve ser calculado/validado no backend;
- imagem deve ficar em Storage privado;
- conferencia deve registrar usuario e data;
- exclusao deve virar baixa/inativacao com motivo;
- patrimonio deve poder se relacionar com fornecedor, NF, responsavel, anexos e historico.

### Facilities

Fluxos identificados:

- dashboard de manutencoes;
- calendario;
- kanban operacional;
- criacao/edicao/exclusao de manutencao;
- avancar/reabrir status;
- recorrencia automatica;
- desempenho por prazo, categoria, filial e tipo.

Regras confirmadas:

- status: `todo`, `approval`, `in_progress`, `done`;
- prioridade: `baixa`, `media`, `alta`, `urgente`;
- tipo: `preventiva` ou `corretiva`;
- algumas categorias possuem recorrencia padrao;
- ao finalizar tarefa recorrente, sistema cria proxima ocorrencia.

Decisoes para o novo sistema:

- mudanca de status deve ser validada no backend;
- recorrencia deve ser idempotente e server-side;
- custos precisam validar valor nao negativo;
- exclusao deve preservar historico;
- tarefa pode se vincular a patrimonio, fornecedor, solicitante, responsavel e anexos;
- filtros por filial devem respeitar permissao no backend.

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

## Entidades Recomendadas Pelos Agentes

### Auth/Admin

- `User`
- `UserProfile`
- `Role`
- `Permission`
- `UserRole`
- `UserPermission`
- `UserBranchPermission`
- `AuditLog`

### Estoque E NF

- `Product`
- `ProductCategory`
- `StockMovement`
- `StockMovementItem`
- `Invoice`
- `InvoiceItem`
- `InvoiceApproval`
- `Supplier`
- `Collaborator`
- `FinancialDraft` ou `FinancialLink`

### Financeiro E Orcamento

- `Expense`
- `PaymentRequest`
- `PaymentStatusHistory`
- `Supplier`
- `FinancialAttachment`
- `ExpenseAllocation`
- `OperationalBudget`
- `RecurringExpense`
- `RecurringExpenseRun`
- `BudgetConsumptionView` ou servico de calculo backend

### Inventario

- `Asset`
- `AssetAttachment`
- `AssetInventoryCheck`
- `AssetStatusHistory`
- `AssetMovement`

### Facilities

- `MaintenanceTask`
- `MaintenanceTaskHistory`
- `MaintenanceTaskAttachment`
- `MaintenanceRecurrenceRule`
- `MaintenanceCategory`

## Observacoes Sobre O Modelo Antigo

O modelo atual possui algumas relacoes formais, mas muitos vinculos importantes estao em texto livre, URL solta ou fluxo de tela.

Relacoes formais identificadas:

- `expenses.supplier_id -> suppliers.id`
- `payment_requests.supplier_id -> suppliers.id`
- `recurring_expense_runs.recurring_expense_id -> recurring_expenses.id`
- `stock_movements.product_id -> products.id`
- `nf_items.nf_upload_id -> nf_uploads.id`

Lacunas que o novo `schema.prisma` deve corrigir:

- NF aprovada precisa se vincular formalmente a produtos, movimentos de estoque e eventual financeiro.
- Movimentacao de estoque deve registrar origem, usuario, filial, responsavel e motivo de forma estruturada.
- Saida de estoque deve referenciar colaborador por ID, nao por nome em texto.
- Fornecedor deve ser uma entidade compartilhada entre NF, financeiro, patrimonio e facilities.
- Anexos devem usar entidade `FileObject`, nao URLs soltas em cada tabela.
- Filiais, categorias, macroblocos e centros de custo devem ser catalogos controlados.
- Rateios financeiros devem ser normalizados ou ter validacao forte de soma/consistencia.
- Recorrencias precisam de chave/idempotencia para evitar duplicidade.
- Patrimonio precisa de historico de status, conferencia, baixa e movimentacao.
- Facilities precisa de historico de status e vinculos com patrimonio, fornecedor, responsavel e anexos.

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
- Middleware Next.js, layouts protegidos e guards client-side nao sao suficientes como controle de seguranca.
- Toda Server Action, Route Handler e funcao de dados deve autenticar, autorizar e validar input.
- APIs/server actions devem validar usuario, status e permissao.
- Arquivos privados devem ser lidos por fluxo autorizado, preferencialmente URL assinada curta.
- Upload deve validar tamanho, tipo declarado e assinatura real do arquivo quando aplicavel.
- Operacoes destrutivas devem exigir permissao elevada e gerar auditoria.
- Deletes financeiros e de documentos devem ser soft delete quando houver impacto de rastreabilidade.
- Dados financeiros, NF e permissao de usuario nunca devem depender de regra visual da tela.
- Erros tecnicos nao devem ser expostos ao usuario final.
- Logs devem guardar detalhes internos sem vazar segredo.
- Texto extraido de NF/OCR deve ser tratado como dado nao confiavel para evitar prompt injection.
- Dados pessoais devem seguir minimizacao, necessidade de acesso e revisao periodica de permissoes.
- Integracao por iframe deve restringir dominios permitidos por headers e configuracao de deploy.

## Requisitos Nao Funcionais Incorporados

| Tema | Requisito |
| --- | --- |
| Autenticacao | 100% das rotas privadas exigem login e usuario interno ativo |
| Autorizacao | Permissoes por modulo, acao e escopo, validadas no backend |
| Integridade financeira | Valores monetarios com precisao decimal e exibicao em BRL com duas casas |
| Quantidades | KG com tres casas decimais; demais unidades com duas casas |
| Auditoria | `created_at`, `updated_at`, autoria e historico para acoes criticas |
| Estoque | Saldo consistente por movimentacoes, sem edicao manual livre |
| NF/OCR | Processamento server-side, credenciais protegidas e validacao da saida |
| UI segura | AlertDialog customizado em acoes destrutivas; proibido `alert`/`confirm` nativos |
| Design | Tema escuro SaaS com identidade navy/dourada e tokens semanticos |
| Relatorios | Exportacao financeira em Excel com abas, filtros e formatacao |
| Performance | Listagens e dashboards devem responder em ate 3 segundos no volume padrao de homologacao |
| Compatibilidade | Chrome, Edge e Firefox atuais |
| LGPD minima | Coleta limitada, acesso restrito, rastreabilidade e revisao periodica de acessos |
| Iframe | Compatibilidade com intranet e politica explicita de `frame-ancestors` |

## Rastreabilidade De Requisitos

| Origem | Cobertura na matriz |
| --- | --- |
| RN-001/RNF-001 - nenhum recurso publico | Objetivo de seguranca, Auth/Admin, Storage e Regras de Seguranca |
| RN-002/RF-003/RF-004 - usuario novo inativo/pendente | Fluxo de login e liberacao de usuario |
| RN-003/RN-004/RF-005/RF-007 - papeis e permissoes | Papeis, permissoes granulares e modelo de autorizacao backend |
| RN-005/RNF-002/RNF-003 - seguranca de dados | Traduzido para Neon + Prisma com autorizacao server-side e constraints |
| RN-006/RF-008/RF-010/RNF-018 - saldo de estoque | Fluxo de estoque e criterios de aceite de movimentacoes |
| RN-007/RF-009 - movimentacoes de estoque | Entidades `StockMovement`, `StockMovementItem`, auditoria e origem |
| RN-008/RF-011/RF-012/RF-014/RNF-014 - NF/OCR | Fluxo de upload, JSON extraido, itens e revisao |
| RN-009/RF-013 - validacao total NF | Decisoes NF/OCR e checklist de validacao |
| RN-010/RF-015 - vinculo NF financeiro | Relacionamentos e entidades `FinancialLink`/`FinancialDraft` |
| RN-011/RN-012/RF-016/RF-017 - colaboradores/localizacao | Entidade `Collaborator`, filial, andar e localizacao |
| RN-013/RN-014/RF-018/RF-020 - patrimonio | Entidades de patrimonio, historico, conferencia e baixa |
| RN-015/RF-021/RF-024 - financeiro | Fluxo financeiro, status e cadastros estruturais |
| RN-016/RF-025/RNF-020 - `request_date` | Regras de financeiro e consumo orcamentario |
| RN-017/RN-018/RF-027 - orcamento | Orcamento mensal e servico unico de consumo |
| RN-019/RF-028/RF-029 - recorrencias financeiras | Entidades `RecurringExpense` e `RecurringExpenseRun` idempotentes |
| RN-020/RN-021/RF-030/RF-033 - facilities | Fluxo de facilities e recorrencia server-side |
| RN-022 - sem custo por usuario em facilities | Deve permanecer como restricao de produto do modulo Facilities |
| RN-023/RN-024/RF-036/RNF-009/RNF-010 - acoes destrutivas | UI segura e criterios de homologacao |
| RN-025/RN-026/RNF-004/RNF-005/RNF-006 - formatos numericos | Requisitos nao funcionais incorporados |
| RN-027/RNF-019 - indicadores sem distorcao | Dashboards e criterios analiticos |
| RN-028/RNF-011/RNF-012/RNF-013 - auditoria | Auditoria e Governanca como modulo P0 |

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
