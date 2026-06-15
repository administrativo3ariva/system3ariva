# Checklist De Seguranca - Novo Sistema Administrativo 3A RIVA

## Objetivo

Garantir que o novo sistema nao replique os problemas encontrados no projeto antigo, principalmente autorizacao ampla demais, permissoes confiadas ao frontend e arquivos expostos indevidamente.

## P0 - Obrigatorio Antes De Qualquer Modulo Operacional

- [ ] Nenhuma secret key em variavel publica como `NEXT_PUBLIC_*`.
- [ ] `.env`, `.env.local` e `.env.*.local` ignorados pelo Git.
- [ ] Firebase Auth configurado.
- [ ] Usuario autenticado sincronizado com tabela interna `User`.
- [ ] Usuario sem registro interno bloqueado.
- [ ] Usuario pendente bloqueado.
- [ ] Usuario inativo bloqueado.
- [ ] Admin inativo bloqueado tambem no backend.
- [ ] Permissoes validadas server-side.
- [ ] Middleware/server guard criado para rotas protegidas.
- [ ] Helper central de autorizacao criado.
- [ ] Auditoria minima criada antes dos modulos sensiveis.

## P0 - Banco E Autorizacao

- [ ] Nenhuma tabela sensivel permite escrita apenas por "usuario ativo".
- [ ] Toda mutation usa usuario extraido da sessao/token server-side.
- [ ] `created_by` e `updated_by` nao sao aceitos cegamente do client.
- [ ] Status sensiveis possuem transicoes permitidas.
- [ ] Valores financeiros possuem constraints de valor positivo.
- [ ] Deletes sensiveis usam soft delete quando necessario.
- [ ] Acoes administrativas exigem usuario ativo e permissao admin.
- [ ] Usuario comum nao consegue operar modulo sem permissao explicita.

## P0 - Storage

- [ ] Arquivos privados por padrao.
- [ ] Upload exige permissao do modulo.
- [ ] Download/view exige permissao do modulo.
- [ ] URL assinada tem duracao curta.
- [ ] Path do arquivo e gerado pelo servidor.
- [ ] Tipo de arquivo permitido e validado.
- [ ] Tamanho maximo e validado antes do processamento.
- [ ] Metadados do arquivo sao gravados no banco.
- [ ] Remocao de arquivo sensivel gera auditoria.

## P0 - NF/OCR/IA

- [ ] Processamento de NF exige usuario ativo e permissao.
- [ ] Payload grande recebe erro controlado.
- [ ] MIME falso e rejeitado.
- [ ] Arquivo invalido nao chama IA/OCR.
- [ ] Saida da IA/OCR e validada em schema runtime.
- [ ] Quantidade maxima de itens e limitada.
- [ ] Valores negativos sao rejeitados.
- [ ] Total da nota e reconciliado com itens/frete/desconto.
- [ ] Erro tecnico nao e exposto ao usuario.
- [ ] Logs internos guardam request id/contexto suficiente.
- [ ] Rate limit/cota existe para processamento caro.

## P1 - Financeiro

- [ ] Criar despesa valida permissao `financial:write`.
- [ ] Aprovar/rejeitar valida permissao especifica.
- [ ] Marcar como pago valida permissao `financial:pay`.
- [ ] Excluir financeiro usa soft delete.
- [ ] Registro pago nao pode ser editado livremente.
- [ ] Anexo financeiro usa Storage privado.
- [ ] Rateio/alocacao e validado no backend.
- [ ] Budget nao depende de calculo exclusivo do frontend.

## P1 - Estoque

- [ ] Entrada por NF aprovada e transacional.
- [ ] Ajuste de estoque exige permissao elevada.
- [ ] Saida registra motivo/responsavel quando aplicavel.
- [ ] Saldo nao pode ficar inconsistente.
- [ ] Produto/categoria nao pode ser removido se houver dependencia sem regra definida.
- [ ] Movimentacao gera auditoria.

## P1 - Admin

- [ ] Usuario novo nao recebe role automaticamente.
- [ ] Alterar status de usuario gera auditoria.
- [ ] Alterar permissao gera auditoria.
- [ ] Admin nao consegue se remover/degradar se for ultimo admin ativo.
- [ ] Listagem de usuarios nao vaza dados desnecessarios.
- [ ] Operacao destrutiva exige confirmacao e permissao.

## P2 - Deployment

- [ ] Variaveis de producao separadas de desenvolvimento.
- [ ] Build nao contem secrets.
- [ ] Source maps publicos avaliados/desabilitados se necessario.
- [ ] Headers de seguranca configurados.
- [ ] Politica de iframe definida para intranet.
- [ ] Ambientes de homologacao e producao separados.
- [ ] Logs nao registram tokens, senhas ou documentos completos.

## P2 - UX Segura

- [ ] Tela mostra "sem permissao" sem revelar dados.
- [ ] Erros tecnicos sao traduzidos para mensagens seguras.
- [ ] Acoes destrutivas usam dialog padronizado.
- [ ] Botao escondido nao e tratado como seguranca.
- [ ] Estados loading/erro/vazio existem nas telas criticas.

## Evidencias Para Homologacao

- [ ] Smoke test com admin ativo.
- [ ] Smoke test com usuario pendente.
- [ ] Smoke test com usuario inativo.
- [ ] Smoke test com usuario ativo sem permissao financeira.
- [ ] Smoke test com usuario ativo sem permissao de estoque.
- [ ] Smoke test de upload de arquivo permitido.
- [ ] Smoke test de upload de arquivo bloqueado.
- [ ] Smoke test de NF valida.
- [ ] Smoke test de NF invalida.
- [ ] Smoke test de iframe na intranet.

