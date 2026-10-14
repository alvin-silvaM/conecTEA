import jwt from "jsonwebtoken";

import { cadastrarEscolaService, loginEscolaService } from "../services/escola.service.js";
import { validarCNPJ } from "../utils/entidades.util.js";


// CUD para escola

// CREATE escola no database
export const cadastrarEscola = async (req, res) => {

    const { cnpj, razaoSocial, endereco, telefone1, telefone2, email, senha, ativo } = req.body;

    if (!cnpj || !razaoSocial || !endereco || !telefone1 || !email || !senha) {
        return res.status(400).json({ message: "Campos obrigatórios não informados" });
    }

    if (!validarCNPJ(cnpj)) {
        return res.status(400).json({ message: "CNPJ inválido: informe 14 dígitos, somente números" });
    }

    const { numero, rua, municipio, estado } = endereco;

    if (!numero || !rua || !municipio || !estado) {
        return res.status(400).json({ message: "Endereço incompleto" });
    }

    const escolaObjeto = {
        cnpj,
        razaoSocial,
        endereco,
        telefone1,
        telefone2,
        email,
        senha,
        ativo
    };

    try {

        const resposta = await cadastrarEscolaService(escolaObjeto);

        return res.status(201).json({ message: "Escola cadastrada", resposta });

    } catch (erro) {

        return res.status(erro.status || 500).json({ message: erro.message || "Erro ao cadastrar escola" });
    }

}

// Login de uma escola (post com dados de login)
export const loginEscola = async (req, res) => {

    const { cnpj, senha } = req.body;

    if (!cnpj || !senha || !validarCNPJ(cnpj)) {
        return res.status(400).json({ message: "Campos incompletos ou incorretos" });
    }

    try {

        const escola = await loginEscolaService(cnpj, senha);

        const token = jwt.sign({_id: escola._id, tipo: "escola"}, process.env.SECRET, {expiresIn: "1d"});

        return res.status(200).json({ message: "Login realizado com sucesso", token });

    } catch (erro) {

        return res.status(erro.status || 500).json({ message: erro.message || "Falha no login" });
    }

}