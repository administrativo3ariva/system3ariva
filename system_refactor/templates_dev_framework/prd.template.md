# Template - PRD De Subetapa

Este artefato transforma uma subetapa do Roadmap Detalhado em um briefing executavel para agente ou delegado.

Regra:

- o PRD nao pode contradizer a matriz, o roadmap macro, o design tecnico ou o roadmap detalhado;
- criterios de aceite e testes travados devem ser copiados do roadmap detalhado;
- se o executor identificar problema em criterio ou teste, deve escalar para revisao humana.

## 1. Metadados

| Campo | Valor |
| --- | --- |
| Projeto | `<nome do projeto>` |
| Subetapa | `<E1.S1>` |
| Titulo | `<titulo>` |
| Escopo do documento | `<Global/Modulo/Feature/Subfeature>` |
| Responsavel por criterios | `<nome>` |
| Executor | `<agente/delegado>` |
| Status | `Rascunho` |
| Data | `AAAA-MM-DD` |
| Roadmap Detalhado | `<path + versao>` |
| Design Tecnico | `<path + secao>` |

## 2. Objetivo

`<Descrever em 1 frase o que esta subetapa entrega.>`

## 3. Contexto Necessario

- `<contexto minimo para executar sem reabrir decisoes>`
- `<referencias a matriz/design/roadmap>`

## 4. Escopo

- `<o que deve ser feito>`

## 5. Fora De Escopo

- `<o que nao deve ser feito nesta subetapa>`

## 6. Arquivos Ou Areas Afetadas

| Area/Arquivo | Acao esperada | Observacoes |
| --- | --- | --- |
| `<path ou area>` | `<criar/alterar/remover>` | `<observacao>` |

## 7. Criterios De Aceite Travados

- [ ] `<criterio do roadmap detalhado>`
- [ ] `<criterio do roadmap detalhado>`

## 8. Testes Que Validam

| Tipo | Teste/Arquivo | Obrigatorio? |
| --- | --- | --- |
| Unit | `<path>` | `<sim/nao>` |
| Integration | `<path>` | `<sim/nao>` |
| E2E/Smoke | `<path>` | `<sim/nao>` |
| Security | `<path/scan>` | `<sim/nao>` |
| Manual | `<roteiro>` | `<sim/nao>` |

## 9. Gate

| Campo | Valor |
| --- | --- |
| Tipo | `<AUTO/HUMANO/BLOQUEADO>` |
| Justificativa | `<motivo>` |
| Evidencia exigida | `<CI/testes/screenshot/revisao>` |
| Aprovador humano | `<nome/papel>` |

## 10. Riscos E Cuidados

- `<risco>`
- `<cuidado de seguranca/dados/UX>`

## 11. Definition Of Done

- [ ] Implementacao respeita escopo.
- [ ] Fora de escopo nao foi implementado.
- [ ] Criterios travados atendidos.
- [ ] Testes obrigatorios passam.
- [ ] Nenhum criterio/teste travado foi alterado pelo executor.
- [ ] Evidencias foram anexadas no PR/issue.

