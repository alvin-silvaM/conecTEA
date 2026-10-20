import bcrypt from "bcrypt";
import { firestore, refUnico } from "../database/firestore.js";
import { COLECAO_ALUNOS } from "../models/aluno.model.js";
import { COLECAO_CUIDADORES, cuidadorParaResposta } from "../models/cuidador.model.js";
import { COLECAO_ESCOLAS } from "../models/escola.model.js";
import { ErroHttp } from "../utils/erros.js";
import { HASH_FICTICIO } from "../utils/seguranca.js";

const cuidadores = () => firestore().collection(COLECAO_CUIDADORES);

// A escola cadastra o cuidador. O id da escola vem do token (escolaId), nunca do body.
// O email é único (trava em "_unicos", criada na mesma transação).
export const criarCuidadorService = async (escolaId, dados) => {
    const { senha, ...resto } = dados;
    const documento = { ...resto, senha: await bcrypt.hash(senha, 10), escola: String(escolaId), ativo: true };

    const ref = cuidadores().doc();
    const trava = refUnico("cuidador_email", documento.email);

    await firestore().runTransaction(async (t) => {
        if ((await t.get(trava)).exists) throw new ErroHttp(409, "Endereço de email já utilizado");
        t.create(ref, documento);
        t.create(trava, { cuidador: ref.id });
    });

    return cuidadorParaResposta(ref.id, documento);
};

export const listarCuidadoresService = async (escolaId) => {
    const { docs } = await cuidadores().where("escola", "==", String(escolaId)).get();
    return docs
        .map((d) => cuidadorParaResposta(d.id, d.data()))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
};

export const buscarCuidadorService = async (id) => {
    const doc = await cuidadores().doc(id).get();
    if (!doc.exists) throw new ErroHttp(404, "Cuidador não encontrado");
    return cuidadorParaResposta(doc.id, doc.data());
};

// READ (um) pela escola dona do cuidador; 404 também para cuidador de outra escola
export const buscarCuidadorDaEscolaService = async (escolaId, id) => {
    const cuidador = await buscarCuidadorService(id);
    if (cuidador.escola !== String(escolaId)) throw new ErroHttp(404, "Cuidador não encontrado");
    return cuidador;
};

// UPDATE parcial pela escola. Trocar o email troca também a trava de unicidade, na mesma transação.
export const atualizarCuidadorService = async (escolaId, id, alteracoes) => {
    const { senha, ...resto } = alteracoes;
    const mudancas = { ...resto };
    if (senha !== undefined) mudancas.senha = await bcrypt.hash(senha, 10);

    const ref = cuidadores().doc(id);

    await firestore().runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists || doc.data().escola !== String(escolaId)) {
            throw new ErroHttp(404, "Cuidador não encontrado");
        }

        const trocouEmail = resto.email !== undefined && resto.email !== doc.data().email;
        const travaNova = trocouEmail ? refUnico("cuidador_email", resto.email) : null;
        if (travaNova && (await t.get(travaNova)).exists) {
            throw new ErroHttp(409, "Endereço de email já utilizado");
        }

        t.update(ref, mudancas);
        if (trocouEmail) {
            t.delete(refUnico("cuidador_email", doc.data().email));
            t.create(travaNova, { cuidador: id });
        }
    });

    return buscarCuidadorService(id);
};

export const removerCuidadorService = async (escolaId, id) => {
    const ref = cuidadores().doc(id);

    // Leitura e exclusão na mesma transação: o vínculo com aluno é checado no momento de apagar
    await firestore().runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists || doc.data().escola !== String(escolaId)) {
            throw new ErroHttp(404, "Cuidador não encontrado");
        }

        // Todo aluno precisa de um cuidador principal: não deixa excluir enquanto houver vínculo
        const vinculado = await t.get(
            firestore().collection(COLECAO_ALUNOS)
                .where("escola", "==", String(escolaId))
                .where("cuidador", "==", id)
                .limit(1)
        );
        if (!vinculado.empty) {
            throw new ErroHttp(409, "Cuidador possui alunos vinculados: reatribua os alunos antes de excluir");
        }

        t.delete(ref);
        t.delete(refUnico("cuidador_email", doc.data().email)); // libera o email para novo cadastro
    });
};

export const loginCuidadorService = async (email, senha) => {
    const { docs } = await cuidadores().where("email", "==", email).limit(1).get();
    const doc = docs[0];
    const cuidador = doc?.data();

    // Sempre executa o bcrypt, mesmo sem cuidador, para o tempo não revelar se o email existe
    const validado = await bcrypt.compare(senha, cuidador ? cuidador.senha : HASH_FICTICIO);

    if (!cuidador || !validado) throw new ErroHttp(401, "Email ou senha inválidos");

    const escola = await firestore().collection(COLECAO_ESCOLAS).doc(cuidador.escola).get();
    if (!cuidador.ativo || !escola.exists || !escola.data().ativo) throw new ErroHttp(403, "Conta inativa");

    return { _id: doc.id };
};
