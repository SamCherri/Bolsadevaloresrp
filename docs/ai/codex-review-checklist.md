# Codex Review Checklist (Bolsa de Valores RP)

Use este checklist **antes de finalizar qualquer tarefa**.

## 1) Build e tipagem
- [ ] `npm install` executado (ou limitação de ambiente documentada)
- [ ] `npm run build` executado (ou limitação documentada)
- [ ] Tipos TypeScript sem erros conhecidos

## 2) Rotas e middleware
- [ ] Middleware não cria loop de autenticação
- [ ] Rotas públicas continuam acessíveis com cookie inválido
- [ ] Proteção real server-side em `requireUser`/`requireRole`

## 3) Formulários e feedback
- [ ] Formulários críticos mostram erro de validação
- [ ] Formulários críticos mostram estado de envio (pending)
- [ ] Mensagens de erro não expõem stack/erro cru de banco

## 4) Server actions
- [ ] Retornam feedback útil para a UI
- [ ] Tratam cenários de erro previsíveis (duplicidade, estado inválido, saldo insuficiente)
- [ ] `revalidatePath`/`redirect` usados de forma coerente

## 5) Auth e sessão
- [ ] Credenciais normalizadas (email e username)
- [ ] Sessão expirada limpa cookie e sessão inválida
- [ ] Logout remove sessão do banco e cookie

## 6) Fluxos de negócio críticos
- [ ] Câmbio manual consistente (depósito/saque com aprovação)
- [ ] Mercado interno sem colaborador na trade de ações
- [ ] Sem falhas silenciosas em operações financeiras

## 7) Dados e banco
- [ ] Mudanças de schema com migration coerente
- [ ] Seed coerente com regras atuais

## 8) Transparência da entrega
- [ ] Testes executados listados com evidência
- [ ] Limitações de ambiente explicitadas
- [ ] Riscos remanescentes explicitados
