import { Router } from "express";
import {
    criarAluno,
    listarAlunos,
    buscarAluno,
    atualizarAluno,
    removerAluno
} from "../controllers/aluno.controller.js";
import { autenticar, exigirTipo } from "../middlewares/auth.js";

const routerAluno = Router();

// Todas as rotas exigem token
routerAluno.use(autenticar);

// Escola e cuidador leem (cada um só o que lhe cabe; o filtro está no service)
routerAluno.get("/", listarAlunos);
routerAluno.get("/:id", buscarAluno);

// Somente a escola cria, altera e exclui. O cuidador não altera dados cadastrais do aluno.
routerAluno.post("/", exigirTipo("escola"), criarAluno);
routerAluno.patch("/:id", exigirTipo("escola"), atualizarAluno);
routerAluno.delete("/:id", exigirTipo("escola"), removerAluno);

export default routerAluno;
