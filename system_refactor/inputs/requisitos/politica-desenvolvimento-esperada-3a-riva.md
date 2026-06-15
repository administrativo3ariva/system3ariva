# Politica De Desenvolvimento Esperada - 3A RIVA System

> Convertido a partir do PDF PolíticaDesenvolvimentoEsperada - 3A RIVA System.pdf.
> Este arquivo serve como input versionavel para a matriz tecnica, roadmap e design tecnico do piloto SDD.

## Observacoes De Conversao

- A conversao preserva o conteudo textual do PDF e organiza por paginas para facilitar conferencia.
- As tabelas do PDF podem exigir revisao manual antes de virar catalogo RN/RF/RNF definitivo.
- Acentos foram preservados conforme extraidos do PDF.

## Pagina 1

Stefânia Márcia Otoni Lucas Eduardo Fonseca de Carvalho POLÍTICA DE DESENVOLVIMENTO: Sistema Administrativo Belo Horizonte


## Pagina 2

Sumário

### 1. POLÍTICA DE DESENVOLVIMENTO DE SISTEMAS ............................................3

#### 1.1. Obrigações e Requisitos .......................................................................................3

### 2. ANÁLISE DE VIABILIDADE ........................................................................................4

#### 2.1. Viabilidade Técnica ...............................................................................................4

#### 2.2. Viabilidade Econômica .........................................................................................6

#### 2.3. Viabilidade Operacional .......................................................................................8

#### 2.4. Viabilidade Legal e Regulatória ..........................................................................9

### 3. REGRAS DE NEGÓCIO E LEVANTAMENTO DE REQUISITOS ...................... 11

#### 3.1. Levantamento de Requisitos ..............................................................................15

### 4. REVISÃO ........................................................................................................................21


## Pagina 3

### 1. POLÍTICA DE DESENVOLVIMENTO DE SISTEMAS

Antes do desenvolvimento de qualquer sistema, automação ou solução digital interna, é necessário compreender com clareza qual problema será resolvido, quais áreas serão impactadas e quais ganhos operacionais são esperados. A finalidade desta etapa é garant ir que o sistema desenvolvido não seja apenas uma solução técnica, mas uma ferramenta aderente às necessidades reais da 3A RIV A Investimentos.

#### 1.1. Obrigações e Requisitos

O Sistema Administrativo 3A RIVA Foi concebido para centralizar e padronizar processos administrativos internos, contemplando módulos de Estoque, Inventário Patrimonial, Financeiro, Facilities. A solução busca reduzir a dependência de controles manuais, planilhas dispersas e acompanhamentos fragmentados, oferecendo uma plataforma única para registro, consulta, rastreabilidade e análise das operações administrativas. O sistema atende a uma demanda real da empresa, pois organiza processos que impactam diretamente a rotina operacional, como controle de materiais, movimentações de estoque, gestão de ativos, solicitações financeiras, despesas, manutenção predial, dashboard s e controle de usuários. Além disso, contribui para a redução de gargalos internos, maior previsibilidade das informações, melhoria na tomada de decisão e fortalecimento da governança administrativa. Do ponto de vista de aderência cultural, o projeto está alinhado à necessidade de eficiência, controle, rastreabilidade e padronização dos processos internos da 3A RIVA. A solução foi desenvolvida considerando o equilíbrio entre entrega de valor ao negócio, segurança, usabilidade e compatibilidade com o ambiente corporativo existente. Como métricas de acompanhamento, recomenda-se avaliar periodicamente:

- Redução de retrabalho administrativo;
- Redução do tempo gasto em conferências manuais;
- Volume de movimentações registradas no sistema;
- Percentual de solicitações financeiras classificadas corretamente;
- Acompanhamento do orçamento realizado versus orçado;
- Redução de compras duplicadas ou desnecessárias;
- Nível de adoção pelos usuários;
- Quantidade de ativos patrimoniais cadastrados e rastreados;

## Pagina 4

- Cumprimento de prazos nas tarefas de facilities;
- Consistência dos dados utilizados em dashboards e relatórios.
Dessa forma, o sistema se enquadra como uma solução de apoio operacional e gerencial, com potencial para melhorar a eficiência administrativa e fortalecer os controles internos da empresa.

### 2. ANÁLISE DE VIABILIDADE

Antes de qualquer desenvolvimento ser iniciado, é necessário avaliar se o projeto é viável nos aspectos técnico, econômico, operacional e de conformidade. Esta etapa evita desperdício de recursos em projetos que não podem ser concluídos ou que não trarão benefício real para a 3A RIVA Investimentos.

#### 2.1. Viabilidade Técnica

Avaliar se o Departamento de Tecnologia possui ou pode adquirir os recursos necessários para desenvolver e manter o sistema. Perguntas a responder:

#### 2.1.1. A equipe atual tem conhecimento técnico necessário?

Sim. O desenvolvimento do sistema demonstrou viabilidade técnica, uma vez que a solução foi estruturada e concluída dentro do prazo estimado de dois meses, contemplando módulos administrativos essenciais, como Estoque, Inventário Patrimonial, Financeiro, Facilities e Administração. A construção do sistema envolveu funcionalidades de autenticação, controle de usuários, permissões por perfil, dashboards, regras de negócio, integração documental, registros operacionais e rotinas automatizadas. Isso indica que os recursos técnicos necessários estavam disponíveis ou puderam ser adequadamente utilizados ao longo do projeto. Além disso, o sistema foi desenvolvido com foco em uso corporativo interno, priorizando segurança, rastreabilidade, padronização visual e aderência aos processos administrativos da 3A RIVA. Dessa forma, entende -se que a equipe responsável possuiu capacidade técnica suficiente para desenvolver, ajustar e entregar a solução de acordo com os objetivos definidos.


## Pagina 5

#### 2.1.2. A tecnologia escolhida é compatível com o ambiente da 3A RIVA?

Sim. A tecnologia escolhida é compatível com o ambiente da 3A RIVA, pois o sistema foi concebido como uma plataforma web corporativa, acessível de forma centralizada e adequada ao uso interno da empresa. A solução respeita a identidade visual institucional, utiliza autenticação de usuários, controle de permissões e estrutura modular, permitindo que diferentes áreas administrativas utilizem o sistema conforme suas atribuições. A compatibilidade também se evidencia pela possibilidade de incorporação do sistema ao ambiente já utilizado pela empresa, sem necessidade de substituição imediata de sistemas existentes. A proposta permite que a ferramenta funcione como uma camada administrativa complementar, centralizando dados, fluxos e indicadores operacionais sem gerar ruptura brusca na infraestrutura atual.

#### 2.1.3. O sistema precisa integrar com sistemas existentes? É possível?

Sim. O sistema deverá ser integrado ao ambiente corporativo da 3A RIVA por meio de iFrame, permitindo sua disponibilização dentro de uma estrutura já conhecida pelos usuários e facilitando o acesso interno. Essa forma de integração é tecnicamente viável e adequada para o estágio atual do projeto, pois permite incorporar a solução ao ecossistema digital da empresa sem exigir, inicialmente, uma integração complexa via API ou alteração profunda nos sistemas já existentes. A integração por iFrame também reduz barreiras de implantação, facilita a adoção pelos usuários e preserva a independência técnica da aplicação, mantendo o sistema administrativo operando em seu próprio ambiente, mas acessível a partir da interface corporativa da 3A RIVA. Futuramente, caso haja necessidade, poderão ser avaliadas integrações mais profundas com bases internas, sistemas financeiros, intranet, autenticação corporativa ou demais ferramentas utilizadas pela empresa.

#### 2.1.4. O prazo estimado é factível com os recursos disponíveis?

Sim. O prazo estimado mostrou -se factível, uma vez que o sistema foi desenvolvido em aproximadamente dois meses, período compatível com a complexidade da solução e com os recursos disponíveis.


## Pagina 6

Considerando o escopo entregue — incluindo módulos de Estoque, Inventário Patrimonial, Financeiro, Facilities, Administração, autenticação, dashboards, regras de negócio e controles internos — o prazo foi adequado para a construção de uma primeira versão funcional e validável. A entrega dentro desse período indica que houve equilíbrio entre velocidade, qualidade e valor para o negócio. O desenvolvimento priorizou funcionalidades com impacto direto nos processos administrativos da 3A RIVA, permitindo que o sistema atendesse a uma demanda real sem comprometer os requisitos mínimos de segurança, rastreabilidade, usabilidade e compatibilidade com o ambiente corporativo.

#### 2.2. Viabilidade Econômica

Avaliar se o investimento no sistema trará retorno ou economia para a empresa. Perguntas a responder:

#### 2.2.1. Qual o custo estimado de desenvolvimento (horas de equipe, licenças, infraestrutura)?

O custo direto estimado para o desenvolvimento do sistema foi de aproximadamente R$ 250,00, referente à assinatura da plataforma Lovable utilizada durante o período de construção da solução. Além do custo financeiro direto, houve dedicação interna estimada em aproximadamente 100 horas de trabalho, considerando levantamento de necessidades, estruturação dos módulos, construção das telas, ajustes funcionais, validações e adequações ao ambiente da 3A RIVA. Para fins gerenciais, essas horas podem ser consideradas como custo de oportunidade interno, uma vez que foram realizadas com recursos próprios, sem contratação externa de desenvolvimento. Assim, o projeto apresenta baixo desembolso financeiro direto e elevado aproveitamento de recursos internos.

#### 2.2.2. Qual o custo estimado de manutenção mensal/anual?

Não há custo mensal ou anual de manutenção previsto para a primeira versão do sistema. A solução foi estruturada para operar sem dependência de manutenção recorrente contratada, sendo necessária apenas eventual atuação pontual em caso de melhorias evolutivas, ajustes de regra de negócio ou adaptações futuras solicitadas pela empresa.


## Pagina 7

Dessa forma, o custo de manutenção ordinária é estimado como zero, ressalvadas futuras evoluções de escopo, novas integrações, mudanças de infraestrutura, novas licenças ou alterações solicitadas pelas áreas usuárias.

#### 2.2.3. Qual a economia ou receita adicional esperada com o sistema?

A economia esperada do sistema não está relacionada diretamente à geração de receita, mas sim à redução de desperdícios, ganho de produtividade, melhoria de controle e prevenção de retrabalho administrativo. O sistema centraliza processos que antes poderiam depender de controles manuais, planilhas dispersas, registros informais ou acompanhamento fragmentado entre áreas. Com isso, espera-se ganho econômico em quatro frentes principais:

- Redução de retrabalho administrativo, pela centralização de informações de estoque,
inventário, financeiro, facilities e usuários em uma única plataforma.

- Prevenção de desperdícios e compras desnecessárias, por meio do acompanhamento de
estoque, movimentações, consumo, saldo disponível e estoque mínimo.

- Melhoria no controle orçamentário, com acompanhamento de despesas por filial,
macrobloco, categoria e centro de custo.

- Redução de falhas operacionais, pela rastreabilidade de solicitações, movimentações,
documentos, responsáveis e status. Nesse cenário conservador, o sistema teria potencial de recuperar seu custo direto de desenvolvimento em menos de um mês de uso, considerando apenas o ganho estimado de produtividade. Qualquer economia adicional obtida pela prevenção de compras duplicadas, redução de desperdícios, melhor controle de estoque ou maior precisão no acompanhamento orçamentário ampliaria o retorno econômico do projeto.

#### 2.2.4. O projeto cabe no orçamento disponível?

Sim. O projeto cabe no orçamento disponível, pois demandou baixo desembolso financeiro direto, estimado em aproximadamente R$ 250,00, referente à assinatura da ferramenta utilizada no desenvolvimento. Além disso, não houve contratação externa, aquisição relevante de infraestrutura ou custo recorrente obrigatório de manutenção. Considerando o baixo custo de implantação, o aproveitamento de horas internas e o potencial de ganho operacional, o projeto apresenta boa relação custo-benefício e é economicamente viável para a 3A RIVA.


## Pagina 8

#### 2.3. Viabilidade Operacional

Avaliar se os usuários conseguirão e aceitarão utilizar o sistema no dia a dia. Perguntas a responder:

#### 2.3.1. Os usuários finais têm capacidade técnica para usar o sistema?

Sim. Os usuários finais possuem capacidade técnica para utilizar o sistema, uma vez que a solução foi desenvolvida em ambiente web, com interface visual, módulos organizados por área e fluxos compatíveis com atividades administrativas já realizadas no dia a dia da empresa. O sistema não exige conhecimento técnico avançado dos usuários. Suas funcionalidades estão estruturadas de forma operacional, com telas de cadastro, consulta, movimentação, dashboards, filtros e relatórios, permitindo que colaboradores das áreas envolvidas utilizem a ferramenta com treinamento básico e orientação inicial.

#### 2.3.2. A mudança de processo será bem aceita?

Sim. A mudança tende a ser bem aceita, pois o sistema não substitui a lógica operacional da área, mas organiza e centraliza processos já existentes. A proposta é reduzir controles paralelos, retrabalho, dependência de planilhas isoladas e dificuldade de acompanhamento das informações. Dessa forma, o sistema tende a ser percebido como uma ferramenta de apoio à rotina, e não como uma ruptura operacional. A aceitação também é favorecida pela integração por iFrame ao ambiente corporativo da 3A RIVA, o que facilita o acesso, preserva a familiaridade dos usuários com o ecossistema interno e reduz barreiras de adoção.

#### 2.3.3. É necessário treinamento? Quanto tempo?

Sim. Recomenda -se treinamento inicial de aproximadamente 4 horas, suficiente para apresentar a estrutura do sistema, os principais módulos, as regras de uso e os fluxos operacionais. Esse treinamento é considerado suficiente para a primeira etapa de implantação, podendo ser complementado posteriormente com materiais de apoio, manuais rápidos ou treinamentos específicos por área. A capacitação pode ser organizada da seguinte forma:


## Pagina 9

#### 2.3.4. O sistema realmente resolve um problema real (fit cultural)?

Sim. O sistema resolve um problema real ao aumentar o controle administrativo, reduzir desperdícios e melhorar a rastreabilidade dos processos internos da 3A RIVA. A solução atende a uma necessidade prática de centralização e padronização de informações relacionadas a estoque, inventário patrimonial, solicitações financeiras, despesas, facilities, usuários e permissões. Com isso, permite maior controle sobre o consumo de materiais, a alocação de ativos, o acompanhamento de despesas, a execução de manutenções e a geração de indicadores gerenciais. Além disso, o sistema contribui para prevenir desperdícios ao permitir melhor visualização de saldos, movimentações, responsáveis, centros de custo, categorias e orçamento realizado. Dessa forma, a empresa passa a ter mais previsibilidade, rastreabilidade e capacidade de tomada de decisão, reduzindo riscos de compras duplicadas, perdas de informações, retrabalho e ausência de controle sobre processos administrativos.

#### 2.4. Viabilidade Legal e Regulatória

Avaliar se o sistema está em conformidade com leis e regulamentações aplicáveis ao setor de investimentos. Perguntas a responder:

#### 2.4.1. O sistema tratará dados pessoais? Está em conformidade com a LGPD (Lei

13.709/2018)? O sistema não tem como finalidade tratar dados pessoais sensíveis, dados de clientes, dados de investidores, informações financeiras pessoais ou dados regulatórios vinculados à atividade-fim da empresa. Sua finalidade é administrativa e operacional, voltada ao controle interno de estoque, patrimônio, despesas, facilities e usuários. Etapa Conteúdo Duração Visão geral Objetivo do sistema, acesso, perfis, permissões e navegação 1 hora Estoque e Inventário Produtos, movimentações, NF/OCR, ativos, responsáveis e localização 1 hora Financeiro Solicitações, despesas, orçamento, centros de custo, dashboards e relatórios 1 hora Facilities e Administração Tarefas, Kanban, calendário, usuários, boas práticas e dúvidas 1 hora


## Pagina 10

Entretanto, por possuir autenticação, cadastro de usuários, responsáveis e colaboradores vinculados a movimentações ou registros internos, pode haver tratamento limitado de dados pessoais cadastrais, como nome, e-mail corporativo, perfil de acesso e vínculo operacional. Por esse motivo, recomenda-se que o sistema observe boas práticas mínimas de proteção de dados, tais como:

- Acesso restrito por usuário e senha;
- Utilização de permissões por perfil;
- Limitação dos dados coletados ao necessário para a operação;
- Rastreabilidade de ações relevantes;
- Não exposição pública de informações internas;
- Controle de usuários ativos e inativos;
- Revisão periódica dos acessos concedidos.
Dessa forma, entende-se que o risco legal é baixo, desde que o sistema permaneça restrito ao uso interno, não trate dados sensíveis e siga boas práticas de segurança, minimização de dados e controle de acesso.

#### 2.4.2. O sistema precisa atender a alguma exigência da CVM ou ANBIMA?

Não. O sistema não possui finalidade de distribuição de produtos financeiros, gestão de carteiras, recomendação de investimentos, atendimento a clientes, registro de ordens, suitability, cadastro de investidores ou reporte regulatório. Sua aplicação é administrativa e operacional, voltada ao suporte interno da empresa. Portanto, não há, neste escopo, necessidade de atendimento direto a exigências específicas da CVM ou da ANBIMA. Ainda assim, por se tratar de uma empresa do setor de investimentos, recomenda- se que o sistema siga boas práticas internas de controle, segurança, segregação de acessos e rastreabilidade, mesmo que não esteja diretamente submetido a uma obrigação regulatória específica.


## Pagina 11

#### 2.4.3. Há necessidade de retenção de logs ou mensagens por período mínimo?

Não há, para este sistema, uma exigência regulatória específica de retenção diretamente pela CVM ou ANBIMA, nem registra comunicações com clientes ou operações financeiras da atividade-fim da empresa. Contudo, recomenda-se a retenção de registros operacionais básicos para fins de controle interno, suporte, segurança e auditoria administrativa. Esses registros podem incluir data de criação, data de atualização, usuário responsável, alterações relevantes, movimentações de estoque, alterações patrimoniais, solicitações financeiras e ações administrativas. Assim, embora não haja obrigação regulatória específica de retenção mínima, é recomendável manter logs operacionais pelo período definido pela política interna de tecnologia e auditoria da 3A RIVA.

#### 2.4.4. O sistema permite rastreabilidade e auditoria?

Sim, o sistema permite rastreabilidade e auditoria em nível operacional e administrativo. Ele registra informações essenciais como usuários, status, datas de criação e atualização, movimentações de estoque, responsáveis, documentos vinculados, solicitações financeiras, alterações patrimoniais e tarefas de facilities. Essa estrutura permite acompanhar quem realizou determinada ação, quando ela ocorreu e qual foi o impacto operacional dentro do sistema. Também contribui para maior controle interno, conferência de informações, revisão de processos e identificação de inconsistências. Entretanto, é importante destacar que a rastreabilidade prevista é adequada ao escopo administrativo do sistema. Ela não deve ser tratada como uma solução completa de auditoria regulatória, trilha imutável de logs ou ferramenta formal de compliance financeiro.

### 3. REGRAS DE NEGÓCIO E LEVANTAMENTO DE REQUISITOS

Antes de qualquer codificação, é obrigatório que as regras de negócio e os requisitos funcionais e não funcionais sejam identificados, documentados e validados com o solicitante. Esta etapa garante que o sistema será construído sobre bases claras, evitando retrabalho e desalinhamento de expectativas.


## Pagina 12

Tabela — Regras de Negócio ID da Regra Descrição Origem Prioridade Sanção em caso de descumprimento RN- Nenhum recurso do sistema deve ser público; o usuário precisa estar autenticado e ativo para acessar qualquer módulo. TI / Segurança Alta Acesso bloqueado automaticamente até regularização do cadastro. RN- Contas recém-criadas devem iniciar como inativas e somente podem operar após liberação de um administrador. TI / Administração Alta Usuário impedido de acessar funcionalidades operacionais. RN- A gestão de papéis e permissões deve ser realizada apenas por usuários com perfil admin. TI / Administração Alta Alteração rejeitada pelo sistema e registrada para auditoria. RN- O sistema deve aplicar controle de acesso por papéis: admin, moderator e user. TI / Segurança Alta Funcionalidade bloqueada quando o perfil do usuário não possuir permissão. RN- Toda tabela operacional deve respeitar Row Level Security, permitindo leitura e gravação apenas por usuários autenticados e ativos. TI / Compliance Alta Operação negada pela política de segurança do banco de dados. RN- A quantidade atual dos produtos de estoque não pode ser editada manualmente; deve ser recalculada automaticamente pelas movimentações. Administrativo / Estoque Alta Alteração manual bloqueada ou sobrescrita pelo cálculo automático do sistema. RN- Toda movimentação de estoque deve registrar produto, quantidade, tipo de movimentação, data, responsável, observação e documento de origem quando aplicável. Administrativo / Estoque Alta Movimentação não concluída enquanto os campos obrigatórios não forem informados. RN- Notas Fiscais enviadas por OCR devem gerar registro do upload, JSON extraído e itens identificados antes de Administrativo / Estoque / Financeiro Alta Entrada de estoque não gerada até revisão e confirmação dos itens extraídos.


## Pagina 13

qualquer entrada definitiva no estoque. RN- O total calculado da Nota Fiscal deve ser validado contra o valor declarado antes de sua vinculação operacional ou financeira. Financeiro / Estoque Alta Nota Fiscal marcada como divergente e enviada para revisão manual. RN- A Nota Fiscal pode ser vinculada a uma solicitação de pagamento, conectando o recebimento físico ao ciclo financeiro. Financeiro / Estoque Média Solicitação permanece sem vínculo documental completo até correção. RN- Colaboradores cadastrados devem possuir vínculo obrigatório com filial, andar ou localização interna. Administrativo Alta Cadastro não salvo enquanto a localização obrigatória não for informada. RN- Para colaboradores e ativos localizados no BH-Matriz, 8º andar, deve ser exigida a seleção da sala 801 ou 803. Administrativo / Patrimônio Média Cadastro ou alteração de localização bloqueada até preenchimento da sala. RN- Ativos patrimoniais devem possuir código automático, categoria, descrição, filial, localização, responsável e estado de conservação. Administrativo / Patrimônio Alta Cadastro patrimonial incompleto não pode ser concluído. RN- Alterações de localização, responsável ou estado de conservação de ativos devem ser registradas para manter rastreabilidade patrimonial. Administrativo / Patrimônio Alta Alteração rejeitada ou registrada como pendente de ajuste documental. RN- Solicitações de pagamento devem conter empresa, fornecedor, valor, vencimento, categoria, centro de custo e descrição. Financeiro Alta Solicitação não enviada para aprovação ou pagamento. RN- A data de solicitação, request_date, deve ser a referência oficial para dashboards, relatórios e apuração financeira. Financeiro Alta Lançamento não deve compor relatórios financeiros até correção da data-base. RN- O orçamento operacional deve ser controlado por filial, macrobloco e Financeiro / Controladoria Alta Despesa fica pendente de classificação orçamentária.


## Pagina 14

categoria, comparando valores realizados versus orçados. RN- O orçamento deve ser consumido por despesas de cartão corporativo, solicitações pagas e lançamentos próprios. Financeiro / Controladoria Alta Valor não deve compor realizado orçamentário se não estiver em uma fonte válida. RN- Despesas recorrentes devem gerar execuções individuais para controle de cada competência ou parcela. Financeiro Média Parcela não controlada individualmente até geração do registro correspondente. RN- Tarefas de manutenção devem conter título, descrição, tipo, prioridade, responsável, prazo e status. Facilities Alta Tarefa não pode ser criada ou movimentada sem os campos obrigatórios. RN- Tarefas preventivas concluídas devem gerar automaticamente a próxima ocorrência conforme regra de recorrência. Facilities Média Próxima manutenção não é criada e deve ser revisada manualmente. RN- O módulo de Facilities não deve possuir controle de custo por usuário, por decisão explícita de produto. Facilities / Produto Média Solicitações de custo por usuário devem ser tratadas fora do escopo do módulo. RN- Toda ação destrutiva, como exclusão, cancelamento ou baixa, deve exigir confirmação por AlertDialog customizado. TI / Produto Alta Ação destrutiva bloqueada até confirmação explícita do usuário. RN- Diálogos nativos do navegador, como alert e confirm, não devem ser utilizados no produto. TI / Produto Média Implementação deve ser corrigida antes da homologação. RN- Valores monetários devem ser tratados com precisão decimal e exibidos em BRL com duas casas decimais. Financeiro / TI Alta Valor incorreto deve ser corrigido antes de compor relatórios. RN- Quantidades em KG devem ser exibidas com três casas decimais; demais unidades devem usar duas casas decimais. Estoque / TI Média Exibição ou cálculo deve ser ajustado antes da homologação.


## Pagina 15

RN- Produtos sem movimentação no período devem ser desconsiderados de indicadores executivos para evitar distorções. Administrativo / Estoque Média Indicador deve ser recalculado removendo produtos sem movimentação relevante. RN- Campos created_at e updated_at devem existir nas tabelas operacionais, com atualização automática de data de alteração. TI / Auditoria Alta Registro considerado não conforme para rastreabilidade.

#### 3.1. Levantamento de Requisitos

ID Descrição RN Priori dade Status Solicitante

- RF-001 O sistema deve permitir
login por e-mail e senha, validando se o usuário está ativo.

- RN-001 Alta Aprovado TI
- RF-002 O sistema deve permitir
recuperação e redefinição de senha por link seguro com token válido.

- RN-001 Alta Aprovado TI
- RF-003 O sistema deve cadastrar
novos usuários como inativos por padrão.

- RN-002 Alta Aprovado TI /
Administração

- RF-004 O sistema deve permitir que
administradores ativem e inativem usuários.

- RN-002 Alta Aprovado Administração
- RF-005 O sistema deve permitir que
administradores atribuam e removam papéis de usuário.

- RN-003 /
- RN-004
Alta Aprovado TI

- RF-006 O sistema deve restringir o
Painel Administrativo apenas a usuários com papel admin.

- RN-003 /
- RN-004
Alta Aprovado TI

- RF-007 O sistema deve aplicar
permissões por papel nos módulos de Estoque, Inventário, Financeiro, Facilities e Administração.

- RN-004 /
- RN-005
Alta Aprovado TI

- RF-008 O sistema deve permitir
cadastro de produtos com nome, unidade de medida, categoria, estoque mínimo e quantidade atual calculada.

- RN-006 Alta Aprovado Administrativo

## Pagina 16

- RF-009 O sistema deve registrar
movimentações de estoque do tipo entrada, saída e ajuste.

- RN-007 Alta Aprovado Administrativo
- RF-010 O sistema deve recalcular
automaticamente o saldo do produto após cada movimentação.

- RN-006 /
- RN-007
Alta Aprovado Administrativo / TI

- RF-011 O sistema deve permitir
upload de Nota Fiscal em PDF ou imagem para processamento por OCR.

- RN-008 Alta Aprovado Administrativo
- RF-012 O sistema deve gravar o
arquivo original, o JSON extraído e os itens identificados da Nota Fiscal.

- RN-008 Alta Aprovado Administrativo
/ TI

- RF-013 O sistema deve calcular o
total esperado da Nota Fiscal a partir do somatório dos itens extraídos.

- RN-009 Alta Aprovado Financeiro
- RF-014 O sistema deve permitir
revisão e confirmação dos itens extraídos antes de gerar movimentações de entrada no estoque.

- RN-008 /
- RN-009
Alta Aprovado Administrativo

- RF-015 O sistema deve permitir
vincular uma Nota Fiscal a uma solicitação de pagamento.

- RN-010 Média Validado Financeiro
- RF-016 O sistema deve permitir
cadastro de colaboradores com localização obrigatória.

- RN-011 Alta Aprovado Administrativo
- RF-017 O sistema deve exigir
seleção da sala 801 ou 803 quando a localização for BH-Matriz, 8º andar.

- RN-012 Média Aprovado Administrativo
- RF-018 O sistema deve permitir
cadastro de ativos patrimoniais com código automático.

- RN-013 Alta Aprovado Patrimônio
- RF-019 O sistema deve permitir
filtrar ativos por filial, categoria, estado de conservação e responsável.

- RN-013 /
- RN-014
Média Validado Patrimônio

- RF-020 O sistema deve registrar
alterações de localização,

- RN-014 Alta Aprovado Patrimônio

## Pagina 17

responsável e estado de conservação dos ativos.

- RF-021 O sistema deve permitir
cadastro e consulta de empresas, fornecedores, centros de custo, macroblocos e categorias.

- RN-015 /
- RN-017
Alta Aprovado Financeiro

- RF-022 O sistema deve permitir
criação de solicitações de pagamento com empresa, fornecedor, valor, vencimento, categoria, centro de custo e descrição.

- RN-015 Alta Aprovado Financeiro
- RF-023 O sistema deve permitir
anexar NF, boleto e comprovantes à solicitação de pagamento.

- RN-015 Alta Aprovado Financeiro
- RF-024 O sistema deve controlar o
status da solicitação de pagamento: em aberto, aprovada, paga e cancelada.

- RN-015 /
- RN-018
Alta Aprovado Financeiro

- RF-025 O sistema deve utilizar
request_date como data-base para relatórios, dashboards e séries temporais financeiras.

- RN-016 Alta Aprovado Financeiro
- RF-026 O sistema deve permitir
mapear fornecedores e categorias aos centros de custo.

- RN-017 Média Validado Financeiro
- RF-027 O sistema deve exibir
realizado versus orçado por filial, macrobloco e categoria.

- RN-017 /
- RN-018
Alta Aprovado Financeiro / Controladoria

- RF-028 O sistema deve permitir
cadastro de despesas recorrentes com regra de recorrência.

- RN-019 Média Validado Financeiro
- RF-029 O sistema deve gerar
execuções individuais para despesas recorrentes.

- RN-019 Média Validado Financeiro
- RF-030 O sistema deve permitir
criação de tarefas de manutenção preventiva e corretiva.

- RN-020 Alta Aprovado Facilities
- RF-031 O sistema deve permitir
visualização das tarefas em

- RN-020 Média Aprovado Facilities

## Pagina 18

Kanban com organização por status.

- RF-032 O sistema deve permitir
visualização das tarefas em calendário.

- RN-020 Média Aprovado Facilities
- RF-033 O sistema deve gerar
automaticamente nova ocorrência de tarefa preventiva após conclusão.

- RN-021 Média Validado Facilities
- RF-034 O sistema deve exibir
dashboards de Estoque, Inventário, Financeiro e Facilities.

- RN-017 /
- RN-020 /
- RN-027
Alta Aprovado Administração

- RF-035 O sistema deve exportar
relatórios financeiros em Excel com abas estruturadas e formatação avançada.

- RN-016 /
- RN-017
Média Validado Financeiro

- RF-036 O sistema deve solicitar
confirmação via AlertDialog customizado para exclusão, cancelamento ou baixa.

- RN-023 /
- RN-024
Alta Aprovado TI / Produto Tabela — Requisitos Não Funcionais ID Descrição Categoria Métrica Prioridade Status RNF -001 O sistema deve manter todos os recursos protegidos por autenticação. Segurança 100% das rotas privadas exigindo login Alta Aprovado RNF -002 O sistema deve utilizar Row Level Security nas tabelas do schema público. Segurança / Compliance RLS habilitado em todas as tabelas operacionais Alta Aprovado RNF -003 O sistema deve validar papéis por função segura no banco, evitando escalonamento de privilégios. Segurança Validação por has_role / security definer Alta Aprovado RNF -004 O sistema deve tratar valores Integridade de Dados Uso de numeric para valores e quantidades Alta Aprovado


## Pagina 19

financeiros e quantidades com tipo numérico de precisão decimal. RNF -005 O sistema deve exibir valores monetários em BRL com duas casas decimais. Usabilidade / Padronização Formato R$ 0,00 Média Aprovado RNF -006 O sistema deve exibir quantidades em KG com três casas decimais e demais unidades com duas casas decimais. Usabilidade / Padronização KG: 3 casas; demais: 2 casas Média Aprovado RNF -007 O sistema deve utilizar tema escuro SaaS com identidade navy/dourada da marca 3A Riva. Identidade Visual Aplicação do design system em todas as telas Média Aprovado RNF -008 O sistema deve utilizar tokens semânticos de design, evitando cores hardcoded nos componentes. Manutenibilidad e 100% dos componentes seguindo tokens do design system Média Validado RNF -009 O sistema deve utilizar AlertDialog customizado para ações destrutivas. Usabilidade / Segurança Operacional 100% das ações destrutivas com confirmação Alta Aprovado RNF -010 O sistema não deve utilizar alert ou confirm nativos do navegador. Padronização de Produto 0 ocorrências de diálogos nativos em produção Média Aprovado


## Pagina 20

RNF -011 O sistema deve registrar created_at e updated_at nas tabelas operacionais. Auditoria Campos presentes nas tabelas operacionais Alta Aprovado RNF -012 O sistema deve atualizar automaticament e updated_at quando houver alteração de registro. Auditoria / Integridade Trigger update_updated_at_col umn ativo Alta Aprovado RNF -013 O sistema deve manter rastreabilidade das movimentações críticas de estoque, patrimônio, financeiro e usuários. Auditoria / Compliance Registros vinculados a usuário, data e operação Alta Aprovado RNF -014 O processamento OCR deve ocorrer em Edge Function, sem exposição de credenciais no cliente. Segurança / Arquitetura Chave Gemini gerenciada no backend Alta Aprovado RNF -015 O sistema deve carregar listagens e dashboards em tempo adequado para uso operacional. Desempenho Até 3 segundos em volume padrão, a validar em homologação Média A validar RNF -016 O sistema deve ser compatível com navegadores web modernos. Compatibilidade Chrome, Edge e Firefox em versões atuais Média A validar


## Pagina 21

RNF -017 Relatórios financeiros exportados devem preservar estrutura, abas e formatação. Qualidade / Relatórios Exportação em Excel com formatação aplicada Média Validado RNF -018 O sistema deve manter consistência automática entre movimentações de estoque e saldo atual do produto. Integridade de Dados Saldo recalculado por trigger após movimentação Alta Aprovado RNF -019 Indicadores executivos devem desconsiderar registros sem movimentação relevante quando isso distorcer a análise. Qualidade Analítica Exclusão de ghost products nos indicadores Média Aprovado RNF -020 O sistema deve preservar a referência temporal oficial request_date em filtros, dashboards e relatórios financeiros. Integridade Analítica 100% dos relatórios financeiros usando request_date Alta Aprovado

### 4. REVISÃO

Com base na análise realizada, o Sistema 3A Riva — Administrativo demonstra viabilidade técnica, econômica, operacional e legal/regulatória para uso interno, dentro do escopo administrativo proposto. O projeto foi desenvolvido em prazo compatível com sua complexidade, apresentou baixo custo direto de implantação, não possui custo recorrente obrigatório de manutenção e oferece


## Pagina 22

potencial relevante de ganho operacional. Além disso, a solução atende a uma demanda real da empresa ao centralizar processos, reduzir controles paralelos, ampliar a rastreabilidade e apoiar a tomada de decisão por meio de dashboards e relatórios. A integração por iFrame torna a implantação mais simples e compatível com o ambiente corporativo da 3A RIVA, enquanto a estrutura modular permite evolução futura conforme novas necessidades forem identificadas. Dessa forma, recomenda -se a continuidade do processo de validação, homologação e implantação controlada do sistema, observando treinamento dos usuários, revisão periódica de acessos, acompanhamento de indicadores de adoção e eventuais ajustes evolutivos definidos pelas áreas envolvidas.
