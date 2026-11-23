import {
    criarAlunoService,
    listarAlunosService,
    buscarAlunoService,
    atualizarAlunoService,
    removerAlunoService,
    loginAlunoService,
    meusDadosAlunoService
} from "../services/aluno.service.js";
import { responderErro } from "../utils/erros.js";
import { assinarToken } from "../utils/seguranca.js";

// A validação (Zod) acontece antes, no middleware validar() das rotas:
// aqui req.validado já contém apenas dados válidos e permitidos.

// Escola cadastra um aluno e o vincula a um cuidador da própria escola
export const criarAluno = async (req, res) => {
    try {
        const aluno = await criarAlunoService(req.auth.escolaId, req.validado.body);
        return res.status(201).json({ message: "Aluno cadastrado", aluno });
    } catch (erro) {
        return responderErro(res, erro, "Erro ao cadastrar aluno");
    }
};

// Escola vê todos os alunos; cuidador vê só os dele (o filtro está no service, a partir do token)
export const listarAlunos = async (req, res) => {
    try {
        const alunos = await listarAlunosService(req.auth);
        return res.status(200).json({ alunos });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

export const buscarAluno = async (req, res) => {
    
    try {
        const aluno = await buscarAlunoService(req.auth, req.validado.params.id);
        return res.status(200).json({ aluno });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Somente a escola altera dados do aluno. Só os campos do schema de atualização são aceitos.
export const atualizarAluno = async (req, res) => {
    try {
        const aluno = await atualizarAlunoService(req.auth.escolaId, req.validado.params.id, req.validado.body);
        return res.status(200).json({ message: "Aluno atualizado", aluno });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

export const removerAluno = async (req, res) => {
    try {
        await removerAlunoService(req.auth.escolaId, req.validado.params.id);
        return res.status(200).json({ message: "Aluno excluído" });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Login do aluno (email + senha)
export const loginAluno = async (req, res) => {
    try {
        const { email, senha } = req.validado.body;
        const aluno = await loginAlunoService(email, senha);
        const token = assinarToken("aluno", aluno._id);
        return res.status(200).json({ message: "Login realizado com sucesso", token });
    } catch (erro) {
        return responderErro(res, erro, "Falha no login");
    }
};

// Aluno logado vê os próprios dados
export const meusDadosAluno = async (req, res) => {
    try {
        const aluno = await meusDadosAlunoService(req.auth.id);
        return res.status(200).json({ aluno });
    } catch (erro) {
        return responderErro(res, erro);
    }
};
