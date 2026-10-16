import { Router } from "express";
import {
    criarCuidador,
    listarCuidadores,
    meusDados,
    removerCuidador,
    loginCuidador
} from "../controllers/cuidador.controller.js";
import { autenticar, exigirTipo } from "../middlewares/auth.js";
import { limitadorLogin } from "../middlewares/limitadores.js";
import { validar } from "../middlewares/validar.js";
import { criarCuidadorSchema, cuidadorParamsSchema, loginCuidadorSchema } from "../models/cuidador.model.js";

const routerCuidador = Router();

// Pública
routerCuidador.post("/login", limitadorLogin, validar({ body: loginCuidadorSchema, mensagem: "Campos incompletos ou incorretos" }), loginCuidador);

// Cuidador logado
routerCuidador.get("/eu", autenticar, exigirTipo("cuidador"), meusDados);

// Somente a escola gerencia cuidadores
routerCuidador.post("/", autenticar, exigirTipo("escola"), validar({ body: criarCuidadorSchema }), criarCuidador);
routerCuidador.get("/", autenticar, exigirTipo("escola"), listarCuidadores);
routerCuidador.delete("/:id", autenticar, exigirTipo("escola"), validar({ params: cuidadorParamsSchema }), removerCuidador);

export default routerCuidador;
