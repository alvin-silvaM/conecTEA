import { baixarAudioService, buscarAudioService, gerarAudioService } from "../services/tts.service.js";
import { VOZES } from "../models/tts.model.js";
import { responderErro } from "../utils/erros.js";

// A validação (Zod) acontece antes, no middleware validar() das rotas.

// Vozes que o aluno/cuidador pode escolher
export const listarVozes = (req, res) => res.status(200).json({ vozes: VOZES });

// Gera (ou reaproveita) o áudio da frase. 201 = áudio novo; 200 = já existia para essa frase e voz.
export const gerarAudio = async (req, res) => {
    try {
        const { audio, criado } = await gerarAudioService(req.auth, req.validado.body);
        return res.status(criado ? 201 : 200).json({ message: criado ? "Áudio gerado" : "Áudio já existente", audio });
    } catch (erro) {
        return responderErro(res, erro, "Erro ao gerar áudio");
    }
};

// Dados do áudio (texto, voz e caminho no Storage)
export const buscarAudio = async (req, res) => {
    try {
        const audio = await buscarAudioService(req.auth, req.validado.params.id);
        return res.status(200).json({ audio });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// O próprio arquivo WAV, para tocar no front-end
export const baixarAudio = async (req, res) => {
    try {
        const { conteudo, contentType } = await baixarAudioService(req.auth, req.validado.params.id);
        res.set({ "Content-Type": contentType, "Cache-Control": "private, max-age=3600" });
        return res.status(200).send(conteudo);
    } catch (erro) {
        return responderErro(res, erro, "Erro ao obter áudio");
    }
};
