# conecTEA
aplicação web para comunicação de pessoas com TEA não verbal

## Como rodar (desenvolvimento)

**Back-end** (`backend/`): copie `.env.example` para `.env`, preencha `MONGO_URI` e `SECRET` (mín. 32 caracteres) e rode `npm install` e `npm start`. Porta padrão: 3000.

**Front-end de teste** (`frontend/`, sem dependências): `npm start` (porta 8080). Ele serve a página de teste e encaminha `/escolas`, `/cuidadores`, `/alunos` e `/health` para o back-end (`API_URL`, padrão `http://localhost:3000`).

**Teste de regras de acesso** (com o back-end rodando num banco de teste): `node backend/scripts/smoke-test.mjs`.

### Rotas

| Rota | Quem acessa |
|---|---|
| `POST /escolas/cadastro`, `POST /escolas` (login) | público |
| `POST /cuidadores/login` | público |
| `POST/GET /cuidadores`, `DELETE /cuidadores/:id` | escola |
| `GET /cuidadores/eu` | cuidador |
| `POST/PATCH/DELETE /alunos` | escola |
| `GET /alunos`, `GET /alunos/:id` | escola (todos da escola) e cuidador (só os vinculados a ele) |
