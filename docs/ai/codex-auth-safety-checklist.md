# Codex Auth Safety Checklist

## Objetivo
Evitar regressões de autenticação/autorização.

## Checklist obrigatório
- [ ] Cookie inválido/expirado não causa loop para `/login`
- [ ] Páginas públicas (`/login`, `/register`) sempre acessíveis
- [ ] `getCurrentUser` remove cookie quando sessão não existe
- [ ] `getCurrentUser` remove sessão/cookie quando expirada
- [ ] Login retorna erro real para credenciais inválidas
- [ ] Cadastro retorna erro real para conflito de usuário
- [ ] Email normalizado com `trim().toLowerCase()`
- [ ] Username normalizado com `trim()`
- [ ] Identificador de login normalizado com `trim()`
- [ ] Logout limpa sessão no banco e cookie no navegador
- [ ] Guardas de role em rotas críticas (`requireRole`)

## Anti-padrões proibidos
- Confiar apenas na presença do cookie para validar sessão
- Redirecionar `/login` -> `/dashboard` com base apenas em cookie
- Retornar mensagens de erro de banco diretamente para UI
