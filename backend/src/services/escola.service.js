import { EscolaModel } from "../models/escola.model.js";
import bcrypt from "bcrypt";

// CREATE cadastro da escola
export const cadastrarEscolaService = async (escolaObject) => {

    const { email, cnpj } = escolaObject;

    const emailJaUsado = await EscolaModel.findOne({email: email.toLowerCase().trim()});

    if (emailJaUsado) {
        const erro = new Error("Endereço de email já utilizado");
        erro.status = 409;
        throw erro;
    }

    const cnpjJaUsado = await EscolaModel.findOne({cnpj});

    if (cnpjJaUsado) {
        const erro = new Error("CNPJ já cadastrado");
        erro.status = 409;
        throw erro;
    }

    try {
        const resposta = await EscolaModel.create(escolaObject);

        // Remove o hash da senha antes de devolver
        const escolaSemSenha = resposta.toObject();
        delete escolaSemSenha.senha;

        return escolaSemSenha;

    } catch (erro) {

        // Duplicidade em campo unique (ex.: razaoSocial) que passou pelas verificações acima
        if (erro.code === 11000) {
            const duplicado = new Error("Já existe uma escola cadastrada com esses dados");
            duplicado.status = 409;
            throw duplicado;
        }

        throw erro;
    }
}

// Service de login
export const loginEscolaService = async (cnpj, senha) => {

    const escola = await EscolaModel.findOne({cnpj}).select("+senha");

    if (!escola) {
        const erro = new Error("CNPJ ou senha inválidos");
        erro.status = 401;
        throw erro;
    }

    const validado = await bcrypt.compare(senha, escola.senha);

    if (!validado) {
        const erro = new Error("CNPJ ou senha inválidos");
        erro.status = 401;
        throw erro;
    }

    return escola;
}