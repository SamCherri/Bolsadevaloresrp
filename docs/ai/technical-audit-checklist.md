# Checklist de Auditoria Técnica

## Build e Qualidade
- [ ] `npm install` sem falhas bloqueantes.
- [ ] `prisma generate` executado.
- [ ] `npm run typecheck` sem erros.
- [ ] `npm run lint` sem erros.
- [ ] `npm run build` sem erros.

## Rotas e Fluxos
- [ ] Rotas públicas (`/login`, `/register`) acessíveis sem cookie.
- [ ] Rotas privadas redirecionam para `/login` sem sessão.
- [ ] Não há loop de redirecionamento em cookie inválido.
- [ ] Rotas de admin/colaborador exigem role correta.

## Banco / Prisma
- [ ] Chaves únicas respeitadas (email, username, ticker).
- [ ] Operações críticas estão em transação (`$transaction`).
- [ ] Saldo e saldo reservado nunca ficam negativos.
- [ ] Supply/circulação do ativo mantém integridade.

## Estado e UX
- [ ] Formulários possuem estados `pending/error/success`.
- [ ] Telas sem dados possuem empty state.
- [ ] Mensagens de erro são específicas e acionáveis.
