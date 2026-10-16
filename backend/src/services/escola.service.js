import bcrypt from "bcrypt";
import { FieldValue } from "firebase-admin/firestore";
import { firestore, refUnico } from "../database/firestore.js";
import { COLECAO_ESCOLAS, escolaParaResposta } from "../models/escola.model.js";
import { COLECAO_CUIDADORES } from "../models/cuidador.model.js";
import { COLECAO_ALUNOS } from "../models/aluno.model.js";
import { ErroHttp } from "../utils/erros.js";
import { HASH_FICTICIO } from "../utils/seguranca.js";

// CREATE cadastro da escola. Email, CNPJ e razão social são únicos (travas em "_unicos").
export const cadastrarEscolaService = async (dados) => {
    const { senha, ...resto } = dados;
    const documento = { ...resto, senha: await bcrypt.hash(senha, 10), ativo: true };

    const db = firestore();
    const ref = db.collection(COLECAO_ESCOLAS).doc();
    const travaEmail = refUnico("escola_email", documento.email);
    const travaCnpj = refUnico("escola_cnpj", documento.cnpj);
    const travaRazao = refUnico("escola_razao", documento.razaoSocial);

    await db.runTransaction(async (t) => {
        const [email, cnpj, razao] = await t.getAll(travaEmail, travaCnpj, travaRazao);

        if (email.exists) throw new ErroHttp(409, "Endereço de email já utilizado");
        if (cnpj.exists) throw new ErroHttp(409, "CNPJ já cadastrado");
        if (razao.exists) throw new ErroHttp(409, "Já existe uma escola cadastrada com esses dados");

        t.create(ref, documento);
        for (const trava of [travaEmail, travaCnpj, travaRazao]) t.create(trava, { escola: ref.id });
    });

    // Nunca devolve o hash da senha
    return escolaParaResposta(ref.id, documento);
};

// Service de login
export const loginEscolaService = async (cnpj, senha) => {
    const { docs } = await firestore().collection(COLECAO_ESCOLAS).where("cnpj", "==", cnpj).limit(1).get();
    const doc = docs[0];
    const escola = doc?.data();

    // Sempre executa o bcrypt, mesmo sem escola, para o tempo de resposta não revelar se o CNPJ existe
    const validado = await bcrypt.compare(senha, escola ? escola.senha : HASH_FICTICIO);

    if (!escola || !validado) throw new ErroHttp(401, "CNPJ ou senha inválidos");

    // Só informa que a conta está inativa depois de a senha estar correta
    if (!escola.ativo) throw new ErroHttp(403, "Conta inativa");

    return { _id: doc.id };
};

// READ: a escola só enxerga a si mesma (id vem do token)
export const buscarEscolaService = async (escolaId) => {
    const doc = await firestore().collection(COLECAO_ESCOLAS).doc(escolaId).get();
    if (!doc.exists) throw new ErroHttp(404, "Escola não encontrada");
    return escolaParaResposta(doc.id, doc.data());
};

// UPDATE parcial da própria escola. Trocar email ou razão social troca também a trava de unicidade,
// tudo na mesma transação.
export const atualizarEscolaService = async (escolaId, alteracoes) => {
    const { senha, telefone2, ...resto } = alteracoes;
    const mudancas = { ...resto };
    if (senha !== undefined) mudancas.senha = await bcrypt.hash(senha, 10);
    if (telefone2 !== undefined) mudancas.telefone2 = telefone2 === null ? FieldValue.delete() : telefone2;

    const ref = firestore().collection(COLECAO_ESCOLAS).doc(escolaId);

    await firestore().runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists) throw new ErroHttp(404, "Escola não encontrada");
        const atual = doc.data();

        const trocas = [];
        if (resto.email !== undefined && resto.email !== atual.email) {
            trocas.push({ tipo: "escola_email", antigo: atual.email, novo: resto.email, erro: "Endereço de email já utilizado" });
        }
        if (resto.razaoSocial !== undefined && resto.razaoSocial !== atual.razaoSocial) {
            trocas.push({ tipo: "escola_razao", antigo: atual.razaoSocial, novo: resto.razaoSocial, erro: "Já existe uma escola cadastrada com esses dados" });
        }

        const novas = trocas.map((x) => refUnico(x.tipo, x.novo));
        const existentes = novas.length ? await t.getAll(...novas) : [];
        existentes.forEach((d, i) => {
            if (d.exists) throw new ErroHttp(409, trocas[i].erro);
        });

        t.update(ref, mudancas);
        trocas.forEach((x, i) => {
            t.delete(refUnico(x.tipo, x.antigo));
            t.create(novas[i], { escola: escolaId });
        });
    });

    return buscarEscolaService(escolaId);
};

// DELETE da própria escola. Não apaga em cascata: com cuidadores ou alunos vinculados, responde 409.
export const removerEscolaService = async (escolaId) => {
    const db = firestore();
    const ref = db.collection(COLECAO_ESCOLAS).doc(escolaId);

    await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists) throw new ErroHttp(404, "Escola não encontrada");

        const [cuidadores, alunos] = await Promise.all([
            t.get(db.collection(COLECAO_CUIDADORES).where("escola", "==", escolaId).limit(1)),
            t.get(db.collection(COLECAO_ALUNOS).where("escola", "==", escolaId).limit(1))
        ]);
        if (!cuidadores.empty || !alunos.empty) {
            throw new ErroHttp(409, "Escola possui cuidadores ou alunos: exclua-os antes de excluir a escola");
        }

        const { email, cnpj, razaoSocial } = doc.data();
        t.delete(ref);
        t.delete(refUnico("escola_email", email));
        t.delete(refUnico("escola_cnpj", cnpj));
        t.delete(refUnico("escola_razao", razaoSocial));
    });
};
