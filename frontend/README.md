# conecTEA — front-end

HTML, CSS e JavaScript puros, sem dependências. O `server.js` entrega `public/` e encaminha `/escolas`, `/cuidadores`, `/alunos` e `/health` ao back-end, então não há CORS a configurar.

## Executar

```bash
# 1) back-end (veja backend/.env.example: SECRET, FIREBASE_PROJECT_ID e credenciais ou emulador)
cd backend && npm install && npm start        # porta 3000

# 2) front-end (outro terminal)
cd frontend && npm start                      # http://localhost:8080
```

Variáveis do front-end: `PORT` (padrão 8080) e `API_URL` (padrão `http://localhost:3000`).

Para testar formulários rápido, abra `http://localhost:8080/?dev=1`: aparece o botão "Preencher com dados de exemplo" (CNPJ, nomes e senhas fictícios). Sem `?dev=1` ele não existe.

## Acessos

O login tem três abas: **Escola** (CNPJ), **Cuidador** (email) e **Aluno** (email). A escola cadastra o email e a senha do aluno no formulário de aluno; o aluno entra sozinho e cai direto no comunicador. Escola e cuidador não abrem o comunicador pelo painel deles.

## Telas

| Perfil | Rotas (`#/...`) |
|---|---|
| Escola | `inicio`, `alunos`, `alunos/novo`, `alunos/:id`, `alunos/:id/editar`, `cuidadores`, `cuidadores/novo`, `cuidadores/:id`, `cuidadores/:id/editar`, `escola`, `escola/editar` |
| Cuidador | `alunos` (só os dele), `alunos/:id`, `perfil` |
| Aluno | `comunicador` (tela cheia; é a única tela do aluno) |

## Estrutura

```
public/
  index.html  styles.css  comunicador.css  icons.svg
  fonts/            Fraunces, Public Sans e Nunito (woff2, locais)
  app.js            sessão, rotas e estrutura da tela
  js/api.js         fetch, token (sessionStorage), erros
  js/ui.js          formulários, validação, máscaras, avisos, diálogo
  js/auth.js        login e cadastro de escola
  js/painel.js      início da escola
  js/alunos.js  js/cuidadores.js  js/escola.js
  js/comunicador.js comunicador da criança (mensagens fixas, ver abaixo)
  js/dev-exemplos.js  só carrega com ?dev=1
```

## Design

Identidade e tokens em `DESIGN.md`. O servidor aplica CSP restritiva (só `'self'`): não use CDNs de fonte ou script.

## Mudança no backend

Só o necessário para o login do aluno: `email` (único) e `senha` (hash bcrypt) no cadastro e na edição do aluno, `POST /alunos/login`, `GET /alunos/eu` e o perfil `aluno` no middleware de autenticação (ele só acessa `/alunos/eu`). Alunos criados antes dessa mudança não têm email: o painel da escola mostra a pendência e o formulário de edição permite cadastrar.

## Limitações conhecidas

- **Comunicador com mensagens fixas**: o back-end não tem mensagens, categorias nem pictogramas. O vocabulário (Alimentação e Necessidades, 6 mensagens do roteiro, com ícones genéricos no lugar de pictogramas de CAA) está no topo de `js/comunicador.js`. O que a criança escolhe **não é salvo**. A fala usa a voz do navegador (`speechSynthesis`).
- Ainda sem: SOS, emoções, interações registradas, observações, relatórios, perfil de responsável, pictogramas, categorias Estudos e Extras (sem mensagens definidas).
