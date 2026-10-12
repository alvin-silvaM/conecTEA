import { Router } from "express";
import {
    criarAluno,
    listarAlunos,
    buscarAluno,
    atualizarAluno,
    removerAluno
} from "../controllers/aluno.controller.js";
import { autenticar, exigirTipo } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { alunoParamsSchema, criarAlunoSchema, atualizarAlunoSchema } from "../models/aluno.model.js";

const routerAluno = Router();

// Todas as rotas exigem token
routerAluno.use(autenticar);

// Escola e cuidador leem (cada um só o que lhe cabe; o filtro está no service)
routerAluno.get("/", listarAlunos);
routerAluno.get("/:id", validar({ params: alunoParamsSchema }), buscarAluno);

// Somente a escola cria, altera e exclui. O cuidador não altera dados cadastrais do aluno.
routerAluno.post("/", exigirTipo("escola"), validar({ body: criarAlunoSchema }), criarAluno);
routerAluno.patch("/:id", exigirTipo("escola"), validar({ params: alunoParamsSchema, body: atualizarAlunoSchema }), atualizarAluno);
routerAluno.delete("/:id", exigirTipo("escola"), validar({ params: alunoParamsSchema }), removerAluno);

export default routerAluno;
