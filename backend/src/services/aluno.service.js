import bcrypt from 'bcrypt';

import { AlunoModel } from "../models/aluno.model.js";
import { EscolaModel } from "../models/escola.model.js";
import { validarVinculos } from '../utils/entidades.util.js';


export const cadastrarAlunoService = async (alunoObject) => {

    const escolaId = alunoObject.escola;
    const matriculaAluno = alunoObject.matricula;
    const vinculos = alunoObject.vinculos;

    const escolaExiste = await EscolaModel.findById(escolaId);

    if (!escolaExiste) {
        const erro = new Error("Escola inexistente");
        erro.status = 401;
        throw erro;
    }

    // Dispara erro se algum vinculo tiver inválido
    await validarVinculos(vinculos);

    const alunoExiste = await AlunoModel.findOne({matricula: matriculaAluno});

    if (alunoExiste) {
        const erro = new Error("Matrícula já usada");
        erro.status = 409;
        throw erro;
    }

    try {
        
        const alunoCadastrado = await AlunoModel.create(alunoObject);
        const alunoSemSenha = alunoCadastrado.toObject()
        delete alunoSemSenha.senha;

        return alunoSemSenha;

    } catch (error) {

        // Erro de duplicidade (cadastro não tem idempotência)
        if (error.code === 11000) {
            const erro = new Error("Já existe um aluno com esse cadastro");
            erro.status = 409;
            throw erro;
        }

        throw error;
    }

}

export const loginAlunoService = async (matricula, senha) => {

    const alunoCadastrado = await AlunoModel.findOne({matricula}).select("+senha");

    if (!alunoCadastrado) {
        const erro = new Error("Matrícula ou senha inválidos");
        erro.status = 401;
        throw erro;
    }

    const senhaValida = await bcrypt.compare(senha, alunoCadastrado.senha);

    if (!senhaValida) {
        const erro = new Error("Matrícula ou senha inválidos");
        erro.status = 401;
        throw erro;
    }

    return alunoCadastrado;
}

