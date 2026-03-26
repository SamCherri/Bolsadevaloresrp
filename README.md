# Bolsa de Valores RP

MVP de exchange RP com **dois fluxos econômicos separados**:

1. **Câmbio manual** (moeda do jogo ↔ moeda universal do site) com colaborador.
2. **Mercado interno de ações** (compra/venda automática usando saldo universal do site).

## Economia do MVP

### Moeda universal interna
- `wallet.balance` = saldo universal disponível para ordens e novos saques.
- `wallet.reservedBalance` = saldo bloqueado em saques pendentes.

### Câmbio manual (com colaborador)
- **Depósito**: usuário cria operação, entrega moeda do jogo, colaborador aprova, sistema credita `wallet.balance`.
- **Saque**: usuário cria operação, sistema move saldo de `balance` para `reservedBalance`, colaborador aprova/rejeita.
  - aprovado: debita definitivo do reservado.
  - rejeitado/expirado: estorna reservado para `balance`.

### Mercado de ações interno (automático)
- **BUY**: valida ativo ACTIVE, saldo e supply disponível, debita `wallet.balance`, credita holding, cria `order` e `trade`.
- **SELL**: valida holding, reduz/remover holding, credita `wallet.balance`, cria `order` e `trade`.
- Colaborador **não participa** do fluxo de ordens de ações.

## Regras de supply adotadas no MVP
- `circulatingSupply` sobe em BUY e desce em SELL.
- BUY não pode ultrapassar `totalSupply`.
- Interpretação MVP: plataforma atua como contraparte simplificada/market maker interno.

## Candles
- O gráfico usa candles M1 persistidos.
- MVP com atualização simplificada: há dados seedados e trades reais; a agregação completa de candles por trade/timeframe ainda é parcial.

## Stack
- Next.js 15 (App Router + Server Actions)
- TypeScript
- PostgreSQL
- Prisma
- TailwindCSS
- lightweight-charts

## Setup
```bash
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```

## Auditoria técnica contínua
```bash
npm run typecheck
npm run lint
npm run test:smoke
npm run smoke:journeys
npm run audit:full
```

Documentação de apoio:
- `docs/ai/technical-audit-checklist.md`
- `docs/ai/auth-security-checklist.md`
- `docs/ai/ui-responsiveness-checklist.md`
- `docs/ai/business-flow-checklist.md`
- `docs/ai/smoke-test-scenarios.md`
- `docs/ai/delivery-evidence-protocol.md`

## Deploy Railway
- Configure `DATABASE_URL` no serviço.
- Build: `npm run build`
- Start: `npm run start`
- Deploy migration: `npm run db:migrate`
- Primeiro bootstrap opcional: `npm run db:seed`

## Usuários seed
- Admin: `admin@bvrp.com` / `Admin@1234`
- Collaborator: `collab@bvrp.com` / `Collab@1234`
- Issuer: `issuer@bvrp.com` / `Issuer@1234`
- Investor: `investor@bvrp.com` / `Investor@1234`

## Escopo incluído no MVP
- Auth com sessão segura
- Dashboard com dados econômicos coerentes
- Câmbio manual (depósito/saque + aprovação colaborador)
- Negociação automática de ações internas
- Carteira com holdings, ordens e histórico de câmbio
- Painel colaborador focado em câmbio
- Painel admin (ativos, usuários, auditoria, visão geral)

## Fora do escopo (por enquanto)
- Livro de ofertas completo (matching engine entre usuários)
- Cálculo avançado de preço/market depth
- Agregador de candles completo multi-timeframe em background worker
