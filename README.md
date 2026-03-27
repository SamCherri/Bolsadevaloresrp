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
  - aprovado: débito definitivo do reservado.
  - rejeitado/expirado: estorno do reservado para `balance`.

### Mercado de ações interno (automático)
- **BUY**: valida ativo ACTIVE, saldo e supply disponível, debita `wallet.balance`, credita holding, cria `order` e `trade`.
- **SELL**: valida holding, reduz/remove holding, credita `wallet.balance`, cria `order` e `trade`.
- Colaborador **não participa** do fluxo de ordens de ações.

### Regra econômica da reserva
- `asset.reserveFundValue` representa **alocação contábil** de parte do valor de compra (`reservePercent`) já debitado do comprador.
- Não é criação monetária: o valor da reserva sempre nasce de uma execução BUY já liquidada.
- SELL não aumenta reserva automaticamente.

## Regras de autorização
- Negociação de ativos (market/assets/ordens BUY/SELL) permitida apenas para: `INVESTOR`, `ISSUER`, `ADMIN`.
- `COLLABORATOR` fica restrito ao fluxo de câmbio manual e não negocia ativos.

## Candles
- O gráfico usa candles M1 persistidos.
- Semântica padrão: `candle.volume` = **quantidade negociada** (não valor financeiro).
- Para múltiplos trades no mesmo minuto:
  - `open` = primeiro preço do minuto
  - `high` = maior preço do minuto
  - `low` = menor preço do minuto
  - `close` = último preço do minuto
  - `volume` = soma da quantidade negociada no minuto

## PWA instalável (não nativo)
- O projeto funciona como PWA instalável (não app mobile nativo): possui `manifest.webmanifest`, ícones gerados (incluindo apple icon PNG dinâmico) e service worker básico para instalação em celular.
- Suporte offline completo **não** está implementado neste MVP (SW apenas base instalável).

## Stack
- Next.js 15 (App Router + Server Actions)
- TypeScript
- PostgreSQL
- Prisma
- TailwindCSS
- lightweight-charts

## Setup (projeto já com migrations versionadas)
```bash
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Fluxo de banco recomendado
- **Ambiente normal/equipe/produção**: use `npm run db:migrate`.
- **`db:push`**: apenas para prototipação local rápida sem versionamento formal de migration.

## Rotina de expiração de câmbio (cron-ready)
- Endpoint: `POST /api/cron/expire-exchange`
- Header obrigatório: `Authorization: Bearer <CRON_SECRET>`
- Finalidade: expirar `ExchangeOperation` pendente vencida sem side-effect em leitura.

## Auditoria técnica contínua
```bash
npm run typecheck
npm run lint
npm run test:smoke
npm run smoke:journeys
npm run audit:full
```

## Seed de desenvolvimento
- O seed é apenas para desenvolvimento local.
- Configure `SEED_DEMO_PASSWORD` (ou `SEED_ADMIN_PASSWORD`, etc.) antes de rodar seed.
- Sem env, a senha padrão `ChangeMe!123` é aplicada somente para ambiente demo/local.

## Deploy Railway
- Configure `DATABASE_URL` no serviço.
- Configure também `CRON_SECRET` para rotina de expiração.
- Build: `npm run build`
- Start: `npm run start`
- Deploy migration: `npm run db:migrate`
- Primeiro bootstrap opcional: `npm run db:seed`

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
