import { firestore } from "../database/firestore.js";
import { COLECAO_ALUNOS, alunoParaDocumento, alunoParaResposta } from "../models/aluno.model.js";
import { COLECAO_CUIDADORES } from "../models/cuidador.model.js";
import { ErroHttp } from "../utils/erros.js";

// Armazenamento: Cloud Firestore. Relações são guardadas como ids (strings) e resolvidas aqui.
const alunos = () => firestore().collection(COLECAO_ALUNOS);
const cuidadores = () => firestore().collection(COLECAO_CUIDADORES);

// Dentro de uma transação, garante que o cuidador existe, está ativo e pertence à MESMA escola
// de quem faz a requisição. Ler na transação impede excluir o cuidador no meio da operação.
const exigirCuidadorDaEscola = async (t, escolaId, cuidadorId) => {
    const doc = await t.get(cuidadores().doc(cuidadorId));
    if (!doc.exists || doc.data().escola !== String(escolaId) || doc.data().ativo !== true) {
        throw new ErroHttp(400, "Cuidador inválido");
    }
};

// Escola enxerga todos os alunos dela; cuidador enxerga apenas os alunos vinculados a ele.
// Esse filtro é aplicado em TODA leitura, usando os ids do token.
const consultaDeAcesso = (auth) => {
    let consulta = alunos().where("escola", "==", String(auth.escolaId));
    if (auth.tipo !== "escola") consulta = consulta.where("cuidador", "==", String(auth.id));
    return consulta;
};

// Equivalente ao populate(): busca nome, telefone e email dos cuidadores numa só chamada
const montarRespostas = async (snapshots) => {
    const ids = [...new Set(snapshots.map((s) => s.data().cuidador))];
    const mapa = new Map();
    if (ids.length > 0) {
        const docs = await firestore().getAll(...ids.map((id) => cuidadores().doc(id)));
        for (const d of docs) {
            if (d.exists) {
                const { nome, telefone, email } = d.data();
                mapa.set(d.id, { _id: d.id, nome, telefone, email });
            }
        }
    }
    return snapshots.map((s) => alunoParaResposta(s, mapa.get(s.data().cuidador)));
};

// CREATE
export const criarAlunoService = async (escolaId, dados) => {
    const ref = alunos().doc();

    await firestore().runTransaction(async (t) => {
        await exigirCuidadorDaEscola(t, escolaId, dados.cuidador);
        t.create(ref, { ...alunoParaDocumento(dados), escola: String(escolaId), ativo: true });
    });

    return buscarAlunoService({ tipo: "escola", escolaId }, ref.id);
};

// READ (lista). Ordenação por nome feita em memória: evita exigir índice composto no Firestore.
export const listarAlunosService = async (auth) => {
    const { docs } = await consultaDeAcesso(auth).get();
    const lista = await montarRespostas(docs);
    return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
};

// READ (um)
export const buscarAlunoService = async (auth, id) => {
    const snapshot = await alunos().doc(id).get();
    const dados = snapshot.exists ? snapshot.data() : null;

    // 404 tanto para "não existe" quanto para "é de outra escola/cuidador": não revela a existência
    const permitido = dados &&
        dados.escola === String(auth.escolaId) &&
        (auth.tipo === "escola" || dados.cuidador === String(auth.id));
    if (!permitido) throw new ErroHttp(404, "Aluno não encontrado");

    return (await montarRespostas([snapshot]))[0];
};

// UPDATE (parcial), em transação para o 404 e a checagem de escola serem atômicos
export const atualizarAlunoService = async (escolaId, id, alteracoes) => {
    const ref = alunos().doc(id);

    await firestore().runTransaction(async (t) => {
        const snapshot = await t.get(ref);
        if (!snapshot.exists || snapshot.data().escola !== String(escolaId)) {
            throw new ErroHttp(404, "Aluno não encontrado");
        }
        if (alteracoes.cuidador) await exigirCuidadorDaEscola(t, escolaId, alteracoes.cuidador);
        t.update(ref, alunoParaDocumento(alteracoes));
    });

    return buscarAlunoService({ tipo: "escola", escolaId }, id);
};

// DELETE
export const removerAlunoService = async (escolaId, id) => {
    const ref = alunos().doc(id);

    await firestore().runTransaction(async (t) => {
        const snapshot = await t.get(ref);
        if (!snapshot.exists || snapshot.data().escola !== String(escolaId)) {
            throw new ErroHttp(404, "Aluno não encontrado");
        }
        t.delete(ref);
    });
};
