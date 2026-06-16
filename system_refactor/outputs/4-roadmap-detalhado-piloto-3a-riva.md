# Roadmap Detalhado - Piloto 3A RIVA

Este e o artefato do Portao 4 do framework SDD aplicado ao piloto de reconstrucao do Sistema Administrativo 3A RIVA. Cada subetapa abaixo deve poder virar issue, PRD ou execucao delegada para agente.

Regra de ouro: criterios de aceite e testes travados nao podem ser removidos ou enfraquecidos pelo agente executor. Se algum criterio estiver incorreto, o agente deve escalar para revisao humana.

## 1. Metadados E Status

| Campo | Valor |
| --- | --- |
| Projeto | Reconstrucao do Sistema Administrativo 3A RIVA (piloto SDD) |
| Escopo | `global` |
| Area solicitante | Administrativo 3A RIVA, com apoio de TI/Seguranca |
| Responsavel por travar criterios | PENDENTE |
| Responsavel tecnico | PENDENTE |
| Status | `Rascunho` |
| Versao | `v0.1` |
| Data | 2026-06-16 |
| Baseado na Matriz Tecnica | `system_refactor/outputs/1-matriz-tecnica-piloto-3a-riva.md` v0.3 |
| Baseado no Roadmap Macro | `system_refactor/outputs/2-roadmap-macro-piloto-3a-riva.md` v0.1 |
| Baseado no Design Tecnico | `system_refactor/outputs/3-design-tecnico-piloto-3a-riva.md` v0.1 |
| Artefato anterior | Design Tecnico |
| Artefato seguinte | Issues/PRDs/Execucao |

## 2. Legenda De Gates

- `AUTO`: CI verde + testes travados + verificacoes automaticas.
- `HUMANO`: exige sign-off humano mesmo com CI verde.
- `BLOQUEADO`: depende de decisao, input, credencial, ambiente ou revisao.

Gates humanos obrigatorios quando a subetapa tocar auth/autorizacao, segredos, dados pessoais, dados financeiros, storage privado, migrations destrutivas, permissoes/papeis, integracao externa sensivel, exclusao, cancelamento ou baixa.

## 3. Visao De Etapas

| Etapa Macro | Objetivo | Design tecnico relacionado | Gate padrao | Status |
| --- | --- | --- | --- | --- |
| E1 | Fundacao tecnica e seguranca base | Sec. 3, 4, 7, 8, 11, 12, 15, 16 | HUMANO | Pendente |
| E2 | Cadastros estruturais e modelo comum | Sec. 5, 6, 9, 10 | HUMANO | Pendente |
| E3 | Estoque | Sec. 5, 7, 8, 9, 11 | HUMANO | Pendente |
| E4 | NF/OCR | Sec. 8, 9, 10, 11, 14 | HUMANO | Pendente |
| E5 | Financeiro | Sec. 5, 7, 8, 9, 11 | HUMANO | Pendente |
| E6 | Orcamento operacional | Sec. 5, 8, 9, 11 | HUMANO | Pendente |
| E7 | Inventario patrimonial | Sec. 5, 8, 10, 11 | HUMANO | Pendente |
| E8 | Facilities | Sec. 5, 8, 9, 11 | HUMANO | Pendente |
| E9 | Dashboards, relatorios e exportacoes | Sec. 8, 11, 13, 15 | HUMANO | Pendente |
| E10 | Homologacao, hardening e go-live | Sec. 15, 16, 18, 19 | HUMANO | Pendente |

## 4. Subetapas

### Subetapa E1.S1 - Fechar ADRs P0 De Stack, Banco E Auth - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E1 |
| Objetivo | Formalizar stack, provedor Postgres, Google SSO e autorizacao backend antes de migrations reais. |
| Design tecnico de referencia | Sec. 3, 17, 18 |
| PRD | `outputs/prds/PRD-E1-S1-adrs-p0.md` |
| Execucao | agente de planejamento + responsavel tecnico |
| Status | Pendente |

#### Escopo

- Criar ADRs P0 para stack, provedor Postgres, backend authorization, Google SSO e storage privado.
- Registrar se o banco final sera Supabase Postgres ou Railway Postgres.
- Confirmar que Firebase Auth/Storage permanecem fora do Supabase/Railway.

#### Fora De Escopo

- Implementar app ou banco.
- Criar schema Prisma final.

#### Dependencias

- Matriz v0.3 e validacao tecnica da stack.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | alto | Define auth/autorizacao |
| Dados/migration | medio | Define provedor do banco |
| UX | baixo | Afeta login |
| Integracao | medio | Firebase, Vercel e Postgres |

#### Criterios De Aceite Travados

- [ ] ADR de provedor Postgres registra decisao, motivo, custo e alternativa descartada.
- [ ] ADR de autorizacao confirma backend authorization como controle primario.
- [ ] ADR de auth confirma Google SSO e usuario interno `pending/inactive/active`.
- [ ] ADR de storage confirma arquivos privados por padrao e sem URL publica permanente.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Manual | Revisao dos ADRs P0 | Decisoes nao contradizem matriz | - | sim |
| Security | Checklist de decisoes seguras | Auth, storage, segredos e banco foram tratados | Agente/desenvolvedor subindo segredo | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Decisoes de arquitetura e seguranca |
| Evidencia exigida | ADRs revisados |
| Aprovador humano, se aplicavel | Responsavel tecnico/TI |

#### Rollback Ou Reversao

- Se a decisao de banco mudar, atualizar matriz/design/roadmap antes de implementar migrations.

#### Definition Of Done

- [ ] ADRs criados.
- [ ] Decisao de banco registrada.
- [ ] Nenhuma decisao contradiz a matriz.
- [ ] Gate humano concluido.

### Subetapa E1.S2 - Bootstrap Do App E Padroes De Qualidade - AUTO

| Campo | Valor |
| --- | --- |
| Etapa macro | E1 |
| Objetivo | Criar base Next.js/TypeScript com padroes de lint, typecheck, env e estrutura modular. |
| Design tecnico de referencia | Sec. 4, 13, 15 |
| PRD | `outputs/prds/PRD-E1-S2-bootstrap-app.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Inicializar app Next.js.
- Configurar TypeScript, lint, formatacao, variaveis de ambiente e estrutura de pastas.
- Criar layout base protegido por estado de auth ainda mockado/placeholder.

#### Fora De Escopo

- Implementar modulos operacionais.
- Criar conexao real de banco sem ADR P0 aprovado.

#### Dependencias

- E1.S1 para decisoes finais de env/banco, ou usar placeholders sem migrations.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | medio | Base para envs e guards |
| Dados/migration | baixo | Sem migrations reais |
| UX | medio | Estrutura visual inicial |
| Integracao | baixo | Preparacao Vercel/Firebase |

#### Criterios De Aceite Travados

- [ ] App inicia localmente sem erro.
- [ ] `npm run lint` e typecheck existem e passam.
- [ ] Nenhuma chave real ou segredo fica commitado.
- [ ] Estrutura modular separa `app`, `server`, `lib`, `features` e `tests` ou equivalente aprovado.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| AUTO | lint/typecheck | Qualidade base | - | sim |
| Security | secret scan | Segredos nao commitados | Agente/desenvolvedor subindo segredo | sim |
| E2E/Smoke | abrir pagina inicial | App carrega | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | AUTO |
| Justificativa | Base tecnica verificavel automaticamente |
| Evidencia exigida | CI/local checks verdes |
| Aprovador humano, se aplicavel | - |

#### Rollback Ou Reversao

- Reverter bootstrap ou recriar branch limpa se a estrutura inicial ficar incorreta.

#### Definition Of Done

- [ ] Implementacao dentro do escopo.
- [ ] Checks obrigatorios passando.
- [ ] Sem segredos.
- [ ] Gate concluido.

### Subetapa E1.S3 - Auth, Usuario Interno E Guard Server-Side - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E1 |
| Objetivo | Implementar Google SSO, usuario interno pendente/ativo e helper obrigatorio de autorizacao server-side. |
| Design tecnico de referencia | Sec. 7, 8, 12, 15 |
| PRD | `outputs/prds/PRD-E1-S3-auth-guard.md` |
| Execucao | agente build + revisao tecnica |
| Status | Pendente |

#### Escopo

- Integrar Firebase Auth Google SSO.
- Criar modelo/fluxo de `User` interno.
- Implementar helper `requireActiveUser` e `requirePermission`.
- Bloquear usuario pendente/inativo no backend.

#### Fora De Escopo

- Painel admin completo.
- Permissoes de todos os modulos operacionais.

#### Dependencias

- E1.S1, E1.S2.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | alto | Base de acesso |
| Dados/migration | medio | Tabela User/Role/Permission |
| UX | medio | Login e usuario pendente |
| Integracao | medio | Firebase Auth |

#### Criterios De Aceite Travados

- [ ] Login Google cria/localiza usuario interno.
- [ ] Usuario novo nasce pendente/inativo e nao acessa operacoes.
- [ ] Backend rejeita operacao sem usuario ativo.
- [ ] Frontend nao decide autorizacao, apenas reflete estado.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Integration | auth guard tests | pending/inactive bloqueado | Usuario pendente ou inativo | sim |
| Security | authz tests | sem permissao recebe forbidden | Usuario autenticado sem permissao | sim |
| Security | domain test | dominio nao permitido bloqueado, se configurado | Usuario fora do dominio permitido | sim |
| E2E/Smoke | login e tela pendente | Jornada minima | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Auth/autorizacao sao controle primario |
| Evidencia exigida | Testes + revisao tecnica |
| Aprovador humano, se aplicavel | Responsavel tecnico |

#### Rollback Ou Reversao

- Desabilitar acesso operacional mantendo tela de manutencao/pending se auth falhar.

#### Definition Of Done

- [ ] Criterios atendidos.
- [ ] Testes obrigatorios passando.
- [ ] Revisao humana concluida.

### Subetapa E1.S4 - Auditoria, Erros Seguros E Storage Privado Base - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E1 |
| Objetivo | Criar base transversal de auditoria, erros seguros e arquivos privados. |
| Design tecnico de referencia | Sec. 10, 11, 12 |
| PRD | `outputs/prds/PRD-E1-S4-auditoria-storage.md` |
| Execucao | agente build + revisao tecnica |
| Status | Pendente |

#### Escopo

- Implementar `AuditLog`.
- Padronizar erros seguros.
- Criar `FileObject` e helpers de upload/leitura privada.
- Garantir que nenhum arquivo operacional tenha URL publica permanente.

#### Fora De Escopo

- Fluxos especificos de NF, financeiro ou patrimonio.

#### Dependencias

- E1.S3.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | alto | Arquivos e logs |
| Dados/migration | medio | AuditLog/FileObject |
| UX | baixo | Mensagens de erro |
| Integracao | medio | Firebase Storage |

#### Criterios De Aceite Travados

- [ ] Upload cria metadado `FileObject` e path privado server-side.
- [ ] Leitura exige autorizacao antes de URL assinada/proxy.
- [ ] Erros tecnicos nao vazam stack, token ou segredo ao usuario.
- [ ] Acoes sensiveis registram auditoria minima.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Integration | storage private tests | arquivo privado e leitura autorizada | Upload/arquivo externo | sim |
| Security | error leakage tests | erro seguro | Agente/desenvolvedor subindo segredo | sim |
| Integration | audit tests | ator real e evento | Conta comprometida ou usuario malicioso | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Storage privado e auditoria sao sensiveis |
| Evidencia exigida | Testes + revisao tecnica |
| Aprovador humano, se aplicavel | Responsavel tecnico |

#### Rollback Ou Reversao

- Bloquear upload/leitura de arquivos ate corrigir falha.

#### Definition Of Done

- [ ] Storage privado testado.
- [ ] Auditoria minima funcionando.
- [ ] Erros seguros padronizados.

### Subetapa E2.S1 - Cadastros Compartilhados E Seeds Controlados - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E2 |
| Objetivo | Implementar filiais, departamentos, fornecedores, categorias e macroblocos compartilhados. |
| Design tecnico de referencia | Sec. 5, 6, 9 |
| PRD | `outputs/prds/PRD-E2-S1-cadastros.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Criar entidades compartilhadas e CRUDs autorizados.
- Criar seeds temporarios marcados como homologacao.
- Garantir escopo por filial nos dados operacionais.

#### Fora De Escopo

- Regras completas de cada modulo.

#### Dependencias

- E1.S3, E1.S4.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | medio | Escopo por filial |
| Dados/migration | alto | Base de varios modulos |
| UX | medio | Cadastros de apoio |
| Integracao | baixo | - |

#### Criterios De Aceite Travados

- [ ] Filiais e categorias possuem CRUD autorizado.
- [ ] Fornecedor e compartilhado entre NF/Financeiro/Patrimonio.
- [ ] Seeds temporarios nao sao tratados como dados finais da area.
- [ ] Dados por filial respeitam escopo backend.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Integration | catalog tests | constraints e CRUD autorizado | Usuario autenticado sem permissao | sim |
| Security | branch scope tests | isolamento por filial | Usuario de outra filial/escopo | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Base de escopo e dados compartilhados |
| Evidencia exigida | Testes e revisao tecnica |
| Aprovador humano, se aplicavel | Responsavel tecnico/negocio |

#### Rollback Ou Reversao

- Reverter seeds/dados de homologacao por script controlado.

#### Definition Of Done

- [ ] CRUDs e seeds prontos.
- [ ] Testes de escopo passando.
- [ ] Pendencias de categorias reais registradas.

### Subetapa E3.S1 - Estoque: Produtos, Colaboradores E Movimentacoes - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E3 |
| Objetivo | Implementar o nucleo do estoque com saldo derivado de movimentacoes. |
| Design tecnico de referencia | Sec. 5, 8, 9, 11 |
| PRD | `outputs/prds/PRD-E3-S1-estoque-core.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Produtos, categorias, colaboradores e movimentacoes.
- Entrada, saida e ajuste com permissoes diferentes.
- Saldo derivado/reconciliavel por movimentos.

#### Fora De Escopo

- NF/OCR automatizando entrada.
- Dashboards finais.

#### Dependencias

- E2.S1.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | medio | Permissoes por acao |
| Dados/migration | alto | Saldo e movimentos |
| UX | alto | Telas de estoque |
| Integracao | baixo | - |

#### Criterios De Aceite Travados

- [ ] Saldo de produto nao pode ser editado manualmente.
- [ ] Saida exige produto, quantidade, unidade e colaborador por ID.
- [ ] Ajuste exige permissao elevada e auditoria.
- [ ] Movimentacoes respeitam filial/escopo no backend.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Unit | stock domain tests | saldo e regras | - | sim |
| Integration | stock movement tests | transacao e constraints | Conta comprometida ou usuario malicioso | sim |
| Security | branch scope tests | filial isolada | Usuario de outra filial/escopo | sim |
| Manual | smoke estoque | telas principais | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Estoque altera saldo operacional |
| Evidencia exigida | Testes + smoke visual |
| Aprovador humano, se aplicavel | Estoque/tecnico |

#### Rollback Ou Reversao

- Corrigir via movimento de ajuste auditado; evitar delete fisico.

#### Definition Of Done

- [ ] Nucleo de estoque funcional.
- [ ] Testes obrigatorios passando.
- [ ] Auditoria em ajustes.

### Subetapa E4.S1 - NF/OCR: Upload, Revisao E Aprovacao - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E4 |
| Objetivo | Implementar fluxo de NF/OCR com arquivo privado, revisao manual e aprovacao transacional. |
| Design tecnico de referencia | Sec. 8, 9, 10, 11, 14 |
| PRD | `outputs/prds/PRD-E4-S1-nf-ocr.md` |
| Execucao | agente build + revisao tecnica |
| Status | Pendente |

#### Escopo

- Upload de NF em arquivo privado.
- Criar invoice em revisao.
- Integrar provider OCR/IA por interface isolada ou mock ate decisao.
- Validar saida de OCR por schema runtime.
- Aprovar NF gerando movimentos de estoque e vinculo financeiro quando aplicavel.

#### Fora De Escopo

- Automatizar pagamento.
- Confiar cegamente no OCR.

#### Dependencias

- E1.S4, E2.S1, E3.S1, decisao provider OCR para producao.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | alto | Arquivos e IA |
| Dados/migration | alto | NF, itens, movimentos |
| UX | alto | Revisao manual |
| Integracao | alto | OCR/IA |

#### Criterios De Aceite Travados

- [ ] Arquivo de NF e privado e possui metadado `FileObject`.
- [ ] Saida OCR nunca aprova NF automaticamente sem revisao.
- [ ] Total calculado divergente exige revisao/confirmacao.
- [ ] Aprovacao e transacional e auditada.
- [ ] Chave do provider nao aparece no client nem em logs.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Integration | nf upload tests | arquivo privado e invoice revisao | Upload/arquivo externo | sim |
| Security | ocr adversarial tests | prompt/saida hostil rejeitada | Texto de NF/OCR | sim |
| Integration | nf approve tests | transacao NF -> estoque | Conta comprometida ou usuario malicioso | sim |
| Manual | smoke NF/OCR | upload, revisao e aprovacao | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Fluxo sensivel com arquivo, IA, estoque e financeiro |
| Evidencia exigida | Testes + validacao negocio/tecnica |
| Aprovador humano, se aplicavel | Estoque/Financeiro/TI |

#### Rollback Ou Reversao

- NF aprovada incorretamente deve gerar ajuste auditado/reversao controlada, nunca delete silencioso.

#### Definition Of Done

- [ ] Upload/revisao/aprovacao funcionando.
- [ ] Testes obrigatorios passando.
- [ ] Provider ou mock isolado documentado.

### Subetapa E5.S1 - Financeiro: Despesas, Solicitacoes E Status - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E5 |
| Objetivo | Implementar fluxo financeiro base com valores, anexos, status e pagamentos autorizados. |
| Design tecnico de referencia | Sec. 5, 7, 8, 9, 10, 11 |
| PRD | `outputs/prds/PRD-E5-S1-financeiro.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Despesas, solicitacoes, fornecedores, anexos e status.
- Valores decimal/BRL.
- Pagamento com permissao especifica.
- Soft delete/cancelamento auditado.

#### Fora De Escopo

- Integracao bancaria.
- Relatorio Excel final.

#### Dependencias

- E1.S4, E2.S1.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | alto | Dados financeiros |
| Dados/migration | alto | Valores/status |
| UX | alto | Fluxo financeiro |
| Integracao | baixo | Storage anexos |

#### Criterios De Aceite Travados

- [ ] Valor monetario usa decimal/numeric, nao float.
- [ ] Status nao pode ser alterado livremente pelo client.
- [ ] Marcar como pago exige `financial:pay`.
- [ ] Anexos sao privados.
- [ ] Operacoes sensiveis sao auditadas.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Unit | financial domain tests | valores/status | - | sim |
| Integration | financial action tests | permissoes e transicoes | Conta comprometida ou usuario malicioso | sim |
| Security | file read tests | anexos privados | Upload/arquivo externo | sim |
| Manual | smoke financeiro | fluxo operacional | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Dados financeiros e status sensiveis |
| Evidencia exigida | Testes + validacao financeiro |
| Aprovador humano, se aplicavel | Financeiro/TI |

#### Rollback Ou Reversao

- Usar cancelamento/estorno auditado; evitar delete fisico.

#### Definition Of Done

- [ ] Fluxo financeiro base funcional.
- [ ] Testes obrigatorios passando.
- [ ] Auditoria em status/pagamento.

### Subetapa E6.S1 - Orcamento Operacional E Recorrencias Financeiras - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E6 |
| Objetivo | Implementar orcamento por competencia/classificacao e consumo realizado x orcado. |
| Design tecnico de referencia | Sec. 5, 8, 9, 11 |
| PRD | `outputs/prds/PRD-E6-S1-orcamento.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Orcamento por ano/mes/filial/macrobloco/categoria.
- Consumo por despesas de cartao, solicitacoes pagas e lancamentos proprios.
- `request_date` como data-base.
- Recorrencias financeiras idempotentes.

#### Fora De Escopo

- Integracao com ERP/contabilidade.

#### Dependencias

- E5.S1.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | medio | Permissoes por categoria/filial |
| Dados/migration | alto | Unicidade e calculo |
| UX | alto | Orcamento e dashboards |
| Integracao | baixo | - |

#### Criterios De Aceite Travados

- [ ] Budget unico por ano/mes/filial/macrobloco/categoria.
- [ ] `request_date` e a referencia temporal dos filtros.
- [ ] `Compras TI` nao consome orcamento operacional, conforme matriz.
- [ ] Recorrencias nao duplicam execucoes.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Unit | budget domain tests | consumo e request_date | - | sim |
| Integration | recurring tests | idempotencia | Conta comprometida ou usuario malicioso | sim |
| Manual | smoke orcamento | realizado x orcado | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Impacta leitura financeira e decisao de negocio |
| Evidencia exigida | Testes + validacao financeiro/controladoria |
| Aprovador humano, se aplicavel | Financeiro/Controladoria |

#### Rollback Ou Reversao

- Corrigir classificacoes por ajuste auditado e recalculo controlado.

#### Definition Of Done

- [ ] Orcamento funcional.
- [ ] Recorrencias idempotentes.
- [ ] Testes obrigatorios passando.

### Subetapa E7.S1 - Inventario Patrimonial - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E7 |
| Objetivo | Implementar cadastro, localizacao, fotos privadas e historico de bens patrimoniais. |
| Design tecnico de referencia | Sec. 5, 8, 10, 11 |
| PRD | `outputs/prds/PRD-E7-S1-patrimonio.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Cadastro de ativos com codigo gerado no servidor.
- Localizacao, filial, responsavel, estado e status.
- Fotos em storage privado.
- Historico de alteracoes relevantes.

#### Fora De Escopo

- Inventario fisico completo via mobile nativo.

#### Dependencias

- E1.S4, E2.S1.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | medio | Fotos e dados internos |
| Dados/migration | medio | Codigo e historico |
| UX | alto | Telas patrimonio |
| Integracao | baixo | Storage |

#### Criterios De Aceite Travados

- [ ] Codigo patrimonial e gerado no servidor e unico.
- [ ] Fotos sao privadas.
- [ ] Alteracoes de localizacao/responsavel/status geram historico/auditoria.
- [ ] Regra sala 801/803 fica pendente ou parametrizada ate confirmacao.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Integration | asset tests | codigo unico e historico | Conta comprometida ou usuario malicioso | sim |
| Security | file privacy tests | fotos privadas | Upload/arquivo externo | sim |
| Manual | smoke patrimonio | cadastro/listagem | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Patrimonio tem dados internos e arquivos |
| Evidencia exigida | Testes + smoke visual |
| Aprovador humano, se aplicavel | Administrativo/TI |

#### Rollback Ou Reversao

- Alteracoes incorretas devem gerar novo historico corretivo, nao apagar historico.

#### Definition Of Done

- [ ] Patrimonio funcional.
- [ ] Fotos privadas.
- [ ] Historico/auditoria.

### Subetapa E8.S1 - Facilities: Tarefas, Kanban, Calendario E Recorrencia - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E8 |
| Objetivo | Implementar facilities com tarefas, status, recorrencias e indicadores operacionais. |
| Design tecnico de referencia | Sec. 5, 8, 9, 11 |
| PRD | `outputs/prds/PRD-E8-S1-facilities.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Tarefas/manutencoes com titulo, tipo, prioridade, responsavel, prazo e status.
- Kanban, calendario e desempenho.
- Recorrencia preventiva idempotente.
- Historico de status.

#### Fora De Escopo

- Controle de custo por usuario.

#### Dependencias

- E1.S4, E2.S1.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | medio | Escopo por filial |
| Dados/migration | medio | Recorrencia/status |
| UX | alto | Kanban/calendario |
| Integracao | baixo | - |

#### Criterios De Aceite Travados

- [ ] Status segue transicoes permitidas.
- [ ] Recorrencia preventiva concluida gera proxima ocorrencia sem duplicar.
- [ ] Filtros por filial sao aplicados no backend.
- [ ] Historico preserva mudancas de status.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Unit | facilities domain tests | transicoes/status | - | sim |
| Integration | recurrence tests | idempotencia | Conta comprometida ou usuario malicioso | sim |
| Security | branch scope tests | filial isolada | Usuario de outra filial/escopo | sim |
| Manual | smoke facilities | dashboard/kanban/calendario | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Fluxo operacional e recorrencias |
| Evidencia exigida | Testes + smoke visual |
| Aprovador humano, se aplicavel | Administrativo/TI |

#### Rollback Ou Reversao

- Corrigir status por evento auditado; evitar delete silencioso.

#### Definition Of Done

- [ ] Facilities funcional.
- [ ] Recorrencias idempotentes.
- [ ] Testes obrigatorios passando.

### Subetapa E9.S1 - Dashboards, Relatorios E Exportacao - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E9 |
| Objetivo | Consolidar indicadores e relatorios confiaveis a partir dos dados-fonte dos modulos. |
| Design tecnico de referencia | Sec. 8, 11, 13, 15 |
| PRD | `outputs/prds/PRD-E9-S1-dashboards-relatorios.md` |
| Execucao | agente build |
| Status | Pendente |

#### Escopo

- Dashboards por modulo.
- Indicadores sem distorcao por registros sem movimentacao relevante.
- Exportacao financeira em Excel.
- Permissao especifica para exportacao.

#### Fora De Escopo

- BI externo.
- Relatorio regulatorio.

#### Dependencias

- E3.S1, E5.S1, E6.S1, E7.S1, E8.S1.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | medio | Exportacao pode conter dados sensiveis |
| Dados/migration | baixo | Consultas agregadas |
| UX | alto | Dashboards |
| Integracao | baixo | Geracao Excel |

#### Criterios De Aceite Travados

- [ ] Indicadores batem com dados-fonte.
- [ ] Exportacao exige `reports:export`.
- [ ] Relatorios respeitam escopo por filial.
- [ ] Exportacao financeira preserva abas/formatacao esperada.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Integration | report query tests | dados-fonte e escopo | Usuario de outra filial/escopo | sim |
| Security | export permission tests | exportacao protegida | Usuario autenticado sem permissao | sim |
| Manual | smoke dashboards | visual e filtros | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Relatorios orientam decisao e exportam dados |
| Evidencia exigida | Testes + validacao negocio |
| Aprovador humano, se aplicavel | Negocio/Financeiro/TI |

#### Rollback Ou Reversao

- Desabilitar exportacao e dashboards incorretos via feature flag/config ate corrigir.

#### Definition Of Done

- [ ] Dashboards funcionais.
- [ ] Exportacao protegida.
- [ ] Validacao de dados-fonte.

### Subetapa E10.S1 - Homologacao, Hardening E Go-Live Controlado - HUMANO

| Campo | Valor |
| --- | --- |
| Etapa macro | E10 |
| Objetivo | Fechar smoke test, seguranca, validacao visual, pendencias e plano de go-live. |
| Design tecnico de referencia | Sec. 15, 16, 18, 19 |
| PRD | `outputs/prds/PRD-E10-S1-homologacao-go-live.md` |
| Execucao | agente QA + responsavel tecnico + negocio |
| Status | Pendente |

#### Escopo

- Smoke test end-to-end.
- Revisao de seguranca e segredos.
- Validacao visual contra telas de referencia.
- Revisao de pendencias nao bloqueantes.
- Plano de go-live/corte.

#### Fora De Escopo

- Novos modulos.
- Integracoes profundas futuras.

#### Dependencias

- E1-E9 concluidas.

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | alto | Gate final |
| Dados/migration | medio | Seeds/migracao/corte |
| UX | alto | Homologacao |
| Integracao | medio | Vercel, Firebase, Postgres, iframe |

#### Criterios De Aceite Travados

- [ ] Smoke test cobre login, usuario autorizado, modulos principais e logout.
- [ ] Nenhum segredo real aparece no repo/client/logs.
- [ ] Testes de usuario pendente, sem permissao e filial errada passam.
- [ ] Upload/leitura de arquivo privado passa.
- [ ] Pendencias de negocio restantes estao aceitas ou bloqueiam go-live explicitamente.

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| E2E/Smoke | smoke completo | jornada principal | - | sim |
| Security | authz matrix | pending/forbidden/branch | Usuario pendente ou inativo; usuario sem permissao; filial errada | sim |
| Security | secret scan | segredos nao expostos | Agente/desenvolvedor subindo segredo | sim |
| Security | storage private test | arquivo privado | Upload/arquivo externo | sim |
| Manual | homologacao negocio | aceite operacional | - | sim |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | HUMANO |
| Justificativa | Release candidata para uso interno |
| Evidencia exigida | Testes, evidencias, aceite negocio e tecnico |
| Aprovador humano, se aplicavel | Negocio + tecnico |

#### Rollback Ou Reversao

- Manter sistema legado/fluxo atual como fallback ate go-live controlado.
- Desabilitar acesso por flag/env se smoke critico falhar.

#### Definition Of Done

- [ ] Smoke e seguranca aprovados.
- [ ] Evidencias registradas.
- [ ] Aceite negocio/tecnico concluido.

## 5. Sequencia De Execucao

| Ordem | Subetapa | Depende de | Pode rodar em paralelo com | Observacoes |
| --- | --- | --- | --- | --- |
| 1 | E1.S1 | Matriz/Roadmap/Design | - | Fechar ADRs P0 antes de migrations reais |
| 2 | E1.S2 | E1.S1 parcial | - | Pode usar placeholders se banco ainda estiver em decisao |
| 3 | E1.S3 | E1.S1, E1.S2 | E1.S4 parcial | Auth e guard precisam revisao humana |
| 4 | E1.S4 | E1.S3 | - | Storage/auditoria base |
| 5 | E2.S1 | E1.S3, E1.S4 | - | Cadastros compartilhados |
| 6 | E3.S1 | E2.S1 | E5.S1 | Estoque e Financeiro podem separar agentes |
| 7 | E5.S1 | E2.S1 | E3.S1 | Financeiro base |
| 8 | E4.S1 | E3.S1, E1.S4 | E6.S1 | NF depende de estoque |
| 9 | E6.S1 | E5.S1 | E4.S1, E7.S1, E8.S1 | Orcamento depende de financeiro |
| 10 | E7.S1 | E2.S1, E1.S4 | E8.S1 | Patrimonio |
| 11 | E8.S1 | E2.S1, E1.S4 | E7.S1 | Facilities |
| 12 | E9.S1 | E3.S1, E5.S1, E6.S1, E7.S1, E8.S1 | - | Consolidacao |
| 13 | E10.S1 | E1-E9 | - | Gate final |

## 6. Mapa De Issues

| Subetapa | Issue | PR | Status | Observacoes |
| --- | --- | --- | --- | --- |
| E1.S1 | PENDENTE | PENDENTE | Pendente | ADRs P0 |
| E1.S2 | PENDENTE | PENDENTE | Pendente | Bootstrap |
| E1.S3 | PENDENTE | PENDENTE | Pendente | Auth/guard |
| E1.S4 | PENDENTE | PENDENTE | Pendente | Auditoria/storage |
| E2.S1 | PENDENTE | PENDENTE | Pendente | Cadastros |
| E3.S1 | PENDENTE | PENDENTE | Pendente | Estoque |
| E4.S1 | PENDENTE | PENDENTE | Pendente | NF/OCR |
| E5.S1 | PENDENTE | PENDENTE | Pendente | Financeiro |
| E6.S1 | PENDENTE | PENDENTE | Pendente | Orcamento |
| E7.S1 | PENDENTE | PENDENTE | Pendente | Patrimonio |
| E8.S1 | PENDENTE | PENDENTE | Pendente | Facilities |
| E9.S1 | PENDENTE | PENDENTE | Pendente | Dashboards/relatorios |
| E10.S1 | PENDENTE | PENDENTE | Pendente | Homologacao |

## 7. Checklist De Geracao De Issues

- [ ] Toda subetapa possui objetivo claro.
- [ ] Toda subetapa aponta para etapa macro.
- [ ] Toda subetapa aponta para secao do design tecnico.
- [ ] Toda subetapa possui escopo e fora de escopo.
- [ ] Toda subetapa possui criterios de aceite travados.
- [ ] Toda subetapa possui testes que validam.
- [ ] Abuse cases relevantes da matriz (sec. 6) estao ligados a um teste de seguranca travado.
- [ ] Subetapas sensiveis estao marcadas como `HUMANO`.
- [ ] Dependencias e paralelizacao estao claras.
- [ ] Rollback/reversao foi definido quando aplicavel.
- [ ] Issues serao criadas na ordem correta.

## 8. Criterios De Aceite Do Roadmap Detalhado - Portao 4

- [ ] Matriz tecnica esta validada.
- [ ] Roadmap macro esta validado.
- [ ] Design tecnico esta validado.
- [ ] Subetapas cobrem as etapas macro planejadas.
- [ ] Nenhuma subetapa contradiz o design tecnico.
- [ ] Criterios de aceite sao objetivos, testaveis e travados.
- [ ] Testes obrigatorios estao definidos.
- [ ] Gates humanos e automaticos estao corretos.
- [ ] Subetapas sensiveis exigem revisao humana.
- [ ] Dependencias permitem execucao segura por agentes.
- [ ] Validado por responsavel em `AAAA-MM-DD`.

## 9. Historico De Alteracoes

| Versao | Data | Autor | Mudanca | Status resultante |
| --- | --- | --- | --- | --- |
| `v0.1` | 2026-06-16 | Equipe SDD 3A RIVA | Criacao inicial do Roadmap Detalhado a partir da Matriz v0.3, Roadmap Macro v0.1 e Design Tecnico v0.1 | `Rascunho` |
