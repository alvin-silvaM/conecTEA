import 'dotenv/config'; // precisa vir primeiro: os módulos abaixo leem process.env ao serem importados
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { iniciarFirestore, validarConfigFirebase } from './database/firestore.js';
import routerEscolas from './routes/escola.route.js';
import routerCuidadores from './routes/cuidador.route.js';
import routerAlunos from './routes/aluno.route.js';

// Falha logo na inicialização se a configuração essencial estiver ausente ou fraca
if (!process.env.SECRET || process.env.SECRET.length < 32) {
    console.error(
        "Configuração insegura: SECRET precisa ter pelo menos 32 caracteres. " +
        "Gere uma com: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
    process.exit(1);
}

const errosFirebase = validarConfigFirebase();
if (errosFirebase.length > 0) {
    console.error(`Configuração do Firebase inválida: ${errosFirebase.join("; ")}`);
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

const app = express();

app.use(helmet());

// CORS só é habilitado se CORS_ORIGIN estiver definido (lista separada por vírgula).
// O front-end de teste usa proxy e não precisa disso; o front-end oficial vai precisar.
if (process.env.CORS_ORIGIN) {
    app.use(cors({ origin: process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
}

app.use(express.json({ limit: "50kb" }));

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/escolas", routerEscolas);
app.use("/cuidadores", routerCuidadores);
app.use("/alunos", routerAlunos);

app.use((req, res) => res.status(404).json({ message: "Rota não encontrada" }));

// Tratador final: JSON malformado vira 400; o resto vira 500 genérico (detalhe só no log)
app.use((erro, req, res, next) => {
    if (erro.type === "entity.parse.failed") {
        return res.status(400).json({ message: "JSON inválido" });
    }
    if (erro.type === "entity.too.large") {
        return res.status(413).json({ message: "Requisição muito grande" });
    }
    console.error(erro);
    return res.status(500).json({ message: "Erro interno do servidor" });
});

// Conexão com o Firestore e inicialização do servidor
(async () => {
    try {
        await iniciarFirestore();
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });

    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
})();
