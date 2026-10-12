import { z } from "zod";
import { emailSchema, senhaSchema, telefoneSchema, textoSchema, idSchema } from "../utils/validacao.js";

// Model do Cuidador no Firestore (coleção "cuidadores").
// Campos do documento: nome, telefone, email, senha (hash bcrypt), escola (id da escola), ativo.
export const COLECAO_CUIDADORES = "cuidadores";

// A escola vem sempre do token, nunca do corpo: campos extras são descartados.
export const criarCuidadorSchema = z.object({
    nome: textoSchema("Nome inválido", 120),
    telefone: telefoneSchema,
    email: emailSchema,
    senha: senhaSchema
});

export const loginCuidadorSchema = z.object({
    email: emailSchema,
    senha: z.string().min(1)
});

export const cuidadorParamsSchema = z.object({ id: idSchema });

// Resposta da API: tudo, menos a senha
export const cuidadorParaResposta = (id, dados) => {
    const { senha, ...resto } = dados;
    return { _id: id, ...resto };
};
