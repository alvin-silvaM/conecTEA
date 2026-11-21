import bcrypt from "bcrypt";
import { firestore, refUnico } from "../database/firestore.js";
import { COLECAO_ALUNOS, alunoParaDocumento, alunoParaResposta } from "../models/aluno.model.js";
import { COLECAO_CUIDADORES } from "../models/cuidador.model.js";
import { COLECAO_ESCOLAS } from "../models/escola.model.js";
import { ErroHttp } from "../utils/erros.js";
import { HASH_FICTICIO } from "../utils/seguranca.js";

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

// CREATE. O email do aluno é único (trava em "_unicos", criada na mesma transação).
export const criarAlunoService = async (escolaId, dados) => {
    const { senha, ...resto } = dados;
    const documento = {
        ...alunoParaDocumento(resto),
        senha: await bcrypt.hash(senha, 10),
        escola: String(escolaId),
        ativo: true
    };
    const ref = alunos().doc();
    const trava = refUnico("aluno_email", documento.email);

    await firestore().runTransaction(async (t) => {
        await exigirCuidadorDaEscola(t, escolaId, dados.cuidador);
        if ((await t.get(trava)).exists) throw new ErroHttp(409, "Endereço de email já utilizado");
        t.create(ref, documento);
        t.create(trava, { aluno: ref.id });
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

// UPDATE (parcial), em transação para o 404 e a checagem de escola serem atômicos.
// Trocar o email troca também a trava de unicidade, na mesma transação.
export const atualizarAlunoService = async (escolaId, id, alteracoes) => {
    const { senha, ...resto } = alteracoes;
    const mudancas = alunoParaDocumento(resto);
    if (senha !== undefined) mudancas.senha = await bcrypt.hash(senha, 10);
    const ref = alunos().doc(id);

    await firestore().runTransaction(async (t) => {
        const snapshot = await t.get(ref);
        if (!snapshot.exists || snapshot.data().escola !== String(escolaId)) {
            throw new ErroHttp(404, "Aluno não encontrado");
        }
        if (alteracoes.cuidador) await exigirCuidadorDaEscola(t, escolaId, alteracoes.cuidador);

        const emailAntigo = snapshot.data().email;
        const trocouEmail = resto.email !== undefined && resto.email !== emailAntigo;
        const travaNova = trocouEmail ? refUnico("aluno_email", resto.email) : null;
        if (travaNova && (await t.get(travaNova)).exists) throw new ErroHttp(409, "Endereço de email já utilizado");

        t.update(ref, mudancas);
        if (trocouEmail) {
            if (emailAntigo) t.delete(refUnico("aluno_email", emailAntigo));
            t.create(travaNova, { aluno: id });
        }
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
        if (snapshot.data().email) t.delete(refUnico("aluno_email", snapshot.data().email)); // libera o email
    });
};

// Login do aluno (email + senha). Conta inativa ou de escola inativa não entra.
export const loginAlunoService = async (email, senha) => {
    const { docs } = await alunos().where("email", "==", email).limit(1).get();
    const doc = docs[0];
    const aluno = doc?.data();

    // Sempre executa o bcrypt, mesmo sem aluno, para o tempo não revelar se o email existe
    const validado = await bcrypt.compare(senha, aluno?.senha ? aluno.senha : HASH_FICTICIO);
    if (!aluno || !validado) throw new ErroHttp(401, "Email ou senha inválidos");

    const escola = await firestore().collection(COLECAO_ESCOLAS).doc(aluno.escola).get();
    if (!aluno.ativo || !escola.exists || !escola.data().ativo) throw new ErroHttp(403, "Conta inativa");

    return { _id: doc.id };
};

// Dados do próprio aluno logado: só o necessário para a tela dele (sem cuidador, escola ou senha)
export const meusDadosAlunoService = async (id) => {
    const snapshot = await alunos().doc(id).get();
    if (!snapshot.exists) throw new ErroHttp(404, "Aluno não encontrado");
    const { nome, email, ativo, dataNascimento } = snapshot.data();
    return {
        _id: snapshot.id, nome, email, ativo,
        ...(dataNascimento ? { dataNascimento: dataNascimento.toDate().toISOString() } : {})
    };
};
