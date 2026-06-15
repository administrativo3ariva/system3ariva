# Roadmap de Reconstrucao do Sistema Administrativo 3A RIVA

## Objetivo

Reconstruir o sistema administrativo de forma estruturada, segura e evolutiva, usando o sistema atual apenas como referencia funcional e visual. A nova base deve nascer com autenticacao, permissoes, auditoria, armazenamento seguro de arquivos e modelo relacional bem definido.

## Stack Aprovada

- Next.js
- TypeScript
- Firebase Auth
- Firebase Storage
- Firebase Analytics
- PostgreSQL Neon Free/Launch
- Prisma
- Deploy na Vercel
- Exibicao na intranet via iframe

## Premissas

- O sistema atual servira como referencia de telas, fluxos e dores conhecidas.
- O documento de requisitos sera a fonte principal das regras de negocio.
- O documento de falhas de seguranca do projeto antigo sera usado como checklist preventivo.
- Nenhum modulo deve nascer com recurso publico sem necessidade explicita.
- Usuarios novos devem iniciar sem acesso operacional ate liberacao administrativa.
- Arquivos devem ficar no Firebase Storage; o PostgreSQL deve guardar apenas metadados e referencias.
- O banco relacional sera a fonte de verdade dos dados de negocio.
- As entregas devem ser pequenas, testaveis e separadas por modulo.

## Por Que Podemos Avancar Rapido

- Ja existem telas do sistema atual para usar como referencia visual e funcional.
- Ja existe um documento de requisitos com regras importantes do dominio.
- Ja existe uma revisao de seguranca apontando falhas que a nova arquitetura deve evitar.
- A stack escolhida reduz complexidade operacional: Vercel para deploy, Firebase para autenticacao/storage e Neon para banco relacional.
- O desenvolvimento pode ser dividido por agentes desde que exista uma matriz tecnica clara.

## Fase 0 - Matriz Tecnica Mestre

Antes de codar, criar uma matriz tecnica contendo:

- modulos do sistema;
- telas de referencia;
- entidades principais;
- relacionamentos;
- regras de negocio;
- regras de seguranca;
- papeis e permissoes;
- fluxos criticos;
- criterios de aceite;
- dependencias entre modulos;
- ordem de implementacao.

Entregaveis:

- `matriz-tecnica-novo-sistema.md`
- `roadmap-agentes.md`
- `checklist-seguranca-novo-sistema.md`

## Fase 1 - Fundacao Tecnica

Criar a base do novo projeto com:

- Next.js com TypeScript;
- estrutura de rotas;
- layout administrativo base;
- configuracao de ambiente;
- configuracao do Prisma;
- conexao com Neon PostgreSQL;
- configuracao do Firebase;
- padrao inicial de componentes;
- padrao inicial de validacao;
- padrao inicial de erros.

Entregaveis:

- projeto Next.js inicial;
- configuracao Firebase;
- configuracao Prisma;
- conexao Neon validada;
- deploy inicial na Vercel.

## Fase 2 - Autenticacao, Usuarios e Permissoes

Implementar o nucleo de seguranca:

- login com Firebase Auth;
- sincronizacao de usuario autenticado com tabela `users` no PostgreSQL;
- status de usuario: pendente, ativo, inativo;
- papeis iniciais: admin, moderator, user;
- controle de permissoes por modulo;
- protecao de rotas no servidor e no cliente;
- bloqueio de usuarios sem perfil ou inativos;
- tela administrativa de usuarios;
- auditoria de alteracoes sensiveis.

Principios:

- o frontend nao deve ser fonte de autoridade para permissao;
- toda acao sensivel deve validar usuario ativo e permissao no backend;
- usuario recem-criado nao deve receber permissao operacional automaticamente.

## Fase 3 - Banco, Auditoria e Modelo De Dados

Definir e implementar o `schema.prisma` inicial com entidades como:

- usuarios;
- papeis;
- permissoes;
- filiais;
- fornecedores;
- produtos;
- categorias;
- notas fiscais;
- itens de nota fiscal;
- arquivos;
- estoque;
- movimentacoes de estoque;
- patrimonio;
- financeiro;
- facilities;
- logs de auditoria.

Entregaveis:

- `schema.prisma` inicial;
- migrations;
- seed minimo de desenvolvimento;
- modelo de auditoria;
- convencoes de `created_at`, `updated_at`, `created_by` e `updated_by`.

## Fase 4 - Storage Seguro De Arquivos

Implementar armazenamento seguro no Firebase Storage:

- upload de PDFs, imagens e anexos;
- paths segregados por modulo e entidade;
- metadados no PostgreSQL;
- validacao de tipo de arquivo;
- validacao de tamanho;
- download/view por URL assinada ou fluxo autorizado;
- bloqueio de acesso publico indevido;
- auditoria de upload, leitura e remocao quando aplicavel.

Regra central:

- o arquivo fica no Storage;
- o banco guarda referencia, dono, modulo, tipo, status e metadados.

## Fase 5 - Modulo De Notas Fiscais E OCR

Reconstruir o fluxo de NF com foco em seguranca e rastreabilidade:

- upload da nota fiscal;
- armazenamento do PDF original;
- processamento OCR/IA;
- persistencia do JSON extraido;
- persistencia dos itens;
- tela de revisao antes de aprovar;
- validacao de totais;
- tratamento de frete fiscal versus taxas operacionais;
- status da nota: pendente, processada, aprovada, rejeitada, erro;
- logs do processamento;
- retry controlado.

Cuidados:

- nao expor arquivo publicamente para processamento;
- limitar tamanho antes de processar;
- padronizar erros para o usuario;
- manter detalhes tecnicos em log interno.

## Fase 6 - Modulo De Estoque

Implementar:

- cadastro de produtos;
- categorias;
- fornecedores;
- entrada por nota fiscal aprovada;
- movimentacoes manuais autorizadas;
- saldo por filial/local;
- historico de movimentacoes;
- alertas de baixo estoque;
- filtros e relatorios.

## Fase 7 - Modulo Financeiro

Implementar:

- lancamentos financeiros;
- centros de custo ou macroblocos;
- categorias;
- filiais;
- orcamentos;
- acompanhamento por periodo;
- data oficial de solicitacao ou competencia conforme requisito;
- anexos;
- status e aprovacao quando aplicavel.

## Fase 8 - Inventario Patrimonial

Implementar:

- cadastro de bens;
- localizacao;
- responsavel;
- status;
- anexos e fotos;
- movimentacoes;
- historico;
- relatorios de inventario.

## Fase 9 - Facilities

Implementar:

- solicitacoes;
- categorias de atendimento;
- responsaveis;
- prioridades;
- status;
- anexos;
- historico;
- indicadores.

## Fase 10 - Dashboards E Relatorios

Implementar visoes consolidadas:

- indicadores por modulo;
- cards operacionais;
- filtros por periodo, filial e status;
- exportacoes quando necessario;
- relatorios administrativos;
- visoes para acompanhamento rapido na intranet.

## Fase 11 - Hardening, Homologacao E Entrega

Antes de entregar:

- revisar permissoes por perfil;
- revisar rotas protegidas;
- revisar regras de upload/download;
- testar usuario pendente, ativo e inativo;
- testar usuario sem perfil;
- testar acesso indevido entre modulos;
- testar fluxos criticos ponta a ponta;
- validar iframe na intranet;
- validar variaveis de ambiente;
- validar logs e auditoria;
- remover seeds/dados de teste sensiveis;
- documentar operacao basica.

## Divisao Inicial Por Agentes

- Agente 1: fundacao Next.js, layout, rotas e deploy Vercel.
- Agente 2: Neon, Prisma, schema inicial e migrations.
- Agente 3: Firebase Auth, usuarios, perfis e permissoes.
- Agente 4: Firebase Storage, anexos e seguranca de arquivos.
- Agente 5: NF/OCR, revisao e aprovacao.
- Agente 6: estoque e movimentacoes.
- Agente 7: financeiro e orcamentos.
- Agente 8: patrimonio.
- Agente 9: facilities.
- Agente 10: dashboards, auditoria, testes e hardening.

## Ordem Recomendada

1. Criar matriz tecnica mestre.
2. Criar schema inicial do banco.
3. Criar checklist de seguranca do novo sistema.
4. Criar novo projeto base.
5. Implementar autenticacao e permissoes.
6. Implementar storage seguro.
7. Implementar modulo de NF/OCR.
8. Implementar modulos operacionais.
9. Implementar dashboards.
10. Homologar, endurecer seguranca e entregar.

## Definicao De Pronto Da Fundacao

A fundacao so deve ser considerada pronta quando:

- o app estiver rodando localmente;
- o deploy inicial estiver funcionando;
- o login Firebase estiver funcionando;
- o usuario autenticado estiver sincronizado com o banco;
- usuarios pendentes ou inativos estiverem bloqueados;
- existir pelo menos um perfil admin funcional;
- existir protecao de rota no servidor;
- Prisma estiver conectado ao Neon;
- houver auditoria minima para acoes sensiveis;
- upload controlado no Firebase Storage estiver validado.

## Riscos A Evitar Desde O Inicio

- permissao validada apenas no frontend;
- arquivos acessiveis publicamente por engano;
- usuario novo recebendo acesso automatico;
- banco NoSQL tentando representar relacoes complexas;
- agentes trabalhando sem matriz unica;
- modulos criados sem criterios de aceite;
- telas bonitas sem regra de negocio validada;
- logs tecnicos expostos ao usuario final;
- dependencia do sistema antigo como base tecnica.

## Proximo Passo

Criar a matriz tecnica mestre a partir de:

- documento de requisitos;
- prints das telas atuais;
- documento de falhas de seguranca;
- conhecimento extraido do sistema atual;
- decisoes de stack deste roadmap.

