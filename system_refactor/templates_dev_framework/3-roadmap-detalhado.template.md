<!--
  TEMPLATE: Roadmap Detalhado (etapas → subetapas)
  ────────────────────────────────────────────────
  Este é o artefato OPERACIONAL do framework. Cada subetapa daqui vira uma
  Issue, e é contra ela que o delegado implementa.

  REGRA DE OURO: o "Critério de aceite" e os "Testes que validam" são 🔒 TRAVADOS
  — escritos pelo responsável, NÃO editáveis pelo delegado. É a única alavanca de
  controle real. Se o delegado puder mexer no critério ou nos testes de segurança,
  o portão vira teatro.

  Fluxo por subetapa (relembrando):
    /prd → revisor confere PRD vs critério → implementa → PR → CI roda os testes
    travados + lint + gitleaks + semgrep + batebola (consultiva) → veredito.

  Convenções:
    🔒  travado pelo responsável
    🤖  conclui sozinha se o portão automático ficar verde
    ⚠️  hard-escala: exige sign-off humano mesmo com CI verde
    <...> substitua
-->

# Roadmap Detalhado — <nome do módulo>

- **Status:** Rascunho
- **Versão:** v0.1
- **Baseado no Roadmap:** v<X> · **Matriz Técnica:** v<X>
- **Responsável (trava critérios):** <você>

---

## Legenda do portão de cada subetapa

- 🤖 **Auto-concluível** — CI verde + batebola sem reprovação → marca concluída.
- ⚠️ **Escala humana** — toca auth/segredo/dado pessoal/sensível ou migração
  destrutiva → sign-off do responsável obrigatório, mesmo com CI verde.

---

## EXEMPLO PREENCHIDO (apague ao usar — mostra o nível esperado)

### Subetapa E1.S1 — Middleware de sessão autenticada · ⚠️

- **Objetivo:** todo request a `/api/admin/*` exige sessão válida; sem sessão → 401.
- **Escopo (arquivos reais):**
  - Criar `src/middleware.ts` (matcher em `/api/admin/:path*`)
  - Alterar `src/lib/auth.ts` (helper `requireSession`)
- **PRD:** gerar com `/prd E1.S1` antes de codar.
- **Critério de aceite** 🔒
  - Request sem cookie de sessão a qualquer rota `/api/admin/*` retorna 401.
  - Request com sessão válida passa e injeta `userId` no contexto.
  - Nenhuma rota admin acessível sem passar pelo middleware.
- **Testes que validam** 🔒 *(escritos/travados pelo responsável)*
  - `tests/security/admin-auth.spec.ts`: cobre 401 sem sessão, 200 com sessão,
    e tentativa de bypass por rota não listada no matcher.
- **Portão:** ⚠️ escala humana (toca autenticação).
- **Definition of Done:** CI verde + os 3 testes acima passando + sign-off do responsável.
- **Status:** ☐ · **Responsável pela execução:** <delegado>

---

## Etapa E1 — <nome da etapa>

> Objetivo da etapa: <1 frase> · Portão da etapa (do roadmap): ⚠️/🤖

### Subetapa E1.S1 — <título> · <🤖/⚠️>

- **Objetivo:** <o que esta subetapa entrega, 1 frase>
- **Escopo (arquivos reais):**
  - Criar `<caminho>`
  - Alterar `<caminho>`
  - Migrar/remover `<caminho>` <!-- migração destrutiva = ⚠️ automático -->
- **PRD:** `/prd E1.S1`
- **Critério de aceite** 🔒
  - <condição testável 1>
  - <condição testável 2>
- **Testes que validam** 🔒
  - `<arquivo de teste>`: <o que cobre>
- **Portão:** <🤖 auto / ⚠️ escala humana> — <justificativa do portão>
- **Definition of Done:** CI verde + testes acima + <sign-off humano, se ⚠️>
- **Status:** ☐ · **Execução:** <delegado>

### Subetapa E1.S2 — <título> · <🤖/⚠️>

- **Objetivo:** <...>
- **Escopo (arquivos reais):**
  - <...>
- **PRD:** `/prd E1.S2`
- **Critério de aceite** 🔒
  - <...>
- **Testes que validam** 🔒
  - <...>
- **Portão:** <...>
- **Definition of Done:** <...>
- **Status:** ☐ · **Execução:** <delegado>

---

## Etapa E2 — <nome da etapa>

> Objetivo da etapa: <...> · Portão: <...>

### Subetapa E2.S1 — <título> · <🤖/⚠️>

- **Objetivo:** <...>
- **Escopo (arquivos reais):**
  - <...>
- **PRD:** `/prd E2.S1`
- **Critério de aceite** 🔒
  - <...>
- **Testes que validam** 🔒
  - <...>
- **Portão:** <...>
- **Definition of Done:** <...>
- **Status:** ☐ · **Execução:** <delegado>

<!-- Repita o bloco de subetapa quantas vezes precisar. -->

---

## Checklist de geração de Issues

<!-- Quando o roadmap detalhado fechar, cada subetapa vira uma Issue. -->

- [ ] Toda subetapa tem critério de aceite testável e travado
- [ ] Toda subetapa que toca auth/segredo/dado pessoal está marcada ⚠️
- [ ] Os testes de segurança 🔒 já existem no repo antes de abrir as Issues
- [ ] Issues criadas na ordem de dependência do roadmap
