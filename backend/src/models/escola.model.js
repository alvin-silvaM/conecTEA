import mongoose from "mongoose";
import bcrypt from "bcrypt";

const escolaSchema = new mongoose.Schema({

    cnpj: {
        type: String,
        required: true,
        unique: true,
        match: /^\d{14}$/
    },

    razaoSocial: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    endereco: {

        numero: {
            type: Number,
            required: true
        },

        rua: {
            type: String,
            required: true
        },

        municipio: {
            type: String,
            required: true
        },

        estado: {
            type: String,
            required: true
        }

    },

    telefone1: {
        type: String,
        required: true
    },

    telefone2: {
        type: String
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    senha: {
        type: String,
        required: true,
        select: false
    },

    ativo: {
        type: Boolean,
        default: true
    }

});

// Gera o hash da senha antes de salvar (somente se a senha foi criada/alterada)
escolaSchema.pre("save", async function () {

    if (!this.isModified("senha")) return;
    
    this.senha = await bcrypt.hash(this.senha, 10);
});

export const EscolaModel = mongoose.model("Escola", escolaSchema);