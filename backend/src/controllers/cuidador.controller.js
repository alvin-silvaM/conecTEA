import {
    criarCuidadorService,
    listarCuidadoresService,
    buscarCuidadorService,
    buscarCuidadorDaEscolaService,
    atualizarCuidadorService,
    removerCuidadorService,
    loginCuidadorService
} from "../services/cuidador.service.js";
import { responderErro } from "../utils/erros.js";
import { assinarToken } from "../utils/seguranca.js";

// A validação (Zod) acontece antes, no middleware validar() das rotas.

// Escola cadastra um cuidador
export const criarCuidador = async (req, res) => {
    try {
        const cuidador = await criarCuidadorService(req.auth.escolaId, req.validado.body);
        return res.status(201).json({ message: "Cuidador cadastrado", cuidador });
    } catch (erro) {
        return responderErro(res, erro, "Erro ao cadastrar cuidador");
    }
};

// Escola lista os cuidadores dela
export const listarCuidadores = async (req, res) => {
    try {
        const cuidadores = await listarCuidadoresService(req.auth.escolaId);
        return res.status(200).json({ cuidadores });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Cuidador vê os próprios dados
export const meusDados = async (req, res) => {
    try {
        const cuidador = await buscarCuidadorService(req.auth.id);
        return res.status(200).json({ cuidador });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Escola consulta um cuidador dela
export const buscarCuidador = async (req, res) => {
    try {
        const cuidador = await buscarCuidadorDaEscolaService(req.auth.escolaId, req.validado.params.id);
        return res.status(200).json({ cuidador });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Escola edita um cuidador dela
export const atualizarCuidador = async (req, res) => {
    try {
        const cuidador = await atualizarCuidadorService(req.auth.escolaId, req.validado.params.id, req.validado.body);
        return res.status(200).json({ message: "Cuidador atualizado", cuidador });
    } catch (erro) {
        return responderErro(res, erro, "Erro ao atualizar cuidador");
    }
};

// Escola exclui um cuidador
export const removerCuidador = async (req, res) => {
    try {
        await removerCuidadorService(req.auth.escolaId, req.validado.params.id);
        return res.status(200).json({ message: "Cuidador excluído" });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Login do cuidador (email + senha)
export const loginCuidador = async (req, res) => {
    try {
        const { email, senha } = req.validado.body;
        const cuidador = await loginCuidadorService(email, senha);
        const token = assinarToken("cuidador", cuidador._id);
        return res.status(200).json({ message: "Login realizado com sucesso", token });
    } catch (erro) {
        return responderErro(res, erro, "Falha no login");
    }
};
