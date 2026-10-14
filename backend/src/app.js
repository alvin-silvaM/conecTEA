import express from 'express';
import dotenv from 'dotenv';
import routerEscolas from './routes/escola.route.js';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/escolas", routerEscolas);

// Inicialização do servidor
(async () => {

    try {
        app.listen(process.env.PORT, () => {
            console.log(`Servidor rodando na porta ${process.env.PORT}`);
        });
        
    } catch (error) {
        console.log(error.message);
    }
})();