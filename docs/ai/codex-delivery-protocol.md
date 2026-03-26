# Codex Delivery Protocol

Este protocolo deve ser seguido em toda entrega.

## Etapa A — Pré-fechamento técnico
1. Rodar checklist de revisão (`docs/ai/codex-review-checklist.md`).
2. Rodar checklist de auth quando houver mudanças de sessão/login (`docs/ai/codex-auth-safety-checklist.md`).
3. Corrigir bloqueantes encontrados antes de finalizar.

## Etapa B — Relatório obrigatório no final da tarefa
Sempre incluir:
1. Resumo objetivo do que foi alterado.
2. Lista de arquivos alterados.
3. Lista de migrations alteradas/criadas.
4. Riscos remanescentes.
5. Pendências futuras.
6. Validações executadas (com comando e resultado).
7. Validações não executadas + motivo.

## Etapa C — Revisão de PR (autoavaliação)
Antes de fechar, registrar:
- Bloqueantes encontrados
- Riscos não bloqueantes
- O que foi corrigido
- O que ainda está pendente

## Regras de honestidade técnica
- Não afirmar que build/test passou sem evidência.
- Não declarar sistema “pronto” se há bloqueante conhecido.
- Sempre explicitar limitações do ambiente (rede, dependências, runtime).
