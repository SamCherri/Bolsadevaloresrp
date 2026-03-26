# Roteiro de Simulação de Uso (Smoke + Manual)

## Automatizado (script)
Executar `npm run smoke:journeys` para validar regras críticas sem depender do banco.

Cobre automaticamente:
- visitante acessa login
- compra com saldo insuficiente
- compra com supply insuficiente
- venda com holding insuficiente
- venda com inconsistência de supply
- cálculo de reserva e total da ordem

## Manual guiado (com banco)
1. Criar conta (`/register`) e validar redirecionamento para `/dashboard`.
2. Logout e novo login (`/login`).
3. Promover um usuário para `ISSUER` e criar ativo (`/new-asset`).
4. Aprovar ativo em `/admin`.
5. Comprar ativo em `/assets/[id]`.
6. Vender ativo em `/assets/[id]`.
7. Criar depósito em `/exchange`.
8. Criar saque em `/exchange`.
9. Aprovar/rejeitar saque em `/collaborator`.
10. Simular sessão inválida removendo cookie e abrir `/dashboard` (deve redirecionar para `/login`).
11. Simular ticker duplicado e validar erro.
12. Validar telas vazias (sem trades/sem ordens/sem câmbio).
