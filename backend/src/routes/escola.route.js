import { Router } from "express";
import {
    cadastrarEscola,
    loginEscola,
    listarEscolas,
    minhaEscola,
    atualizarEscola,
    removerEscola
} from "../controllers/escola.controller.js";
import { autenticar, exigirTipo } from "../middlewares/auth.js";
import { validar } from "../middlewares/validar.js";
import { atualizarEscolaSchema, cadastrarEscolaSchema, loginEscolaSchema } from "../models/escola.model.js";
import { limitadorCadastro, limitadorLogin } from "../middlewares/limitadores.js";

const routerEscola = Router();

routerEscola.post("/cadastro", limitadorCadastro, validar({ body: cadastrarEscolaSchema }), cadastrarEscola);
routerEscola.post("/", limitadorLogin, validar({ body: loginEscolaSchema, mensagem: "Campos incompletos ou incorretos" }), loginEscola);

// Escola logada: consulta, edita e exclui a si mesma
routerEscola.get("/", autenticar, exigirTipo("escola"), listarEscolas);
routerEscola.get("/eu", autenticar, exigirTipo("escola"), minhaEscola);
routerEscola.patch("/eu", autenticar, exigirTipo("escola"), validar({ body: atualizarEscolaSchema }), atualizarEscola);
routerEscola.delete("/eu", autenticar, exigirTipo("escola"), removerEscola);

export default routerEscola;
