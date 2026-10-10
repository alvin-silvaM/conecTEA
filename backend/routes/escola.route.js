import { Router } from "express";
import { cadastrarEscola, loginEscola } from "../controllers/escola.controller.js";
import { limitadorCadastro, limitadorLogin } from "../middlewares/limitadores.js";

const routerEscola = Router();

routerEscola.post("/cadastro", limitadorCadastro, cadastrarEscola);
routerEscola.post("/", limitadorLogin, loginEscola);

export default routerEscola;
