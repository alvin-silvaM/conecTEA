# conecTEA
aplicação web para comunicação de pessoas com TEA não verbal

## Como rodar (desenvolvimento)

**Back-end** (`backend/`): o banco de dados é o **Cloud Firestore**, acessado pelo Firebase Admin SDK.

1. Copie `.env.example` para `.env` e preencha:
   - `SECRET`: segredo do JWT, mínimo de 32 caracteres.
   - `FIREBASE_PROJECT_ID`: ID do projeto no Firebase.
   - `GOOGLE_APPLICATION_CREDENTIALS`: caminho do JSON da conta de serviço (ou deixe sem a linha para usar `gcloud auth application-default login`). O JSON nunca deve ser versionado; a pasta `secret/` está no `.gitignore`.
   - `PORT` (padrão 3000) e, opcionalmente, `CORS_ORIGIN`, `LOGIN_MAX` e `CADASTRO_MAX`.
2. Dentro de `backend/`, rode `npm install` e `npm start` (use `npm run dev` para recarregar ao salvar).
3. Se tudo estiver certo, o console mostra `Conectado ao Firestore` e `Servidor rodando na porta 3000`.

**Front-end de teste** (`frontend/`, sem dependências): `npm start` (porta 8080). Ele serve a página de teste e encaminha `/escolas`, `/cuidadores`, `/alunos` e `/health` para o back-end (`API_URL`, padrão `http://localhost:3000`).

**Teste de regras de acesso** (com o back-end rodando num projeto Firebase de teste, pois cria dados): `node backend/scripts/smoke-test.mjs` (ou `npm run smoke` dentro de `backend/`).

### Estrutura do back-end

```
backend/
├── src/
│   ├── app.js              # servidor Express, middlewares globais e montagem das rotas
│   ├── routes/             # endpoints e ordem dos middlewares
│   ├── controllers/        # recebem a requisição validada e montam a resposta HTTP
│   ├── services/           # regras de negócio e acesso ao Firestore
│   ├── models/             # schemas Zod, nomes das coleções e formato de resposta
│   ├── middlewares/        # autenticação (JWT), validação (Zod) e limites de requisição
│   ├── database/           # conexão com o Firestore (Admin SDK)
│   └── utils/              # erros, segurança (JWT/bcrypt) e validadores reutilizáveis
├── scripts/smoke-test.mjs  # teste de regras de acesso (roda contra a API em execução)
├── firebase.json, firestore.rules, firestore.indexes.json   # configuração do Firebase CLI
├── requests.http           # exemplos de requisições
├── .env.example, package.json, package-lock.json
└── secret/                 # local, ignorado pelo Git (credenciais)
```

### Rotas

| Rota | Quem acessa |
|---|---|
| `GET /health` | público |
| `POST /escolas/cadastro`, `POST /escolas` (login) | público |
| `POST /cuidadores/login` | público |
| `POST /cuidadores`, `GET /cuidadores`, `DELETE /cuidadores/:id` | escola |
| `GET /cuidadores/eu` | cuidador |
| `POST /alunos`, `PATCH /alunos/:id`, `DELETE /alunos/:id` | escola |
| `GET /alunos`, `GET /alunos/:id` | escola (todos da escola) e cuidador (só os vinculados a ele) |

---

## Contrato da API

Todas as informações abaixo foram conferidas no código do back-end (`backend/src`).

### Convenções gerais

- **Base URL (desenvolvimento):** `http://localhost:3000`.
- **Formato:** corpo e respostas em JSON (`Content-Type: application/json`). Corpo máximo de **50 KB**.
- **Identificadores:** todo `_id` é uma string (id do documento no Firestore, 20 caracteres). Em rotas com `:id`, o valor precisa ter entre 1 e 64 caracteres entre letras, números, `_` e `-`; caso contrário a resposta é `400 "Identificador inválido"`.
- **Campos desconhecidos** no corpo são **ignorados** (nunca são gravados). Campos protegidos (`_id`, `escola`, `ativo` na criação) não podem ser definidos pelo cliente.
- **Textos** têm espaços das pontas removidos; o **email** é convertido para minúsculas.
- **Datas:** enviadas como `AAAA-MM-DD`; devolvidas como data ISO (`2016-05-10T00:00:00.000Z`).
- **Senhas** são guardadas com hash (bcrypt) e **nunca** aparecem em respostas.
- **Sem paginação nem filtros por query string:** as listagens devolvem todos os registros permitidos, ordenados por nome.
- **CORS:** só é habilitado se a variável `CORS_ORIGIN` estiver definida (origens separadas por vírgula).

#### Formato dos erros

Erros esperados devolvem `{ "message": "..." }`. Erros de validação (400) incluem também a lista de campos:

```json
{
  "message": "Email inválido",
  "erros": [
    { "campo": "email", "mensagem": "Email inválido" },
    { "campo": "senha", "mensagem": "Senha inválida: use no mínimo 8 caracteres" }
  ]
}
```

- `message` repete a **primeira** mensagem de `erros`. Campo ausente gera `"Campos obrigatórios não informados"`.
- `campo` usa o caminho do campo (ex.: `endereco.rua`). Quando o erro é do corpo inteiro (ex.: atualização sem nenhum campo), o valor é `"body"`; para parâmetro de rota, `"id"`.
- Nos logins (`POST /escolas` e `POST /cuidadores/login`) a mensagem de 400 é sempre `"Campos incompletos ou incorretos"`.

#### Erros que podem ocorrer em qualquer rota

| Código | Corpo | Quando |
|---|---|---|
| 400 | `{ "message": "JSON inválido" }` | corpo com JSON malformado |
| 401 | `{ "message": "Token ausente, inválido ou expirado" }` | rotas protegidas sem token válido |
| 403 | `{ "message": "Acesso negado" }` | perfil sem permissão para a rota |
| 404 | `{ "message": "Rota não encontrada" }` | rota inexistente |
| 413 | `{ "message": "Requisição muito grande" }` | corpo acima de 50 KB |
| 429 | `{ "message": "..." }` | limite de requisições (ver abaixo) |
| 500 | `{ "message": "Erro interno do servidor" }` | erro inesperado (o detalhe fica só no log do servidor) |

**Limites de requisição por IP:** cadastro de escola, 20 por hora (`CADASTRO_MAX`); login (escola e cuidador), 10 tentativas **malsucedidas** a cada 15 minutos (`LOGIN_MAX`). Logins bem-sucedidos não contam.

### Autenticação e autorização

1. Faça login para obter o token: `POST /escolas` (escola) ou `POST /cuidadores/login` (cuidador).
2. Envie o token em toda rota protegida:
   ```
   Authorization: Bearer <token>
   ```
3. O token é um JWT (HS256) válido por **1 dia**, com o perfil (`tipo`: `escola` ou `cuidador`) e o id da conta. A cada requisição o back-end confere no banco se a conta ainda existe e está ativa; se foi excluída ou desativada, o token deixa de valer na hora (`401`).

| Perfil | O que pode |
|---|---|
| **Público** | `GET /health`, cadastro e login de escola, login de cuidador |
| **Escola** | gerenciar cuidadores (`POST`, `GET`, `DELETE`) e alunos (`POST`, `GET`, `PATCH`, `DELETE`) da própria escola |
| **Cuidador** | `GET /cuidadores/eu`; `GET /alunos` e `GET /alunos/:id` apenas dos alunos vinculados a ele |

**Isolamento de dados:** a escola é sempre identificada pelo **token**, nunca pelo corpo ou pela URL. Uma escola nunca enxerga nem altera dados de outra, e um cuidador nunca enxerga alunos de outro cuidador. Nesses casos a API responde **404** (e não 403), para não revelar que o registro existe.

### Relacionamentos

```
Escola 1 ──── N Cuidador      (cuidador.escola)
Escola 1 ──── N Aluno         (aluno.escola)
Cuidador 1 ── N Aluno         (aluno.cuidador: um cuidador principal por aluno)
```

Regras:
- Todo aluno precisa de um cuidador **ativo e da mesma escola** ao ser criado ou ao trocar de cuidador; senão `400 "Cuidador inválido"`.
- Um cuidador **não pode ser excluído** enquanto houver alunos vinculados (`409`). Reatribua os alunos com `PATCH /alunos/:id` e depois exclua.
- Não há exclusão em cascata e não existe rota para excluir escola.
- Email de escola é único entre escolas; email de cuidador é único entre todos os cuidadores. CNPJ e razão social de escola também são únicos.
- Os relacionamentos são guardados como ids; nas respostas de aluno o cuidador vem "expandido" (`_id`, `nome`, `telefone`, `email`).

---

### Escola

**Operações disponíveis:** cadastro e login. **Não existem** consulta, atualização nem exclusão de escola.

#### Propriedades

| Propriedade | Tipo | Obrigatória | Regras |
|---|---|---|---|
| `_id` | string | só resposta | gerado pelo servidor |
| `cnpj` | string | sim | exatamente 14 dígitos, só números; único |
| `razaoSocial` | string | sim | 1 a 200 caracteres; única |
| `endereco` | objeto | sim | ver abaixo |
| `endereco.numero` | inteiro | sim | maior que 0 (número JSON, não string) |
| `endereco.rua` | string | sim | 1 a 200 caracteres |
| `endereco.municipio` | string | sim | 1 a 120 caracteres |
| `endereco.estado` | string | sim | 1 a 50 caracteres (texto livre) |
| `telefone1` | string | sim | 8 a 20 caracteres entre dígitos, espaço, `(`, `)`, `+` e `-` |
| `telefone2` | string | não | mesma regra de `telefone1` |
| `email` | string | sim | formato de email, até 254 caracteres; vai para minúsculas; único |
| `senha` | string | sim (só envio) | mínimo 8 caracteres e no máximo 72 bytes |
| `ativo` | boolean | só resposta | sempre `true` no cadastro; não é alterável pela API |

#### POST /escolas/cadastro — cadastrar escola
Público (sujeito ao limite de 20 cadastros por hora por IP).

```json
{
  "cnpj": "11222333000181",
  "razaoSocial": "Escola Exemplo",
  "endereco": { "numero": 10, "rua": "Rua das Flores", "municipio": "Fortaleza", "estado": "CE" },
  "telefone1": "(85) 99999-0000",
  "email": "contato@escolaexemplo.test",
  "senha": "senha-de-exemplo-123"
}
```

**201 Created**
```json
{
  "message": "Escola cadastrada",
  "resposta": {
    "_id": "Kx9aP2mQ7rTz1BwN4cLd",
    "cnpj": "11222333000181",
    "razaoSocial": "Escola Exemplo",
    "endereco": { "numero": 10, "rua": "Rua das Flores", "municipio": "Fortaleza", "estado": "CE" },
    "telefone1": "(85) 99999-0000",
    "email": "contato@escolaexemplo.test",
    "ativo": true
  }
}
```
(`telefone2` só aparece se tiver sido enviado.)

| Código | Quando |
|---|---|
| 400 | validação falhou (mensagens específicas: `"CNPJ inválido: informe 14 dígitos, somente números"`, `"Razão social inválida"`, `"Endereço incompleto"`, `"Endereço incompleto ou inválido"`, `"Telefone inválido"`, `"Email inválido"`, `"Senha inválida: use no mínimo 8 caracteres"`, `"Campos obrigatórios não informados"`) |
| 409 | `"Endereço de email já utilizado"`, `"CNPJ já cadastrado"` ou `"Já existe uma escola cadastrada com esses dados"` (razão social repetida) |
| 429 | limite de cadastros |

#### POST /escolas — login da escola
Público (limite de 10 falhas a cada 15 minutos por IP).

```json
{ "cnpj": "11222333000181", "senha": "senha-de-exemplo-123" }
```

**200 OK**
```json
{ "message": "Login realizado com sucesso", "token": "<jwt>" }
```

| Código | Quando |
|---|---|
| 400 | `{ "message": "Campos incompletos ou incorretos", "erros": [...] }` |
| 401 | `{ "message": "CNPJ ou senha inválidos" }` (mesma resposta para CNPJ inexistente e senha errada) |
| 403 | `{ "message": "Conta inativa" }` (só após a senha estar correta) |
| 429 | muitas tentativas |

---

### Cuidador

**Operações disponíveis:** cadastro, listagem (da escola), consulta dos próprios dados, exclusão e login. **Não existem** atualização (PUT/PATCH) nem consulta de um cuidador por id.

#### Propriedades

| Propriedade | Tipo | Obrigatória | Regras |
|---|---|---|---|
| `_id` | string | só resposta | gerado pelo servidor |
| `nome` | string | sim | 1 a 120 caracteres |
| `telefone` | string | sim | 8 a 20 caracteres entre dígitos, espaço, `(`, `)`, `+` e `-` |
| `email` | string | sim | formato de email, até 254 caracteres; vai para minúsculas; único entre cuidadores; usado no login |
| `senha` | string | sim (só envio) | mínimo 8 caracteres e no máximo 72 bytes |
| `escola` | string | só resposta | id da escola; vem do token, nunca do corpo |
| `ativo` | boolean | só resposta | sempre `true` no cadastro; não é alterável pela API |

#### POST /cuidadores — cadastrar cuidador
Autenticação: Bearer, perfil **escola**.

```json
{
  "nome": "Maria Exemplo",
  "telefone": "(85) 98888-0001",
  "email": "maria@exemplo.test",
  "senha": "senha-de-exemplo-123"
}
```

**201 Created**
```json
{
  "message": "Cuidador cadastrado",
  "cuidador": {
    "_id": "Qm3rT8vZ1aLx6NcPd2Wy",
    "nome": "Maria Exemplo",
    "telefone": "(85) 98888-0001",
    "email": "maria@exemplo.test",
    "escola": "Kx9aP2mQ7rTz1BwN4cLd",
    "ativo": true
  }
}
```

| Código | Quando |
|---|---|
| 400 | validação (`"Nome inválido"`, `"Telefone inválido"`, `"Email inválido"`, `"Senha inválida: use no mínimo 8 caracteres"`, `"Campos obrigatórios não informados"`) |
| 401 / 403 | sem token válido / perfil não é escola |
| 409 | `"Endereço de email já utilizado"` |

#### GET /cuidadores — listar cuidadores da escola
Autenticação: Bearer, perfil **escola**. Sem parâmetros; devolve só os cuidadores da escola do token, ordenados por nome.

**200 OK**
```json
{
  "cuidadores": [
    {
      "_id": "Qm3rT8vZ1aLx6NcPd2Wy",
      "nome": "Maria Exemplo",
      "telefone": "(85) 98888-0001",
      "email": "maria@exemplo.test",
      "escola": "Kx9aP2mQ7rTz1BwN4cLd",
      "ativo": true
    }
  ]
}
```
Erros: 401, 403.

#### GET /cuidadores/eu — dados do cuidador logado
Autenticação: Bearer, perfil **cuidador**.

**200 OK**
```json
{
  "cuidador": {
    "_id": "Qm3rT8vZ1aLx6NcPd2Wy",
    "nome": "Maria Exemplo",
    "telefone": "(85) 98888-0001",
    "email": "maria@exemplo.test",
    "escola": "Kx9aP2mQ7rTz1BwN4cLd",
    "ativo": true
  }
}
```
Erros: 401 (inclui cuidador excluído ou inativo); 403 (token de escola).

#### DELETE /cuidadores/:id — excluir cuidador
Autenticação: Bearer, perfil **escola**. Só exclui cuidador da própria escola.

**200 OK**
```json
{ "message": "Cuidador excluído" }
```

| Código | Quando |
|---|---|
| 400 | `"Identificador inválido"` |
| 401 / 403 | sem token válido / perfil não é escola |
| 404 | `"Cuidador não encontrado"` (inexistente ou de outra escola) |
| 409 | `"Cuidador possui alunos vinculados: reatribua os alunos antes de excluir"` — a exclusão é **impedida** |

Depois de excluído, o token desse cuidador deixa de valer e o email pode ser cadastrado novamente.

#### POST /cuidadores/login — login do cuidador
Público (limite de 10 falhas a cada 15 minutos por IP).

```json
{ "email": "maria@exemplo.test", "senha": "senha-de-exemplo-123" }
```

**200 OK**
```json
{ "message": "Login realizado com sucesso", "token": "<jwt>" }
```

| Código | Quando |
|---|---|
| 400 | `{ "message": "Campos incompletos ou incorretos", "erros": [...] }` |
| 401 | `{ "message": "Email ou senha inválidos" }` |
| 403 | `{ "message": "Conta inativa" }` (cuidador ou escola inativos) |
| 429 | muitas tentativas |

---

### Aluno

**Operações disponíveis:** cadastro, listagem, consulta por id, atualização parcial (`PATCH`) e exclusão. **Não existe `PUT`.** O aluno não tem login.

#### Propriedades

| Propriedade | Tipo | Obrigatória | Regras |
|---|---|---|---|
| `_id` | string | só resposta | gerado pelo servidor |
| `nome` | string | sim | 1 a 120 caracteres |
| `dataNascimento` | string | não | `AAAA-MM-DD`, data existente e não futura; devolvida em ISO |
| `cuidador` | string | sim | id de um cuidador **ativo da mesma escola**; na resposta vira objeto `{ _id, nome, telefone, email }` |
| `ativo` | boolean | só na atualização | `true` no cadastro; pode ser alterado com `PATCH` |
| `escola` | — | — | definida pelo token; **não** é aceita nem devolvida |

#### POST /alunos — cadastrar aluno
Autenticação: Bearer, perfil **escola**.

```json
{
  "nome": "Aluno Exemplo",
  "dataNascimento": "2016-05-10",
  "cuidador": "Qm3rT8vZ1aLx6NcPd2Wy"
}
```

**201 Created**
```json
{
  "message": "Aluno cadastrado",
  "aluno": {
    "_id": "Rt5yU7iO9pAs2DfG4hJk",
    "nome": "Aluno Exemplo",
    "dataNascimento": "2016-05-10T00:00:00.000Z",
    "ativo": true,
    "cuidador": {
      "_id": "Qm3rT8vZ1aLx6NcPd2Wy",
      "nome": "Maria Exemplo",
      "telefone": "(85) 98888-0001",
      "email": "maria@exemplo.test"
    }
  }
}
```

| Código | Quando |
|---|---|
| 400 | validação (`"Nome inválido"`, `"Identificador inválido"`, `"Data de nascimento inválida: use AAAA-MM-DD"`, `"Data de nascimento não pode ser futura"`, `"Campos obrigatórios não informados"`) ou `"Cuidador inválido"` (inexistente, inativo ou de outra escola) |
| 401 / 403 | sem token válido / perfil não é escola |

#### GET /alunos — listar alunos
Autenticação: Bearer, perfil **escola** ou **cuidador**. Sem parâmetros.
- **Escola:** todos os alunos da escola.
- **Cuidador:** apenas os alunos vinculados a ele.
- Ordenação por nome; alunos com `ativo: false` também são listados.

**200 OK**
```json
{
  "alunos": [
    {
      "_id": "Rt5yU7iO9pAs2DfG4hJk",
      "nome": "Aluno Exemplo",
      "dataNascimento": "2016-05-10T00:00:00.000Z",
      "ativo": true,
      "cuidador": { "_id": "Qm3rT8vZ1aLx6NcPd2Wy", "nome": "Maria Exemplo", "telefone": "(85) 98888-0001", "email": "maria@exemplo.test" }
    }
  ]
}
```
Erros: 401.

#### GET /alunos/:id — consultar aluno
Autenticação: Bearer, perfil **escola** ou **cuidador** (as mesmas restrições da listagem).

**200 OK**
```json
{
  "aluno": {
    "_id": "Rt5yU7iO9pAs2DfG4hJk",
    "nome": "Aluno Exemplo",
    "dataNascimento": "2016-05-10T00:00:00.000Z",
    "ativo": true,
    "cuidador": { "_id": "Qm3rT8vZ1aLx6NcPd2Wy", "nome": "Maria Exemplo", "telefone": "(85) 98888-0001", "email": "maria@exemplo.test" }
  }
}
```

| Código | Quando |
|---|---|
| 400 | `"Identificador inválido"` |
| 401 | sem token válido |
| 404 | `"Aluno não encontrado"` (inexistente, de outra escola ou, para cuidador, de outro cuidador) |

#### PATCH /alunos/:id — atualizar aluno
Autenticação: Bearer, perfil **escola**. Atualização **parcial**: envie só o que mudar. Campos aceitos: `nome`, `dataNascimento`, `cuidador`, `ativo` (mesmas regras do cadastro; `ativo` precisa ser boolean). Outros campos são ignorados. É preciso enviar ao menos um campo aceito.

```json
{ "nome": "Aluno Exemplo Editado", "ativo": false }
```

**200 OK**
```json
{
  "message": "Aluno atualizado",
  "aluno": {
    "_id": "Rt5yU7iO9pAs2DfG4hJk",
    "nome": "Aluno Exemplo Editado",
    "dataNascimento": "2016-05-10T00:00:00.000Z",
    "ativo": false,
    "cuidador": { "_id": "Qm3rT8vZ1aLx6NcPd2Wy", "nome": "Maria Exemplo", "telefone": "(85) 98888-0001", "email": "maria@exemplo.test" }
  }
}
```

| Código | Quando |
|---|---|
| 400 | validação (`"Nome inválido"`, `"Campo ativo inválido"`, `"Nenhum campo para atualizar"`, `"Identificador inválido"`…) ou `"Cuidador inválido"` ao trocar de cuidador |
| 401 / 403 | sem token válido / perfil não é escola |
| 404 | `"Aluno não encontrado"` (inexistente ou de outra escola) |

Não é possível remover a `dataNascimento` depois de informada.

#### DELETE /alunos/:id — excluir aluno
Autenticação: Bearer, perfil **escola**. Exclusão definitiva; nada impede a exclusão além das regras de acesso.

**200 OK**
```json
{ "message": "Aluno excluído" }
```

| Código | Quando |
|---|---|
| 400 | `"Identificador inválido"` |
| 401 / 403 | sem token válido / perfil não é escola |
| 404 | `"Aluno não encontrado"` (inexistente ou de outra escola) |

---

### Exemplo de fluxo completo

```
1. POST /escolas/cadastro            → cria a escola
2. POST /escolas                     → token da escola
3. POST /cuidadores      (Bearer)    → cria o cuidador, guarde o _id
4. POST /alunos          (Bearer)    → cria o aluno vinculado ao cuidador
5. POST /cuidadores/login            → token do cuidador
6. GET  /alunos          (Bearer do cuidador) → vê só o aluno vinculado a ele
```
