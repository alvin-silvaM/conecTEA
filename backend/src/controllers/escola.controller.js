import {
    cadastrarEscolaService,
    loginEscolaService,
    buscarEscolaService,
    atualizarEscolaService,
    removerEscolaService
} from "../services/escola.service.js";
import { responderErro } from "../utils/erros.js";
import { assinarToken } from "../utils/seguranca.js";

// A validação (Zod) acontece antes, no middleware validar() das rotas:
// req.validado.body já contém apenas dados válidos e permitidos.

// CREATE escola no database
export const cadastrarEscola = async (req, res) => {
    try {
        const resposta = await cadastrarEscolaService(req.validado.body);
        return res.status(201).json({ message: "Escola cadastrada", resposta });
    } catch (erro) {
        return responderErro(res, erro, "Erro ao cadastrar escola");
    }
};

// Login de uma escola (post com dados de login)
export const loginEscola = async (req, res) => {
    try {
        const { cnpj, senha } = req.validado.body;
        const escola = await loginEscolaService(cnpj, senha);
        const token = assinarToken("escola", escola._id);
        return res.status(200).json({ message: "Login realizado com sucesso", token });
    } catch (erro) {
        return responderErro(res, erro, "Falha no login");
    }
};

// Lista de escolas: cada escola enxerga somente a si mesma (isolamento entre escolas)
export const listarEscolas = async (req, res) => {
    try {
        const escola = await buscarEscolaService(req.auth.escolaId);
        return res.status(200).json({ escolas: [escola] });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Consulta dos dados da escola logada
export const minhaEscola = async (req, res) => {
    try {
        const escola = await buscarEscolaService(req.auth.escolaId);
        return res.status(200).json({ escola });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Edição dos dados da escola logada
export const atualizarEscola = async (req, res) => {
    try {
        const escola = await atualizarEscolaService(req.auth.escolaId, req.validado.body);
        return res.status(200).json({ message: "Escola atualizada", escola });
    } catch (erro) {
        return responderErro(res, erro, "Erro ao atualizar escola");
    }
};

// Exclusão da escola logada (bloqueada se houver cuidadores ou alunos)
export const removerEscola = async (req, res) => {
    try {
        await removerEscolaService(req.auth.escolaId);
        return res.status(200).json({ message: "Escola excluída" });
    } catch (erro) {
        return responderErro(res, erro);
    }
};
