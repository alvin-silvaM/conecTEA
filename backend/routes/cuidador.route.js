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

const routerCuidador = Router();

// Pública
routerCuidador.post("/login", limitadorLogin, loginCuidador);

// Cuidador logado
routerCuidador.get("/eu", autenticar, exigirTipo("cuidador"), meusDados);

// Somente a escola gerencia cuidadores
routerCuidador.post("/", autenticar, exigirTipo("escola"), criarCuidador);
routerCuidador.get("/", autenticar, exigirTipo("escola"), listarCuidadores);
routerCuidador.delete("/:id", autenticar, exigirTipo("escola"), removerCuidador);

export default routerCuidador;
