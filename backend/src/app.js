import express from 'express';
import dotenv from 'dotenv';
import { conexao } from './database/connection.js';
import routerEscolas from './routes/escola.route.js';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/escolas", routerEscolas);

// Conexão com o banco de dados e inicialização do servidor
(async () => {
    try {
        await conexao();
        app.listen(process.env.PORT, () => {
            console.log(`Servidor rodando na porta ${process.env.PORT}`);
        });
        
    } catch (error) {
        console.log(error.message);
    }
})();