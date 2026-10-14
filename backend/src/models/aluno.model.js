import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const alunoSchema = new mongoose.Schema({

    nome: {
        type: String,
        required: true,
        trim: true
    },

    data_nascimento: {
        type: Date,
        required: true,
    },

    vinculos: {
        type: [{
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },

        tipo: {
            type: String,
            enum: ["responsavel", "cuidador_escolar"],
            required: true
        },

        ativo: {
            type: Boolean,
            default: true
        }

    }],

        required: true,

        validate: {
            validator: function (vinculos) {
                return vinculos.length > 0;
            },

            message: "O aluno deve possuir pelo menos um vínculo"
        }
    },

    matricula: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },

    senha: {
        type: String,
        required: true,
        select: false
    },

    escola: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Escola",
        required: true
    },

    ativo: {
        type: Boolean,
        default: true
    }

})

alunoSchema.pre("save", async function () {

    if (!this.isModified("senha")) return;

    this.senha = await bcrypt.hash(this.senha, 10);
})

export const AlunoModel = mongoose.model("Aluno", alunoSchema);

