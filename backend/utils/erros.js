// Erro com status HTTP conhecido e mensagem segura para devolver ao cliente.
export class ErroHttp extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Resposta única de erro. Erros "esperados" (status < 500) mostram a própria mensagem.
// Qualquer outro erro vira uma mensagem genérica: o detalhe vai só para o log do servidor,
// para não expor nomes de campos, índices ou stack traces do banco.
export const responderErro = (res, erro, mensagemPadrao = "Erro interno do servidor") => {
    if (erro?.status && erro.status < 500) {
        return res.status(erro.status).json({ message: erro.message });
    }
    if (erro?.name === "ValidationError") {
        return res.status(400).json({ message: "Dados inválidos" });
    }
    if (erro?.name === "CastError") {
        return res.status(400).json({ message: "Identificador inválido" });
    }
    if (erro?.code === 11000) {
        return res.status(409).json({ message: "Registro já existe" });
    }
    console.error(erro);
    return res.status(500).json({ message: mensagemPadrao });
};
