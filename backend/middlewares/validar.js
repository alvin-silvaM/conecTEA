// Valida params e body com schemas Zod (safeParse). Em caso de falha responde 400 com a primeira
// mensagem em "message" e a lista completa em "erros"; em caso de sucesso coloca os dados já
// validados (e normalizados) em req.validado. Nunca devolve o valor enviado pelo cliente.
// "mensagem" (opcional) substitui a mensagem geral, ex.: nos logins, para não detalhar o formato.
export const validar = ({ params, body, mensagem }) => (req, res, next) => {
    const validado = {};

    for (const [chave, schema, entrada] of [
        ["params", params, req.params],
        ["body", body, req.body ?? {}]
    ]) {
        if (!schema) continue;
        const resultado = schema.safeParse(entrada);
        if (!resultado.success) {
            const erros = resultado.error.issues.map((i) => ({ campo: i.path.join(".") || chave, mensagem: i.message }));
            return res.status(400).json({ message: mensagem ?? erros[0].mensagem, erros });
        }
        validado[chave] = resultado.data;
    }

    req.validado = validado;
    next();
};
