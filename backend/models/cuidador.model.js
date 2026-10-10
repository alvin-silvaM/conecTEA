import mongoose from "mongoose";
import bcrypt from "bcrypt";

const cuidadorSchema = new mongoose.Schema({

    nome: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },

    telefone: {
        type: String,
        required: true,
        trim: true
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

    // Escola dona do cadastro. Sempre preenchida a partir do token, nunca do corpo da requisição.
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

cuidadorSchema.pre("save", async function () {
    if (!this.isModified("senha")) return;
    this.senha = await bcrypt.hash(this.senha, 10);
});

export const CuidadorModel = mongoose.model("Cuidador", cuidadorSchema);
