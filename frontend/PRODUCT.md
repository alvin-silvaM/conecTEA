# Product

<!-- impeccable:product-schema 1 -->

> Fatos tirados do roteiro escrito pelo autor do projeto. A entrevista da skill impeccable não foi feita: o roteiro foi usado no lugar dela.

## Platform

web

## Stack
HTML, CSS e JavaScript puros (ES modules), sem dependências. Servidor estático em `server.js` com proxy para o back-end (Express + Firestore).

## Users
Escola (administra), cuidador (acompanha só os alunos vinculados a ele) e aluno com TEA (login próprio com email e senha cadastrados pela escola; sua única tela é o comunicador). O responsável também está previsto, mas não existe no back-end.

## Product Purpose
Projeto universitário de pesquisa em Comunicação Aumentativa e Alternativa (CAA). Facilita a comunicação da criança por mensagens, categorias e recursos visuais; escola e cuidadores acompanham suas necessidades. Não é apenas um sistema de gestão escolar.

## Capabilities and Constraints
- O back-end só tem escolas, cuidadores e alunos (o aluno tem login por email e senha). Mensagens, categorias, interações (data, hora, emoção), SOS, observações, relatórios e responsável não existem nele.
- Regra de negócio: um aluno tem um cuidador principal; o cuidador não altera dados cadastrais do aluno; só a escola cria contas e vínculos.
- Não inventar endpoints, dados ou funcionalidades; listar pendências.

## Accessibility & Inclusion
Prioridade: acessibilidade, simplicidade e previsibilidade visual. Interface da criança com botões grandes, pouco texto e baixo estímulo sensorial.
