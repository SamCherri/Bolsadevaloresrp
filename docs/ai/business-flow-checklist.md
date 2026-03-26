# Checklist de Fluxos de Negócio

## Cadastro / Login
- [ ] Usuário cadastra com wallet criada automaticamente.
- [ ] Login cria sessão válida e redireciona para dashboard.

## Ativos
- [ ] Emissor cria ativo com ticker único.
- [ ] Admin aprova/rejeita/congela com trilha de auditoria.
- [ ] Ativo congelado não aceita ordens.

## Ordens
- [ ] Compra valida supply disponível.
- [ ] Compra valida saldo suficiente.
- [ ] Venda valida holding suficiente.
- [ ] Venda valida consistência de supply circulante.
- [ ] Trade/candle/ordem/auditoria gravados na mesma transação.

## Câmbio
- [ ] Saque reserva saldo no pedido.
- [ ] Aprovação de saque consome saldo reservado.
- [ ] Rejeição/expiração de saque estorna saldo reservado.
- [ ] Depósito aprovado incrementa saldo.
- [ ] Operação já processada não pode ser processada novamente.
