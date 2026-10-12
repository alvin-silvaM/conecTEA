import bcrypt from "bcrypt";
import { firestore, refUnico } from "../database/firestore.js";
import { COLECAO_ESCOLAS, escolaParaResposta } from "../models/escola.model.js";
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
