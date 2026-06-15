# Roadmap Do Framework SDD

## Objetivo

Criar um framework escalavel para desenvolvimento assistido por agentes, voltado a usuarios nao tecnicos, com foco em planejamento claro, seguranca por desenho, criterios de aceite travados e execucao modular.

O piloto do framework sera aplicado no projeto de reconstrucao do Sistema Administrativo 3A RIVA.

## Principio Central

Nenhum desenvolvimento deve comecar antes de existirem artefatos validados que definam:

- o que sera construido;
- por que sera construido;
- quais riscos precisam ser evitados;
- quais criterios de aceite nao podem ser alterados pelo executor;
- quais testes comprovam que a entrega esta correta;
- quais pontos exigem revisao humana.

## Conceitos Do Framework

### Inputs

Sao os materiais brutos usados para compreender o projeto:

- documento de requisitos;
- prints, telas ou referencias visuais;
- codigo legado, se existir;
- auditoria de seguranca, se existir;
- regras de negocio informadas pelo solicitante;
- restricoes de stack, prazo, custo e operacao.

### Artefatos-Portao

Sao documentos gerados a partir dos inputs e validados antes da execucao:

- matriz tecnica;
- roadmap macro;
- especificacao tecnica / design tecnico;
- roadmap detalhado.

Papel de cada artefato:

1. Matriz Tecnica
   - decide o que sera construido, por que, riscos, escopo, seguranca e fronteiras.
   - deve ser validavel por responsavel de negocio com apoio tecnico.
   - nao deve carregar detalhes que mudam durante implementacao.

2. Roadmap Macro
   - decide a ordem das etapas, dependencias, paralelizacao e portoes.
   - conecta a matriz com o planejamento de execucao.

3. Especificacao Tecnica / Design Tecnico
   - decide como o sistema sera desenhado tecnicamente.
   - concentra modelagem, permissoes detalhadas, contratos, APIs, storage, auditoria e decisoes de implementacao.
   - deve ser validado por responsavel tecnico.

4. Roadmap Detalhado
   - quebra o trabalho em subetapas executaveis por agentes.
   - define criterios de aceite e testes travados.
   - deve ser a principal fonte de execucao para agentes.

### Fonte Da Verdade Por Tema

| Tema | Fonte da verdade | Observacoes |
| --- | --- | --- |
| Objetivo, escopo, riscos e fronteiras | Matriz Tecnica | Se mudar, revisar Portao 1 |
| Ordem, dependencias e paralelizacao | Roadmap Macro | Se mudar, revisar Portao 2 |
| Modelagem, RBAC granular, APIs, storage e auditoria | Design Tecnico | Se mudar, revisar Portao 3 |
| Subetapas, criterios travados, testes e issues | Roadmap Detalhado | Se mudar, revisar Portao 4 |
| Execucao real e evidencias | PR/CI/relatorios | Nao altera criterios travados sem revisao |

### Hand-Off Entre Papeis

| Artefato | Autor principal | Validador de negocio | Validador tecnico | Executor |
| --- | --- | --- | --- | --- |
| Inputs | Area solicitante + responsavel tecnico | Area solicitante | Responsavel tecnico | Nao se aplica |
| Matriz Tecnica | Responsavel tecnico com apoio da area | Obrigatorio | Obrigatorio | Nao se aplica |
| Roadmap Macro | Responsavel tecnico | Recomendado | Obrigatorio | Nao se aplica |
| Design Tecnico | Responsavel tecnico | Opcional/consultivo | Obrigatorio | Nao se aplica |
| Roadmap Detalhado | Responsavel tecnico | Opcional/consultivo | Obrigatorio | Agentes/delegados |
| PRD de subetapa | Responsavel tecnico ou planejador | Quando houver impacto de negocio | Obrigatorio | Agente/delegado |
| Implementacao | Agente/delegado | Homologa resultado | Revisa quando sensivel | Agente/delegado |

Regra:

- area externa valida necessidade, escopo e resultado esperado;
- responsavel tecnico valida arquitetura, seguranca, dados e criterios travados;
- agente executor implementa subetapas aprovadas, sem alterar criterios ou testes travados.

### Portoes

Sao pontos de controle que impedem avanco sem validacao:

- Portao 1: matriz tecnica validada;
- Portao 2: roadmap macro validado;
- Portao 3: especificacao tecnica / design tecnico validado;
- Portao 4: roadmap detalhado validado;
- Portao 5: criterios e testes travados antes da implementacao;
- Portao 6: CI, testes e revisao antes de aceitar entrega.

## Fase 0 - Validar O Piloto Do Framework

Objetivo:

- usar o projeto 3A RIVA como caso real para validar o metodo;
- confirmar se os templates cobrem projeto, seguranca, requisitos, agentes e execucao;
- identificar lacunas antes de transformar o processo em skill reutilizavel.

Entregaveis:

- matriz tecnica no formato do template;
- roadmap macro no formato do template;
- especificacao tecnica / design tecnico no formato do template;
- roadmap detalhado no formato do template;
- lista de ajustes nos templates;
- conclusoes do piloto.

Criterio de pronto:

- os tres artefatos explicam o projeto sem depender de contexto solto da conversa;
- os pontos de seguranca estao explicitos;
- os criterios de aceite sao testaveis;
- as etapas podem virar issues ou tarefas para agentes.

## Fase 1 - Consolidar Os 4 Templates Base

Objetivo:

- transformar os templates em padrao oficial do framework;
- remover ambiguidades;
- deixar claro o que e input, o que e artefato e o que e portao.

Templates base:

- `1-matriz-tecnica.template.md`;
- `2-roadmap.template.md`;
- `3-design-tecnico.template.md`;
- `4-roadmap-detalhado.template.md`.

Ajustes recomendados:

- padronizar status: `Rascunho`, `Validado`, `Substituido`;
- padronizar versao;
- padronizar responsavel;
- padronizar portoes humanos e automaticos;
- incluir seguranca por desenho;
- incluir LGPD/dados pessoais por entidade;
- incluir criterios travados;
- incluir testes que validam;
- incluir relacao com ADRs;
- incluir relacao com issues.
- separar claramente decisoes estaveis de matriz das decisoes mutaveis de design tecnico.

Criterio de pronto:

- qualquer projeto novo consegue iniciar usando apenas os templates e seus inputs;
- um agente consegue preencher os documentos sem inventar estrutura propria;
- um usuario nao tecnico consegue revisar os portoes principais.

## Fase 2 - Criar Estrutura Padrao De Pastas

Objetivo:

- criar uma estrutura previsivel para projetos que usam o framework;
- separar inputs, templates, features, reports, ADRs e gates.

Estrutura sugerida:

```txt
sdd/
  inputs/
    requisitos/
    telas/
    legado/
    seguranca/
  templates/
    1-matriz-tecnica.template.md
    2-roadmap.template.md
    3-design-tecnico.template.md
    4-roadmap-detalhado.template.md
    prd.template.md
  features/
    <feature-ou-modulo>/
      matriz-tecnica.md
      roadmap.md
      design-tecnico.md
      roadmap-detalhado.md
      prds/
      tests/
  reports/
    seguranca/
    auditoria/
    homologacao/
  adr/
  gates/
```

Criterio de pronto:

- a estrutura funciona para projeto pequeno e para projeto modular;
- cada feature consegue ter artefatos proprios;
- documentos globais e documentos por modulo nao se misturam.

## Fase 3 - Criar Skill De Planejamento

Objetivo:

- unir as ideias das skills de definicao e design em uma skill unica para planejamento;
- orientar usuario nao tecnico do problema ate os artefatos-portao;
- impedir que o fluxo pule direto para implementacao.

Nome sugerido:

- `sdd-planning`

Responsabilidades da skill:

- coletar inputs;
- organizar requisitos;
- mapear escopo e fora de escopo;
- identificar riscos de seguranca;
- mapear modulos e fronteiras;
- gerar matriz tecnica;
- gerar roadmap macro;
- gerar especificacao tecnica / design tecnico;
- gerar roadmap detalhado;
- marcar pontos de revisao humana;
- preparar criterios de aceite travados.

Criterio de pronto:

- a skill consegue guiar um usuario nao tecnico;
- a skill sabe quando pedir mais input;
- a skill sabe quando nao codar;
- a skill gera documentos no formato dos templates.

## Fase 4 - Adaptar Skill De Build

Objetivo:

- adaptar a execucao para obedecer os artefatos do framework;
- garantir que agentes implementem apenas subetapas aprovadas;
- impedir alteracao dos criterios de aceite travados pelo executor.

Responsabilidades da build:

- ler matriz, roadmap e roadmap detalhado;
- ler design tecnico quando existir;
- executar apenas subetapas liberadas;
- respeitar escopo e arquivos definidos;
- nao alterar criterios travados;
- criar ou rodar testes definidos;
- reportar divergencias;
- escalar para humano quando tocar auth, segredo, dado pessoal, permissao ou migracao sensivel.

Criterio de pronto:

- a build trabalha por subetapa;
- cada subetapa tem PRD ou briefing proprio;
- CI/testes determinam entregas automaticas quando permitido;
- entregas sensiveis exigem revisao humana.

## Fase 5 - Criar Modelo De PRD Por Subetapa

Objetivo:

- transformar cada item do roadmap detalhado em uma tarefa executavel;
- garantir que agente receba contexto suficiente sem reabrir decisoes travadas.

O PRD de subetapa deve conter:

- objetivo;
- escopo;
- fora de escopo;
- arquivos ou modulos afetados;
- criterios de aceite travados;
- testes que validam;
- riscos;
- dependencias;
- portao automatico ou humano.

Criterio de pronto:

- cada subetapa pode virar issue;
- executor entende o que deve fazer;
- revisor entende como validar;
- usuario nao tecnico consegue acompanhar status.

## Fase 5.1 - Definir Templates Auxiliares

Objetivo:

- documentar os artefatos auxiliares que completam o ciclo operacional do framework.

Templates auxiliares recomendados:

- `prd.template.md`: briefing executavel por subetapa;
- `adr.template.md`: registro de decisao arquitetural, quando nao houver skill externa para ADR;
- `gates-ci.template.md`: padrao de gates automaticos e humanos;
- `homologacao.template.md`: roteiro de validacao com a area solicitante.

Criterio de pronto:

- todo artefato referenciado pelos templates principais existe ou possui uma integracao declarada;
- nenhum agente depende de contexto solto da conversa para entender como executar ou validar uma subetapa.

## Fase 6 - Definir Gates E CI Padrao

Objetivo:

- criar regras objetivas para aceitar ou bloquear entregas;
- separar verificacoes automaticas de revisoes humanas.

Gates automaticos sugeridos:

- lint;
- typecheck;
- unit tests;
- integration tests;
- e2e smoke tests;
- scan de secrets;
- SAST basico;
- validacao de migrations;
- verificacao de arquivos sensiveis.

Gates humanos sugeridos:

- auth;
- autorizacao;
- dados pessoais;
- dados financeiros;
- storage privado;
- mudanca de permissao;
- migracao destrutiva;
- exclusao ou baixa;
- integracao externa sensivel.

Criterio de pronto:

- cada etapa do roadmap indica seu gate;
- cada subetapa define testes esperados;
- criterio travado nao pode ser alterado pelo agente executor.

## Fase 7 - Rodar Um Modulo Piloto

Objetivo:

- testar o framework em um modulo real antes de aplicar no sistema inteiro.

Modulo recomendado:

- `auth-admin`

Motivo:

- e fundacional;
- valida Firebase Auth, usuarios internos, permissoes, auditoria e bloqueios;
- exercita o ponto mais sensivel do framework: seguranca.

Entregaveis:

- matriz do modulo;
- roadmap do modulo;
- design tecnico do modulo;
- roadmap detalhado do modulo;
- PRDs das primeiras subetapas;
- testes de seguranca iniciais;
- relatorio de aprendizados.

Criterio de pronto:

- usuario pendente nao acessa;
- usuario inativo nao acessa;
- usuario sem perfil nao acessa;
- admin ativo gerencia usuarios;
- autorizacao e validada no backend;
- testes demonstram os bloqueios.

## Fase 8 - Documentar E Empacotar O Framework

Objetivo:

- transformar o piloto em um processo reutilizavel.

Entregaveis:

- README do framework;
- guia para usuario nao tecnico;
- guia para agente planejador;
- guia para agente executor;
- templates finais;
- estrutura de pastas padrao;
- exemplos preenchidos;
- checklist de inicio de projeto;
- checklist de homologacao.

Criterio de pronto:

- um novo projeto consegue usar o framework sem depender da conversa original;
- o usuario entende quais decisoes precisa validar;
- agentes sabem quando planejar, quando construir e quando escalar.

## Ordem Recomendada

1. Reformatar a matriz atual do piloto 3A RIVA para o template oficial.
2. Reformatar o roadmap macro para o template oficial.
3. Criar o template de design tecnico.
4. Criar o design tecnico inicial do piloto.
5. Criar o roadmap detalhado inicial.
6. Ajustar os templates com os aprendizados.
7. Criar estrutura `sdd/`.
8. Criar skill `sdd-planning`.
9. Adaptar skill de build.
10. Criar PRD template.
11. Definir gates automaticos e humanos.
12. Rodar modulo piloto `auth-admin`.
13. Consolidar documentacao do framework.

## Riscos

- criar skill antes de validar os artefatos no piloto;
- deixar criterio de aceite editavel pelo agente executor;
- misturar input bruto com documento validado;
- gerar roadmap sem matriz validada;
- colocar detalhe tecnico mutavel demais na matriz;
- pular o design tecnico e tentar jogar modelagem fina direto no roadmap detalhado;
- codar antes do Portao 4;
- tratar seguranca como checklist final, nao como requisito de desenho;
- criar estrutura pesada demais para projetos pequenos;
- depender de contexto de conversa em vez de arquivos versionados.

## Definicao De Sucesso

O framework sera considerado validado quando:

- um usuario nao tecnico conseguir revisar a matriz e os portoes;
- agentes conseguirem executar subetapas sem reinterpretar o projeto;
- criterios de aceite forem objetivos e testaveis;
- seguranca estiver presente desde a matriz;
- design tecnico concentrar as decisoes de implementacao que nao pertencem a matriz;
- modulo piloto passar pelos gates definidos;
- os documentos forem reutilizaveis em outro projeto.
