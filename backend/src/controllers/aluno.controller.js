import jwt from 'jsonwebtoken';

import { cadastrarAlunoService } from "../services/aluno.service.js";

export const cadastrarAluno = async (req, res) => {

    const {nome, data_nascimento, vinculos, matricula, senha} = req.body;
    const escola = req.escola._id;

    if (!nome || !data_nascimento || !vinculos || vinculos.length === 0 || !matricula || !senha) return res.status(400).json({message: "Cadastro incompleto"});

    if (!req.escola) {
        return res.status(401).json({message: "Cadastro não autorizado"});
    }

    if (!escola) return res.status(401).json({message: "Cadastro não autorizado"});

    const alunoObject = {
        nome, data_nascimento, vinculos, matricula, senha, escola
    }

    try {

        const alunoCadastrado = await cadastrarAlunoService(alunoObject);

        return res.status(201).json({message: "Aluno cadastrado", alunoCadastrado});

    } catch (error) {

        return res.status(error.status || 500).json({message: error.message || "Erro ao cadastrar aluno"});
    } 

}

export const loginAluno = async (req, res) => {

    const {matricula, senha} = req.body;

    if (!matricula || !senha) return res.status(400).json({message: "Dados de login incompletos"});

    try {

        const aluno = await loginAlunoService(matricula, senha);

        const token = jwt.sign({_id: aluno._id, tipo: "aluno"}, process.env.SECRET, {expiresIn: "15d"});

        return res.status(200).json({message: "login realizado com sucesso", token});

    } catch (error) {

        return res.status(error.status || 500).json({message: error.message || "Falha no login"})
    }
}