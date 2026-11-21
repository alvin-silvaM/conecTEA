import { Router } from "express";
import {
    criarAluno,
    listarAlunos,
    buscarAluno,
    atualizarAluno,
    removerAluno,
    loginAluno,
    meusDadosAluno
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

// Escola e cuidador leem (cada um só o que lhe cabe; o filtro está no service)
routerAluno.get("/", exigirTipo("escola", "cuidador"), listarAlunos);
routerAluno.get("/:id", exigirTipo("escola", "cuidador"), validar({ params: alunoParamsSchema }), buscarAluno);

// Somente a escola cria, altera e exclui. O cuidador não altera dados cadastrais do aluno.
routerAluno.post("/", exigirTipo("escola"), validar({ body: criarAlunoSchema }), criarAluno);
routerAluno.patch("/:id", exigirTipo("escola"), validar({ params: alunoParamsSchema, body: atualizarAlunoSchema }), atualizarAluno);
routerAluno.delete("/:id", exigirTipo("escola"), validar({ params: alunoParamsSchema }), removerAluno);

export default routerAluno;
