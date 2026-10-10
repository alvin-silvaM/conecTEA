import {
    criarAlunoService,
    listarAlunosService,
    buscarAlunoService,
    atualizarAlunoService,
    removerAlunoService
} from "../services/aluno.service.js";
import { ehTexto, validarData, validarObjectId } from "../utils/validacao.js";
import { responderErro } from "../utils/erros.js";

// Escola cadastra um aluno e o vincula a um cuidador da própria escola
export const criarAluno = async (req, res) => {
    const { nome, dataNascimento, cuidador } = req.body ?? {};

    if (!nome || !cuidador) {
        return res.status(400).json({ message: "Campos obrigatórios não informados" });
    }
    if (!ehTexto(nome, 120)) return res.status(400).json({ message: "Nome inválido" });
    if (!validarObjectId(cuidador)) return res.status(400).json({ message: "Cuidador inválido" });
    if (dataNascimento !== undefined && !validarData(dataNascimento)) {
        return res.status(400).json({ message: "Data de nascimento inválida: use AAAA-MM-DD" });
    }

    const dados = { nome, cuidador };
    if (dataNascimento !== undefined) dados.dataNascimento = dataNascimento;

    try {
        const aluno = await criarAlunoService(req.auth.escolaId, dados);
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
    if (!validarObjectId(req.params.id)) return res.status(400).json({ message: "Identificador inválido" });

    try {
        const aluno = await buscarAlunoService(req.auth, req.params.id);
        return res.status(200).json({ aluno });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Somente a escola altera dados do aluno. Só os campos abaixo são aceitos.
export const atualizarAluno = async (req, res) => {
    if (!validarObjectId(req.params.id)) return res.status(400).json({ message: "Identificador inválido" });

    const { nome, dataNascimento, cuidador, ativo } = req.body ?? {};
    const alteracoes = {};

    if (nome !== undefined) {
        if (!ehTexto(nome, 120)) return res.status(400).json({ message: "Nome inválido" });
        alteracoes.nome = nome;
    }
    if (dataNascimento !== undefined) {
        if (!validarData(dataNascimento)) {
            return res.status(400).json({ message: "Data de nascimento inválida: use AAAA-MM-DD" });
        }
        alteracoes.dataNascimento = dataNascimento;
    }
    if (cuidador !== undefined) {
        if (!validarObjectId(cuidador)) return res.status(400).json({ message: "Cuidador inválido" });
        alteracoes.cuidador = cuidador;
    }
    if (ativo !== undefined) {
        if (typeof ativo !== "boolean") return res.status(400).json({ message: "Campo ativo inválido" });
        alteracoes.ativo = ativo;
    }

    if (Object.keys(alteracoes).length === 0) {
        return res.status(400).json({ message: "Nenhum campo para atualizar" });
    }

    try {
        const aluno = await atualizarAlunoService(req.auth.escolaId, req.params.id, alteracoes);
        return res.status(200).json({ message: "Aluno atualizado", aluno });
    } catch (erro) {
        return responderErro(res, erro);
    }
};

export const removerAluno = async (req, res) => {
    if (!validarObjectId(req.params.id)) return res.status(400).json({ message: "Identificador inválido" });

    try {
        await removerAlunoService(req.auth.escolaId, req.params.id);
        return res.status(200).json({ message: "Aluno excluído" });
    } catch (erro) {
        return responderErro(res, erro);
    }
};
