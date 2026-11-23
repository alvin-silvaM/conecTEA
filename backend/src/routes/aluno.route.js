import { Router } from "express";
import {
    criarAluno,
    listarAlunos,
    buscarAluno,
    atualizarAluno,
    removerAluno,
    loginAluno,
    meusDadosAluno,
    painelAlunos,
    fixarAluno,
    desafixarAluno
} from "../controllers/aluno.controller.js";
import { autenticar, exigirTipo } from "../middlewares/auth.js";
import { limitadorLogin } from "../middlewares/limitadores.js";
import { validar } from "../middlewares/validar.js";
import { alunoParamsSchema, criarAlunoSchema, atualizarAlunoSchema, loginAlunoSchema } from "../models/aluno.model.js";

const routerAluno = Router();

// Pública
routerAluno.post("/login", limitadorLogin, validar({ body: loginAlunoSchema, mensagem: "Campos incompletos ou incorretos" }), loginAluno);

// As demais rotas exigem token
routerAluno.use(autenticar);

// Aluno logado vê os próprios dados (declarada antes de "/:id")
routerAluno.get("/eu", exigirTipo("aluno"), meusDadosAluno);

// Cuidador: tela Aluno (vinculados + demais) e fixar/desafixar. Precisam vir antes de "/:id".
routerAluno.get("/painel", exigirTipo("cuidador"), painelAlunos);
routerAluno.put("/:id/fixar", exigirTipo("cuidador"), validar({ params: alunoParamsSchema }), fixarAluno);
routerAluno.delete("/:id/fixar", exigirTipo("cuidador"), validar({ params: alunoParamsSchema }), desafixarAluno);

// Escola e cuidador leem (cada um só o que lhe cabe; o filtro está no service)
routerAluno.get("/", exigirTipo("escola", "cuidador"), listarAlunos);
routerAluno.get("/:id", exigirTipo("escola", "cuidador"), validar({ params: alunoParamsSchema }), buscarAluno);

// Somente a escola cria, altera e exclui. O cuidador não altera dados cadastrais do aluno.
routerAluno.post("/", exigirTipo("escola"), validar({ body: criarAlunoSchema }), criarAluno);
routerAluno.patch("/:id", exigirTipo("escola"), validar({ params: alunoParamsSchema, body: atualizarAlunoSchema }), atualizarAluno);
routerAluno.delete("/:id", exigirTipo("escola"), validar({ params: alunoParamsSchema }), removerAluno);

export default routerAluno;
