import { rateLimit } from "express-rate-limit";

const mensagem = (texto) => ({ message: texto });

// Login: limita tentativas FALHAS por IP (logins bem-sucedidos não contam).
// Frena força bruta de senha. Dá para ajustar com LOGIN_MAX no .env.
export const limitadorLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.LOGIN_MAX) || 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: mensagem("Muitas tentativas de login. Tente novamente em alguns minutos.")
});

// Geração de áudio: o TTS consome CPU, então limita pedidos por IP. Ajuste com TTS_MAX_POR_MINUTO.
export const limitadorTts = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.TTS_MAX_POR_MINUTO) || 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: mensagem("Muitos pedidos de áudio. Aguarde um instante e tente novamente.")
});

// Cadastro público de escola: evita criação de contas em massa.
export const limitadorCadastro = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env.CADASTRO_MAX) || 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: mensagem("Muitos cadastros a partir deste endereço. Tente novamente mais tarde.")
});
