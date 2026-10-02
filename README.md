# ConectaTEA

O **ConectaTEA** é uma aplicação desenvolvida com o objetivo de facilitar a comunicação e o acompanhamento de alunos com Transtorno do Espectro Autista (TEA) no ambiente escolar.

O sistema busca centralizar informações importantes sobre os alunos e possibilitar uma melhor integração entre escola, responsáveis e cuidadores escolares, contribuindo para um acompanhamento mais organizado e individualizado.

> **Projeto em desenvolvimento**

---

## Objetivo

O ConectaTEA objetiva auxiliar instituições de ensino no gerenciamento das informações relacionadas aos alunos com TEA, permitindo organizar dados dos alunos e seus vínculos com responsáveis e cuidadores escolares.

A proposta é proporcionar uma plataforma que facilite o acesso às informações necessárias para o acompanhamento do aluno, mantendo uma estrutura organizada e com controle de acesso aos diferentes usuários do sistema.

---

## Problema

O acompanhamento de alunos com TEA pode envolver diferentes pessoas, como profissionais da escola, responsáveis e cuidadores escolares.

Quando essas informações são mantidas de forma descentralizada, podem surgir dificuldades na comunicação e no acesso aos dados necessários para o acompanhamento do aluno.

O ConectaTEA busca oferecer uma solução centralizada para organizar essas informações e facilitar a comunicação entre as partes envolvidas.

---

## Funcionalidades

Atualmente, o projeto contempla funcionalidades relacionadas ao gerenciamento de alunos e escolas.

### Alunos

* Cadastro de alunos;
* Registro de nome e data de nascimento;
* Geração de matrícula;
* Cadastro de senha para acesso;
* Associação do aluno a uma escola;
* Associação de responsáveis e cuidadores escolares;
* Controle de vínculo ativo;
* Login utilizando matrícula e senha;
* Autenticação utilizando JWT.

### Escolas

* Cadastro e identificação da escola;
* Associação de alunos à escola;
* Autenticação da escola para operações relacionadas aos alunos.

### Vínculos

Cada aluno pode possuir vínculos com usuários do sistema, sendo eles:

* `responsavel`
* `cuidador_escolar`

O sistema realiza validações para verificar se o usuário informado existe e se o tipo de vínculo informado é compatível com o tipo cadastrado para aquele usuário.

Além disso, um aluno deve possuir **pelo menos um vínculo**.

---

## Autenticação

O sistema utiliza **JSON Web Token (JWT)** para autenticação.

No login do aluno, são utilizadas:

* Matrícula;
* Senha.

O token JWT identifica o usuário autenticado e seu tipo dentro do sistema.

---

## Tecnologias utilizadas

### Backend

* **Node.js**
* **Express**
* **bcrypt**
* **JSON Web Token (JWT)**

---

## Estrutura do Backend

O backend utiliza uma organização baseada na separação de responsabilidades entre **Models, Services, Controllers e Routes**.

```text
backend/
├── src/
│   ├── controllers/
│   │   ├── aluno.controller.js
│   │   └── ...
│   │
│   ├── models/
│   │   ├── aluno.model.js
│   │   ├── escola.model.js
│   │   ├── usuario.model.js
│   │   └── ...
│   │
│   ├── services/
│   │   ├── aluno.service.js
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── aluno.route.js
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── entidades.util.js
│   │   └── ...
│   │
│   └── app.js
│
├── package.json
└── package-lock.json
```

### Responsabilidade de cada camada

**Models**

Responsáveis pela definição dos schemas e regras estruturais dos documentos armazenados no MongoDB.

**Services**

Responsáveis pela lógica de negócio e pelas operações envolvendo os dados.

**Controllers**

Responsáveis por receber as requisições HTTP, obter os dados da requisição e retornar as respostas.

**Routes**

Responsáveis por definir os endpoints da API e direcionar as requisições para os respectivos controllers.

**Utils**

Contém funções reutilizáveis de validação e outras funcionalidades auxiliares.

---

## Modelo de Aluno

O aluno possui, entre outros, os seguintes dados:

```text
Aluno
├── nome
├── data_nascimento
├── vinculos
│   ├── usuario
│   ├── tipo
│   └── ativo
├── matricula
├── senha
├── escola
└── ativo
```

O campo `vinculos` possui os tipos:

```text
responsavel
cuidador_escolar
```

O sistema também garante que pelo menos um vínculo seja informado no cadastro do aluno.

---

## Validações

O cadastro de alunos possui validações em diferentes camadas.

Entre elas:

* Verificação da existência da escola;
* Verificação de matrícula já utilizada;
* Verificação da existência dos usuários vinculados;
* Verificação da compatibilidade entre usuário e tipo de vínculo;
* Obrigatoriedade de pelo menos um vínculo;
* Validação dos campos obrigatórios;
* Proteção da senha através de hash.

As validações relacionadas à existência e compatibilidade dos vínculos são realizadas na camada de serviço.

---

## Como executar o projeto

### 1. Clone o repositório

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd conectaTEA
```

### 2. Instale as dependências

Caso o backend esteja separado em uma pasta própria:

```bash
cd backend
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta do backend.

Exemplo:

```env
PORT=8081
MONGODB_URI=sua_string_de_conexao
SECRET=sua_chave_secreta
```

> Não compartilhe o arquivo `.env` no GitHub. As informações sensíveis devem permanecer apenas no ambiente local.

### 4. Execute o servidor

```bash
npm start
```

---

## Exemplo de autenticação

O aluno pode realizar login utilizando sua matrícula e senha.

Exemplo de requisição:

```http
POST /alunos/login
Content-Type: application/json
```

```json
{
  "matricula": "20260001",
  "senha": "123456"
}
```

Após a autenticação, a API retorna um token JWT que pode ser utilizado nas rotas protegidas.

---

## Status do projeto

**Em desenvolvimento**

O ConectaTEA está sendo desenvolvido de forma incremental. Novas funcionalidades, regras de negócio e melhorias na plataforma serão adicionadas ao longo do desenvolvimento.

---

## Desenvolvimento

Projeto acadêmico desenvolvido como parte das atividades do curso de **Sistemas de Informação**.

**ConectaTEA — tecnologia para conectar escola, responsáveis e cuidadores no acompanhamento de alunos com TEA.**
