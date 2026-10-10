import bcrypt from "bcrypt";
import { CuidadorModel } from "../models/cuidador.model.js";
import { AlunoModel } from "../models/aluno.model.js";
import { EscolaModel } from "../models/escola.model.js";
import { ErroHttp } from "../utils/erros.js";
import { HASH_FICTICIO } from "../utils/seguranca.js";

const semSegredos = (doc) => {
    const obj = doc.toObject();
    delete obj.senha;
    delete obj.__v;
    return obj;
};

// A escola cadastra o cuidador. O id da escola vem do token (escolaId), nunca do body.
export const criarCuidadorService = async (escolaId, dados) => {
    try {
        const cuidador = await CuidadorModel.create({ ...dados, escola: escolaId });
        return semSegredos(cuidador);
    } catch (erro) {
        if (erro.code === 11000) throw new ErroHttp(409, "Endereço de email já utilizado");
        throw erro;
    }
};

export const listarCuidadoresService = (escolaId) =>
    CuidadorModel.find({ escola: escolaId }).select("-__v").sort({ nome: 1 }).lean();

export const buscarCuidadorService = async (id) => {
    const cuidador = await CuidadorModel.findById(id).select("-__v").lean();
    if (!cuidador) throw new ErroHttp(404, "Cuidador não encontrado");
    return cuidador;
};

export const removerCuidadorService = async (escolaId, id) => {
    const cuidador = await CuidadorModel.findOne({ _id: id, escola: escolaId });
    if (!cuidador) throw new ErroHttp(404, "Cuidador não encontrado");

    // Todo aluno precisa de um cuidador principal: não deixa excluir enquanto houver vínculo
    const vinculados = await AlunoModel.countDocuments({ escola: escolaId, cuidador: id });
    if (vinculados > 0) {
        throw new ErroHttp(409, "Cuidador possui alunos vinculados: reatribua os alunos antes de excluir");
    }

    await cuidador.deleteOne();
};

export const loginCuidadorService = async (email, senha) => {
    const cuidador = await CuidadorModel.findOne({ email: email.toLowerCase().trim() }).select("+senha");

    // Sempre executa o bcrypt, mesmo sem cuidador, para o tempo não revelar se o email existe
    const validado = await bcrypt.compare(senha, cuidador ? cuidador.senha : HASH_FICTICIO);

    if (!cuidador || !validado) throw new ErroHttp(401, "Email ou senha inválidos");

    const escolaAtiva = await EscolaModel.exists({ _id: cuidador.escola, ativo: true });
    if (!cuidador.ativo || !escolaAtiva) throw new ErroHttp(403, "Conta inativa");

    return cuidador;
};
