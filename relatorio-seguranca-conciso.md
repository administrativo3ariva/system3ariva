# Relatório de Segurança Conciso

Fonte: resumo prático de `revisao-seguranca.md`  
Data base da auditoria: 2026-06-03  
Escopo: secrets/env, autenticação/autorização, Supabase RLS e storage, Edge Functions, módulo financeiro, validação de dados, deployment e fluxo de NF com IA.

## Visão geral

Não foram encontrados sinais de exposição direta de `SUPABASE_SERVICE_ROLE_KEY` no frontend, `LOVABLE_API_KEY` em variável pública, source maps publicados no `dist` local ou raw SQL inseguro por concatenação de input.

O principal problema é autorização ampla demais. O sistema usa `profiles.status = 'ativo'` como barreira central, mas isso acaba dando acesso global a muitos módulos. Na prática, qualquer usuário aprovado pode chamar a API Supabase diretamente e operar dados financeiros, estoque, NF, fornecedores, patrimônio e manutenção.

Este relatório organiza os achados em ordem de execução:

1. **P0:** riscos de maior impacto e exploração mais direta.
2. **P1:** correções importantes para integridade e redução de abuso.
3. **P2:** endurecimento operacional e governança.

## P0 - Corrigir primeiro

### 1. RLS ampla demais nas tabelas de negócio

**Onde aparece**

- `supabase/migrations/20260601141558_b16ffcb0-c356-4445-96cb-757db6747803.sql`
- `supabase/migrations/20260601132655_78e56eb1-4f5a-44a0-b1e9-5ffdacba2bac.sql`

**Problema**

Várias policies usam `public.is_ativo()` para permitir leitura, criação, edição e deleção em tabelas como:

- `expenses`
- `payment_requests`
- `nf_uploads`
- `nf_items`
- `products`
- `stock_movements`
- `assets`
- `suppliers`
- `maintenance_tasks`
- `collaborators`
- tabelas operacionais e recorrências

**Impacto**

Um usuário ativo, mesmo sem responsabilidade financeira, administrativa ou de estoque, pode operar dados sensíveis por chamada direta ao Supabase.

**Ação recomendada**

Criar permissões por módulo e ação. `is_ativo()` deve ser apenas pré-condição, não autorização final.

Exemplo de modelo:

- `financial:read`
- `financial:write`
- `financial:approve`
- `financial:delete`
- `stock:read`
- `stock:write`
- `inventory:write`
- `facilities:write`

Depois, substituir policies genéricas por funções como `can_access_module('financial', 'write')`.

**Critério de pronto**

- Nenhuma tabela sensível deve permitir `INSERT`, `UPDATE` ou `DELETE` apenas com `public.is_ativo()`.
- Usuário ativo sem permissão financeira não consegue alterar `expenses` ou `payment_requests`.
- Usuário ativo sem permissão de estoque não consegue alterar `products`, `nf_items` ou `stock_movements`.

### 2. Módulo financeiro depende demais do client

**Onde aparece**

- `src/hooks/use-expenses.ts`
- `src/hooks/use-payment-requests.ts`
- `src/pages/financial/ExpenseForm.tsx`
- `src/pages/financial/PaymentRequestForm.tsx`
- `src/pages/financial/ExpensesList.tsx`
- `src/pages/financial/PaymentRequestsList.tsx`

**Problema**

Operações sensíveis são feitas diretamente pelo navegador:

- marcar solicitação como paga ou pendente;
- criar/editar despesas e solicitações;
- apagar registros financeiros;
- vincular NF a financeiro;
- aceitar valores e rateios validados principalmente na UI.

**Impacto**

Um usuário ativo pode adulterar fluxo de caixa, marcar contas como pagas, apagar evidências financeiras, manipular valores ou vincular NF incorreta.

**Ação recomendada**

Mover operações financeiras críticas para RPC ou Edge Functions:

- `mark-payment-request-paid`
- `cancel-payment-request`
- `archive-payment-request`
- `create-expense`
- `link-nf-to-financial`

Essas funções devem validar permissão, status atual, transição permitida, auditoria, valores e vínculo com NF.

**Critério de pronto**

- A UI não faz `.update({ status })` direto para pagamento.
- Delete financeiro vira soft delete com `deleted_at`, `deleted_by` e motivo.
- Registros pagos/vinculados não podem ser apagados sem permissão elevada.
- Banco possui constraints para `amount > 0` e status permitido.

### 3. Fluxo `process-nf` sem limite server-side suficiente

**Onde aparece**

- `supabase/functions/process-nf/index.ts`
- `src/hooks/use-nf-uploads.ts`
- `src/pages/stock/NfUploadPage.tsx`

**Problema**

A função aceita upload/processamento de NF com validações fortes apenas no client. Faltam:

- rate limit por usuário/IP/unidade;
- cota diária ou mensal;
- limite server-side robusto para `fileDataBase64`;
- limite de download para `fileUrl`;
- validação de MIME real por magic bytes;
- validação rigorosa da saída da IA antes de persistir.

**Impacto**

Conta ativa comprometida ou usuário malicioso pode gerar custo de IA/storage, causar consumo excessivo de memória/CPU, enviar arquivo inválido e gravar dados inconsistentes.

**Ação recomendada**

Antes de chamar IA ou fazer upload:

- validar JWT;
- validar `profiles.status = 'ativo'`;
- aplicar rate limit;
- aplicar cota;
- validar tamanho antes e depois de decode;
- aceitar apenas PDF, PNG, JPEG e WebP confirmados por assinatura;
- restringir `fileUrl` a bucket/path esperado ou remover esse contrato.

Depois da IA:

- validar schema runtime;
- limitar quantidade de itens;
- limitar valores máximos;
- impedir valores negativos;
- reconciliar total da NF com itens/frete/desconto;
- retornar erro genérico ao client e logar detalhes internamente.

**Critério de pronto**

- Payload grande recebe `413`.
- Arquivo com MIME falso recebe `415`.
- Usuário excedendo limite recebe `429`.
- Saída inválida da IA não grava `nf_uploads` nem `nf_items`.

### 4. Storage permite escrita ampla em buckets sensíveis

**Onde aparece**

- `supabase/migrations/20260601142439_d27133f0-48d1-4bb1-b73c-71d5d62a4ba4.sql`
- `supabase/migrations/20260601145336_65b04977-0263-4740-8961-208e86e78a6a.sql`
- `supabase/migrations/20260324144655_c5d3dc4f-cf65-42c0-bba0-47e8aea74040.sql`

**Problema**

Buckets como `nf-files` e `asset-images` permitem upload/update/delete amplo para usuários ativos. O bucket `asset-images` parece ter leitura pública inferida pelas migrations.

**Impacto**

Usuário ativo pode enviar, substituir, ler ou apagar arquivos de NF, comprovantes, boletos e imagens de patrimônio fora do fluxo esperado.

**Ação recomendada**

Restringir policies por:

- módulo;
- path;
- dono;
- entidade vinculada;
- tipo de arquivo;
- operação.

Para documentos sensíveis, preferir upload server-side ou signed upload com path derivado pelo servidor. Para leitura privada, usar signed URLs curtas.

**Critério de pronto**

- Usuário sem permissão financeira não lê comprovantes financeiros.
- Usuário sem permissão de estoque não altera arquivos de NF.
- `asset-images` só fica público se isso for decisão explícita de produto.

## P1 - Corrigir na sequência

### 5. Admin inativo continua autorizado se mantiver role

**Onde aparece**

- `supabase/migrations/20260601135745_bf9d3511-083a-43f0-a1b9-911d0547df53.sql`
- `supabase/functions/admin-delete-user/index.ts`

**Problema**

Policies administrativas usam `has_role(auth.uid(), 'admin')`, mas não exigem que o perfil esteja ativo. A Edge Function `admin-delete-user` segue a mesma lógica.

**Impacto**

Um admin comprometido e depois marcado como inativo pode continuar operando enquanto tiver token válido e role `admin`.

**Ação recomendada**

Criar uma função central, por exemplo `public.is_active_admin()`, e usar em:

- leitura/alteração de `profiles`;
- insert/update/delete de `user_roles`;
- `admin-delete-user`;
- qualquer ação administrativa futura.

**Critério de pronto**

- Admin com `profiles.status != 'ativo'` recebe `403` em operações administrativas.
- Todas as policies admin combinam role + status ativo.

### 6. Mass assignment nos hooks

**Onde aparece**

- `src/hooks/use-products.ts`
- `src/hooks/use-expenses.ts`
- `src/hooks/use-payment-requests.ts`
- `src/hooks/use-nf-uploads.ts`
- `src/hooks/use-maintenance.ts`
- `src/hooks/use-recurring-expenses.ts`

**Problema**

Vários hooks enviam objetos vindos do client com spread ou `as any` diretamente para `.insert()` e `.update()`.

**Impacto**

Campos não previstos pela UI podem ser enviados manualmente e aceitos pelo banco se as policies permitirem.

**Ação recomendada**

Em cada hook de escrita:

- validar input com Zod `.strict()`;
- montar payload allowlistado;
- rejeitar campos extras;
- reforçar com constraints/policies/RPC no servidor.

**Critério de pronto**

- Nenhum hook sensível envia `updates` aberto para Supabase.
- Nenhum insert/update sensível usa `as any` sem validação runtime.

### 7. Aprovação de NF e movimentação de estoque rodam no navegador

**Onde aparece**

- `src/hooks/use-nf-uploads.ts`

**Problema**

O fluxo de aprovação apaga/recria itens, cria produtos, cria movimentações e aprova NF em múltiplas chamadas Supabase independentes.

**Impacto**

Pode ocorrer NF manipulada, estoque inflado, produto indevido ou estado parcial se uma chamada falhar.

**Ação recomendada**

Mover para RPC ou Edge Function transacional, por exemplo `approve-nf`.

A função deve:

- validar permissão;
- carregar NF e itens do banco;
- recalcular valores;
- validar status atual;
- criar movimentos;
- aprovar NF;
- registrar auditoria.

**Critério de pronto**

- Client chama apenas uma operação `approve-nf`.
- Falha no meio do processo não deixa banco parcialmente atualizado.

### 8. CORS aberto e métodos HTTP pouco restritos

**Onde aparece**

- `supabase/functions/process-nf/index.ts`
- `supabase/functions/admin-delete-user/index.ts`

**Problema**

As funções usam `Access-Control-Allow-Origin: *` e não rejeitam explicitamente métodos diferentes de `POST`.

**Impacto**

Em cenário de token vazado, XSS ou extensão maliciosa, qualquer origem consegue interagir com endpoints sensíveis via navegador.

**Ação recomendada**

- Criar allowlist de origens oficiais.
- Tratar previews com regex controlada, se necessário.
- Responder `405` para métodos não suportados.
- Responder `403` para origem não permitida.

**Critério de pronto**

- Origem externa não autorizada recebe `403`.
- `GET`, `PUT`, `DELETE` e outros métodos recebem `405`.

### 9. Erros internos retornados ao cliente

**Onde aparece**

- `supabase/functions/process-nf/index.ts`
- `supabase/functions/admin-delete-user/index.ts`

**Problema**

Mensagens de Supabase, Storage e AI Gateway podem ser repassadas ao usuário.

**Impacto**

Exposição de nomes de buckets, tabelas, detalhes de provedor e comportamento interno.

**Ação recomendada**

Retornar mensagens genéricas ao cliente e enviar detalhes apenas para logs internos.

**Critério de pronto**

- Respostas 500 não exibem `error.message` bruto.
- Logs internos preservam detalhes suficientes para debug.

## P2 - Endurecimento e governança

### 10. `.env` está versionado

**Onde aparece**

- `.env`
- `.gitignore`

**Problema**

O arquivo `.env` está rastreado e `.gitignore` não bloqueia todos os padrões comuns.

**Impacto**

Segredos futuros podem entrar no histórico Git por acidente. Se algum segredo privado já passou pelo arquivo, deve ser considerado comprometido.

**Ação recomendada**

Atualizar `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

Remover do índice:

```bash
git rm --cached .env
```

Criar `.env.example` com placeholders.

**Critério de pronto**

- `.env` não aparece em `git ls-files`.
- `.env.example` existe sem valores reais.

### 11. Ambientes Supabase pouco separados

**Onde aparece**

- `.env`
- `supabase/config.toml`
- `src/integrations/supabase/client.ts`

**Problema**

O repositório não evidencia separação entre produção, preview e desenvolvimento.

**Impacto**

Preview ou ambiente de teste pode operar contra dados reais.

**Ação recomendada**

Configurar variáveis por ambiente no provedor de deploy:

- produção com projeto Supabase de produção;
- preview/staging com projeto próprio;
- desenvolvimento local com Supabase local ou projeto dev.

**Critério de pronto**

- Preview não lê nem grava em banco de produção.
- Redirect URLs do Supabase Auth são restritas aos domínios esperados.

### 12. Headers de segurança não versionados

**Onde aparece**

- Ausência de `vercel.json`, `netlify.toml`, `_headers`, `firebase.json` ou equivalente.

**Problema**

Não há configuração versionada para headers como CSP, HSTS, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`.

**Impacto**

XSS, clickjacking e vazamento de referrer ficam menos mitigados.

**Ação recomendada**

Versionar headers no provedor de deploy. A CSP deve permitir apenas os domínios realmente usados, incluindo Supabase e AI Gateway se aplicável.

**Critério de pronto**

- Produção responde com CSP.
- Produção responde com `Strict-Transport-Security`.
- Aplicação não pode ser embutida em iframe externo.

### 13. Excesso de `select('*')`

**Onde aparece**

- `src/hooks/use-expenses.ts`
- `src/hooks/use-payment-requests.ts`
- `src/hooks/use-suppliers.ts`
- `src/hooks/use-assets.ts`
- `src/hooks/use-recurring-expenses.ts`
- `src/contexts/AuthContext.tsx`

**Problema**

Várias consultas carregam todas as colunas, inclusive dados financeiros, bancários, PIX, boleto e comprovantes.

**Impacto**

Usuários recebem mais dados do que precisam. Isso aumenta o impacto de conta comprometida, XSS e logs acidentais.

**Ação recomendada**

Selecionar colunas por tela. Dados sensíveis devem ser carregados por endpoint/RPC separado com permissão específica.

**Critério de pronto**

- Listagens não carregam dados bancários se não exibirem esses dados.
- Detalhes sensíveis exigem permissão própria.

### 14. Arquivos de teste e build

**Onde aparece**

- `public/test-nf-upload.pdf`
- `dist/test-nf-upload.pdf`
- `package.json`
- `vite.config.ts`

**Problema**

Arquivos em `public/` entram no build. Também existe script `build:dev`, que pode gerar build em modo development se usado por engano.

**Impacto**

Fixture de teste pode ficar pública. Build de desenvolvimento pode incluir instrumentação/metadados desnecessários.

**Ação recomendada**

- Mover fixtures para pasta não publicada.
- Garantir `build.sourcemap = false`.
- Usar build de produção no deploy.
- Evitar configurar provedor com `npm run build:dev`.

**Critério de pronto**

- `test-nf-upload.pdf` não aparece no `dist` de produção.
- Deploy usa `npm run build` ou script equivalente de produção.

## Plano de execução sugerido

### Fase 1 - Bloqueio dos riscos centrais

1. Criar tabela/função de permissões por módulo e ação.
2. Migrar RLS financeira, NF, estoque e storage para permissões específicas.
3. Exigir admin ativo em policies e `admin-delete-user`.
4. Adicionar rate limit, cota e validação de arquivo em `process-nf`.
5. Remover `.env` do Git e criar `.env.example`.

### Fase 2 - Integridade de negócio

1. Mover operações financeiras críticas para RPC/Edge Functions.
2. Mover aprovação de NF/estoque para função transacional.
3. Adicionar constraints de valores, status, datas e limites.
4. Implementar auditoria e soft delete em registros financeiros.
5. Validar saída da IA antes de persistir.

### Fase 3 - Endurecimento operacional

1. Restringir CORS e métodos HTTP.
2. Versionar headers de segurança.
3. Separar Supabase production, preview e development.
4. Reduzir `select('*')`.
5. Mover fixtures para fora de `public/`.
6. Revisar histórico com ferramenta de secrets, como `gitleaks`.

## Consultas para validar o estado real no Supabase

As migrations indicam o estado esperado, mas o ambiente live deve ser confirmado diretamente.

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

```sql
select id, name, public
from storage.buckets
where id in ('nf-files', 'asset-images');
```

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

## Checklist de aceite geral

- [ ] Usuário ativo sem permissão financeira não altera dados financeiros.
- [ ] Usuário ativo sem permissão de estoque não altera NF, produtos ou movimentações.
- [ ] Admin inativo não executa ações administrativas.
- [ ] Upload de NF rejeita arquivo grande ou tipo falso no servidor.
- [ ] `process-nf` tem rate limit e cota.
- [ ] Saída da IA é validada antes de gravar.
- [ ] Operações financeiras críticas não são feitas por update direto do client.
- [ ] Storage restringe documentos por módulo/path/dono.
- [ ] `.env` não está versionado.
- [ ] Produção e preview usam ambientes Supabase separados.
- [ ] Headers de segurança estão versionados no deploy.
- [ ] Listagens não usam `select('*')` para dados sensíveis.

## Pontos positivos já existentes

- `SUPABASE_SERVICE_ROLE_KEY` não foi encontrada no frontend.
- `LOVABLE_API_KEY` é lida via `Deno.env` em Edge Function.
- Edge Functions validam JWT com `supabase.auth.getUser()`.
- `process-nf` valida usuário ativo antes de processar.
- `nf-files` foi tornado privado em migration posterior.
- Tabelas principais aparecem com RLS habilitado nas migrations.
- O projeto já usa Zod em alguns formulários.
- Não foi encontrado raw SQL inseguro com concatenação de input.
- `dist` local não contém source maps.
