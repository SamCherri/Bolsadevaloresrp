# Protocolo de Entrega com Evidência Obrigatória

## Regras
1. Não declarar sucesso sem comando executado.
2. Sempre anexar resultado real dos comandos de validação.
3. Se um comando falhar, corrigir e reexecutar.
4. Declarar explicitamente limitações do ambiente (quando houver).

## Evidências mínimas
- Execução de: `npm install`, `prisma generate`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Execução dos testes/smokes criados para regras de negócio.
- Lista objetiva de cenários simulados e cobertura atingida.
- Riscos remanescentes e pendências priorizadas.
