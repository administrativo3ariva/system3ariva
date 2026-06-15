# Template - PRD De Subetapa

Este e o briefing executavel de uma unica subetapa do Roadmap Detalhado (Portao 4). Cada PRD transforma uma subetapa `<En.Sn>` em uma tarefa que um agente ou pessoa consegue executar sem reabrir decisoes ja travadas.

Regra de ouro:

- o PRD detalha COMO executar uma subetapa, dentro do que o Design Tecnico ja decidiu;
- criterios de aceite e testes travados aqui vem do Roadmap Detalhado e nao podem ser enfraquecidos pelo executor;
- se o PRD parecer incorreto ou insuficiente, o executor escala para revisao humana, nao improvisa.

## 1. Metadados E Status

| Campo | Valor |
| --- | --- |
| Subetapa | `<En.Sn>` |
| Titulo | `<titulo curto>` |
| Escopo | `global` ou `modulo <X>` |
| Etapa macro | `<En>` |
| Baseado no Design Tecnico | `<path + secao>` |
| Baseado no Roadmap Detalhado | `<path + subetapa>` |
| Responsavel por travar criterios | `<nome>` |
| Execucao | `<agente/delegado/responsavel>` |
| Gate | `<AUTO/HUMANO/BLOQUEADO>` |
| Status | `Rascunho` |
| Versao | `v0.1` |
| Data | `AAAA-MM-DD` |

Status permitidos:

- `Rascunho`
- `Em revisao`
- `Pronto para execucao`
- `Em execucao`
- `Concluido`
- `Substituido`

## 2. Objetivo

`<O que esta subetapa entrega, em 1 frase clara e verificavel.>`

## 3. Escopo

- `<o que deve ser feito>`
- `<o que deve ser criado ou alterado>`

## 4. Fora De Escopo

- `<o que NAO deve ser feito nesta subetapa>`

## 5. Arquivos Ou Modulos Afetados

| Arquivo/Modulo | Acao | Observacoes |
| --- | --- | --- |
| `<path/modulo>` | `<criar/alterar/remover>` | `<observacao>` |

## 6. Dependencias

- `<subetapa, decisao, credencial ou ambiente necessario antes de comecar>`

## 7. Criterios De Aceite Travados

> Copiados do Roadmap Detalhado. Nao podem ser alterados ou enfraquecidos pelo executor.

- [ ] `<criterio testavel 1>`
- [ ] `<criterio testavel 2>`
- [ ] `<criterio testavel 3>`

## 8. Testes Que Validam

| Tipo | Teste/Arquivo | O que valida | Abuse case de origem (matriz sec. 6) | Obrigatorio? |
| --- | --- | --- | --- | --- |
| Unit | `<path>` | `<regra>` | `-` | `<sim/nao>` |
| Integration | `<path>` | `<fluxo/API/db>` | `-` | `<sim/nao>` |
| E2E/Smoke | `<path>` | `<jornada>` | `-` | `<sim/nao>` |
| Security | `<path/scan>` | `<auth/secrets/upload>` | `<abuse case da matriz sec. 6>` | `<sim/nao>` |
| Manual | `<roteiro>` | `<validacao humana>` | `-` | `<sim/nao>` |

## 9. Riscos

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| `<risco>` | `<nenhum/baixo/medio/alto>` | `<mitigacao>` |

## 10. Gate E Aprovacao

| Campo | Valor |
| --- | --- |
| Tipo | `<AUTO/HUMANO/BLOQUEADO>` |
| Justificativa | `<por que este gate>` |
| Evidencia exigida | `<CI/testes/screenshot/revisao/log>` |
| Aprovador humano, se aplicavel | `<nome/papel>` |

Gate `HUMANO` obrigatorio quando a subetapa tocar: auth/autorizacao, segredos, dados pessoais, dados financeiros, storage privado, migrations destrutivas, mudanca de permissao/papel, integracao externa sensivel, exclusao/cancelamento/baixa.

## 11. Rollback Ou Reversao

- `<como desfazer ou mitigar se der errado>`

## 12. Definition Of Done

- [ ] Implementacao dentro do escopo.
- [ ] Criterios de aceite travados atendidos.
- [ ] Testes obrigatorios passando.
- [ ] Sem alteracao indevida em criterios/testes travados.
- [ ] Documentacao/PRD atualizado quando aplicavel.
- [ ] Gate concluido.
- [ ] Subetapa marcada como `Concluido` no Roadmap Detalhado.

## 13. Historico De Alteracoes

| Versao | Data | Autor | Mudanca | Status resultante |
| --- | --- | --- | --- | --- |
| `v0.1` | `AAAA-MM-DD` | `<nome>` | `Criacao inicial` | `Rascunho` |
