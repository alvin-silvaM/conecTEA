import mongoose from 'mongoose';

export const conexao = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado ao banco de dados");
};

