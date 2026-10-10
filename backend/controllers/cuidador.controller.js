import {
    criarCuidadorService,
    listarCuidadoresService,
    buscarCuidadorService,
    removerCuidadorService,
    loginCuidadorService
} from "../services/cuidador.service.js";
import { ehTexto, validarEmail, validarSenha, validarTelefone, validarObjectId } from "../utils/validacao.js";
import { responderErro } from "../utils/erros.js";
import { assinarToken } from "../utils/seguranca.js";

// Escola cadastra um cuidador
export const criarCuidador = async (req, res) => {
    const { nome, telefone, email, senha } = req.body ?? {};

    if (!nome || !telefone || !email || !senha) {
        return res.status(400).json({ message: "Campos obrigatórios não informados" });
    }
    if (!ehTexto(nome, 120)) return res.status(400).json({ message: "Nome inválido" });
    if (!validarTelefone(telefone)) return res.status(400).json({ message: "Telefone inválido" });
    if (!validarEmail(email)) return res.status(400).json({ message: "Email inválido" });
    if (!validarSenha(senha)) return res.status(400).json({ message: "Senha inválida: use no mínimo 8 caracteres" });

    try {
        const cuidador = await criarCuidadorService(req.auth.escolaId, { nome, telefone, email, senha });
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

// Escola exclui um cuidador
export const removerCuidador = async (req, res) => {
    if (!validarObjectId(req.params.id)) return res.status(400).json({ message: "Identificador inválido" });

    try {
        await removerCuidadorService(req.auth.escolaId, req.params.id);
        return res.status(200).json({ message: "Cuidador excluído" });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Login do cuidador (email + senha)
export const loginCuidador = async (req, res) => {
    const { email, senha } = req.body ?? {};

    if (!validarEmail(email) || typeof senha !== "string" || !senha) {
        return res.status(400).json({ message: "Campos incompletos ou incorretos" });
    }

    try {
        const cuidador = await loginCuidadorService(email, senha);
        const token = assinarToken("cuidador", cuidador._id);
        return res.status(200).json({ message: "Login realizado com sucesso", token });
    } catch (erro) {
        return responderErro(res, erro, "Falha no login");
    }
};
