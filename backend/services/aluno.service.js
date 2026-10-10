import { AlunoModel } from "../models/aluno.model.js";
import { CuidadorModel } from "../models/cuidador.model.js";
import { ErroHttp } from "../utils/erros.js";

const CAMPOS_CUIDADOR = "nome telefone email";

// Garante que o cuidador existe, está ativo e pertence à MESMA escola de quem faz a requisição
const exigirCuidadorDaEscola = async (escolaId, cuidadorId) => {
    const existe = await CuidadorModel.exists({ _id: cuidadorId, escola: escolaId, ativo: true });
    if (!existe) throw new ErroHttp(400, "Cuidador inválido");
};

// Escola enxerga todos os alunos dela; cuidador enxerga apenas os alunos vinculados a ele.
// Esse filtro é aplicado em TODA leitura, usando os ids do token.
const filtroDeAcesso = (auth) =>
    auth.tipo === "escola"
        ? { escola: auth.escolaId }
        : { escola: auth.escolaId, cuidador: auth.id };

export const criarAlunoService = async (escolaId, dados) => {
    await exigirCuidadorDaEscola(escolaId, dados.cuidador);

    const aluno = await AlunoModel.create({ ...dados, escola: escolaId });
    return buscarAlunoService({ tipo: "escola", escolaId }, aluno._id);
};

export const listarAlunosService = (auth) =>
    AlunoModel.find(filtroDeAcesso(auth))
        .select("-__v -escola")
        .populate("cuidador", CAMPOS_CUIDADOR)
        .sort({ nome: 1 })
        .lean();

export const buscarAlunoService = async (auth, id) => {
    const aluno = await AlunoModel.findOne({ _id: id, ...filtroDeAcesso(auth) })
        .select("-__v -escola")
        .populate("cuidador", CAMPOS_CUIDADOR)
        .lean();

    // 404 tanto para "não existe" quanto para "é de outra escola/cuidador": não revela a existência
    if (!aluno) throw new ErroHttp(404, "Aluno não encontrado");
    return aluno;
};

export const atualizarAlunoService = async (escolaId, id, alteracoes) => {
    if (alteracoes.cuidador) await exigirCuidadorDaEscola(escolaId, alteracoes.cuidador);

    const aluno = await AlunoModel.findOneAndUpdate(
        { _id: id, escola: escolaId },
        { $set: alteracoes },
        { new: true, runValidators: true }
    );
    if (!aluno) throw new ErroHttp(404, "Aluno não encontrado");

    return buscarAlunoService({ tipo: "escola", escolaId }, aluno._id);
};

export const removerAlunoService = async (escolaId, id) => {
    const removido = await AlunoModel.findOneAndDelete({ _id: id, escola: escolaId });
    if (!removido) throw new ErroHttp(404, "Aluno não encontrado");
};
