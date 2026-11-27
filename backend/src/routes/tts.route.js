import { Router } from "express";
import { baixarAudio, buscarAudio, gerarAudio, listarVozes } from "../controllers/tts.controller.js";
import { autenticar, exigirTipo } from "../middlewares/auth.js";
import { limitadorTts } from "../middlewares/limitadores.js";
import { validar } from "../middlewares/validar.js";
import { audioParamsSchema, gerarAudioSchema } from "../models/tts.model.js";

const routerTts = Router();

// Todas as rotas exigem token. Quem usa o comunicador (aluno) e o cuidador podem gerar e ouvir áudios.
routerTts.use(autenticar, exigirTipo("aluno", "cuidador"));

routerTts.get("/vozes", listarVozes);
routerTts.post("/audios", limitadorTts, validar({ body: gerarAudioSchema }), gerarAudio);
routerTts.get("/audios/:id", validar({ params: audioParamsSchema }), buscarAudio);
routerTts.get("/audios/:id/arquivo", validar({ params: audioParamsSchema }), baixarAudio);

export default routerTts;
