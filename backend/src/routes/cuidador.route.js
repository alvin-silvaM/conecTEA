import { Router } from "express";
import {
    criarCuidador,
    listarCuidadores,
    buscarCuidador,
    atualizarCuidador,
    meusDados,
    removerCuidador,
    loginCuidador,
    atualizarMeusDados,
    inicioCuidador
} from "../controllers/cuidador.controller.js";
import { autenticar, exigirTipo } from "../middlewares/auth.js";
import { limitadorLogin } from "../middlewares/limitadores.js";
import { validar } from "../middlewares/validar.js";
import { atualizarCuidadorSchema, atualizarMeusDadosSchema, criarCuidadorSchema, cuidadorParamsSchema, loginCuidadorSchema } from "../models/cuidador.model.js";

const routerCuidador = Router();

// Pública
routerCuidador.post("/login", limitadorLogin, validar({ body: loginCuidadorSchema, mensagem: "Campos incompletos ou incorretos" }), loginCuidador);

// Cuidador logado
routerCuidador.get("/eu", autenticar, exigirTipo("cuidador"), meusDados);
routerCuidador.get("/eu/inicio", autenticar, exigirTipo("cuidador"), inicioCuidador);
// Só nome e telefone. Precisa vir antes de PATCH "/:id", que é da escola.
routerCuidador.patch("/eu", autenticar, exigirTipo("cuidador"), validar({ body: atualizarMeusDadosSchema }), atualizarMeusDados);

// Somente a escola gerencia cuidadores
routerCuidador.post("/", autenticar, exigirTipo("escola"), validar({ body: criarCuidadorSchema }), criarCuidador);
routerCuidador.get("/", autenticar, exigirTipo("escola"), listarCuidadores);
routerCuidador.get("/:id", autenticar, exigirTipo("escola"), validar({ params: cuidadorParamsSchema }), buscarCuidador);
routerCuidador.patch("/:id", autenticar, exigirTipo("escola"), validar({ params: cuidadorParamsSchema, body: atualizarCuidadorSchema }), atualizarCuidador);
routerCuidador.delete("/:id", autenticar, exigirTipo("escola"), validar({ params: cuidadorParamsSchema }), removerCuidador);

export default routerCuidador;
