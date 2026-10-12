import { Router } from "express";
import { cadastrarEscola, loginEscola } from "../controllers/escola.controller.js";
import { validar } from "../middlewares/validar.js";
import { cadastrarEscolaSchema, loginEscolaSchema } from "../models/escola.model.js";
import { limitadorCadastro, limitadorLogin } from "../middlewares/limitadores.js";

const routerEscola = Router();

routerEscola.post("/cadastro", limitadorCadastro, validar({ body: cadastrarEscolaSchema }), cadastrarEscola);
routerEscola.post("/", limitadorLogin, validar({ body: loginEscolaSchema, mensagem: "Campos incompletos ou incorretos" }), loginEscola);

export default routerEscola;
