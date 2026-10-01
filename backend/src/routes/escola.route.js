import { Router } from "express";
import { cadastrarEscola, loginEscola } from "../controllers/escola.controller.js";

const routerEscola = Router();

routerEscola.post("/cadastro", cadastrarEscola);
routerEscola.post("/", loginEscola);

export default routerEscola;