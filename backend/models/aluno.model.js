import mongoose from "mongoose";

// Dados do aluno são sensíveis (LGPD): guardamos só o necessário para o MVP.
// O aluno não tem login.
const alunoSchema = new mongoose.Schema({

    nome: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },

    dataNascimento: {
        type: Date
    },

    // Cuidador principal (um por aluno). Um cuidador pode ter vários alunos.
    cuidador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cuidador",
        required: true,
        index: true
    },

    // Escola dona do cadastro. Sempre preenchida a partir do token.
    escola: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Escola",
        required: true,
        index: true
    },

    ativo: {
        type: Boolean,
        default: true
    }

});

export const AlunoModel = mongoose.model("Aluno", alunoSchema);
