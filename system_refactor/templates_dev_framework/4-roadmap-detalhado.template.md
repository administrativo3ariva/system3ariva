# Template - Roadmap Detalhado

Este e o artefato operacional do framework SDD. Ele vem depois da Matriz Tecnica, do Roadmap Macro e do Design Tecnico.

Cada subetapa deste documento deve poder virar uma issue, tarefa ou execucao delegada para agente.

Regra de ouro:

- criterios de aceite travados nao podem ser alterados pelo agente executor;
- testes travados nao podem ser removidos ou enfraquecidos pelo agente executor;
- se criterio ou teste estiver incorreto, o agente deve escalar para revisao humana;
- detalhes de implementacao devem respeitar o design tecnico validado.

## 1. Metadados E Status

| Campo | Valor |
| --- | --- |
| Projeto | `<nome do projeto>` |
| Escopo | `global` ou `modulo <X>` |
| Area solicitante | `<area ou cliente interno>` |
| Responsavel por travar criterios | `<nome>` |
| Responsavel tecnico | `<nome>` |
| Status | `Rascunho` |
| Versao | `v0.1` |
| Data | `AAAA-MM-DD` |
| Baseado na Matriz Tecnica | `<path + versao>` |
| Baseado no Roadmap Macro | `<path + versao>` |
| Baseado no Design Tecnico | `<path + versao>` |
| Artefato anterior | `Design Tecnico` |
| Artefato seguinte | `Issues/PRDs/Execucao` |

Status permitidos:

- `Rascunho`
- `Em revisao`
- `Validado`
- `Em execucao`
- `Concluido`
- `Substituido`

## 2. Legenda De Gates

- `AUTO`: CI verde + testes travados + verificacoes automaticas.
- `HUMANO`: exige sign-off humano mesmo com CI verde.
- `BLOQUEADO`: depende de decisao, input, credencial, ambiente ou revisao.

Gates humanos obrigatorios quando a subetapa tocar:

- auth/autorizacao;
- segredos;
- dados pessoais;
- dados financeiros;
- storage privado;
- migrations destrutivas;
- mudanca de permissao/papel;
- integracao externa sensivel;
- exclusao, cancelamento ou baixa.

## 3. Visao De Etapas

| Etapa Macro | Objetivo | Design tecnico relacionado | Gate padrao | Status |
| --- | --- | --- | --- | --- |
| `E1` | `<objetivo>` | `<path/secao>` | `<AUTO/HUMANO>` | `Pendente` |

## 4. Subetapas

### Subetapa `<E1.S1>` - `<titulo>` - `<AUTO/HUMANO/BLOQUEADO>`

| Campo | Valor |
| --- | --- |
| Etapa macro | `<E1>` |
| Objetivo | `<objetivo claro em 1 frase>` |
| Design tecnico de referencia | `<path + secao>` |
| PRD | `<path ou /prd E1.S1>` |
| Execucao | `<agente/delegado/responsavel>` |
| Status | `Pendente` |

#### Escopo

- `<o que deve ser feito>`
- `<o que deve ser criado/alterado em termos de area, modulo ou arquivo>`

#### Fora De Escopo

- `<o que nao deve ser feito nesta subetapa>`

#### Dependencias

- `<subetapa ou decisao necessaria>`

#### Impacto

| Tipo | Impacto | Observacoes |
| --- | --- | --- |
| Seguranca | `<nenhum/baixo/medio/alto>` | `<observacao>` |
| Dados/migration | `<nenhum/baixo/medio/alto>` | `<observacao>` |
| UX | `<nenhum/baixo/medio/alto>` | `<observacao>` |
| Integracao | `<nenhum/baixo/medio/alto>` | `<observacao>` |

#### Criterios De Aceite Travados

- [ ] `<criterio testavel 1>`
- [ ] `<criterio testavel 2>`
- [ ] `<criterio testavel 3>`

#### Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Unit | `<path>` | `<regra>` | `-` | `<sim/nao>` |
| Integration | `<path>` | `<fluxo/API/db>` | `-` | `<sim/nao>` |
| E2E/Smoke | `<path>` | `<jornada>` | `-` | `<sim/nao>` |
| Security | `<path/scan>` | `<auth/secrets/upload>` | `<abuse case da matriz sec. 6>` | `<sim/nao>` |
| Manual | `<roteiro>` | `<validacao humana>` | `-` | `<sim/nao>` |

#### Gate

| Campo | Valor |
| --- | --- |
| Tipo | `<AUTO/HUMANO/BLOQUEADO>` |
| Justificativa | `<por que este gate>` |
| Evidencia exigida | `<CI/testes/screenshot/revisao/log>` |
| Aprovador humano, se aplicavel | `<nome/papel>` |

#### Rollback Ou Reversao

- `<como desfazer ou mitigar se der errado>`

#### Definition Of Done

- [ ] Implementacao dentro do escopo.
- [ ] Criterios de aceite travados atendidos.
- [ ] Testes obrigatorios passando.
- [ ] Sem alteracao indevida em criterios/testes travados.
- [ ] Documentacao/PRD atualizado quando aplicavel.
- [ ] Gate concluido.

## 5. Sequencia De Execucao

| Ordem | Subetapa | Depende de | Pode rodar em paralelo com | Observacoes |
| --- | --- | --- | --- | --- |
| `1` | `<E1.S1>` | `-` | `<E1.S2>` | `<observacao>` |

## 6. Mapa De Issues

| Subetapa | Issue | PR | Status | Observacoes |
| --- | --- | --- | --- | --- |
| `<E1.S1>` | `<link>` | `<link>` | `<status>` | `<observacao>` |

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

Antes de iniciar execucao por agentes, validar:

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
- [ ] Validado por `<responsavel>` em `AAAA-MM-DD`.

## 9. Historico De Alteracoes

| Versao | Data | Autor | Mudanca | Status resultante |
| --- | --- | --- | --- | --- |
| `v0.1` | `AAAA-MM-DD` | `<nome>` | `Criacao inicial` | `Rascunho` |

