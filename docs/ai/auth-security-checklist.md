# Checklist de Auth e Segurança

- [ ] Cookie de sessão é `httpOnly`.
- [ ] Cookie usa `secure` em produção.
- [ ] Sessão expirada é removida do banco e cookie limpo.
- [ ] Hash de token de sessão é persistido (não token puro).
- [ ] Login retorna erro genérico para credenciais inválidas.
- [ ] Registro impede duplicidade de email/username.
- [ ] Server Actions sensíveis validam autenticação/role.
- [ ] Middleware não assume role apenas por cookie.
- [ ] Ações financeiras registram log de auditoria.
