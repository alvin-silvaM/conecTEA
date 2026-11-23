import { z } from "zod";
import { emailSchema, senhaSchema, telefoneSchema, textoSchema, idSchema } from "../utils/validacao.js";

// Model do Cuidador no Firestore (coleção "cuidadores").
// Campos do documento: nome, telefone, email, senha (hash bcrypt), escola (id da escola), ativo,
// alunosFixados? (ids dos alunos que o cuidador fixou na página Início).
export const COLECAO_CUIDADORES = "cuidadores";

// A escola vem sempre do token, nunca do corpo: campos extras são descartados.
export const criarCuidadorSchema = z.object({
    nome: textoSchema("Nome inválido", 120),
    telefone: telefoneSchema,
    email: emailSchema,
    senha: senhaSchema
});

// Edição parcial pela escola: a escola do cuidador nunca muda.
export const atualizarCuidadorSchema = z
    .object({
        nome: textoSchema("Nome inválido", 120).optional(),
        telefone: telefoneSchema.optional(),
        email: emailSchema.optional(),
        senha: senhaSchema.optional(),
        ativo: z.boolean({ error: "Campo ativo inválido" }).optional()
    })
    .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar");

export const loginCuidadorSchema = z.object({
    email: emailSchema,
    senha: z.string().min(1)
});

// Edição pelo próprio cuidador (tela Meus dados): só nome e telefone. E-mail, senha e status
// continuam com a escola. As mensagens são as mostradas na tela.
const MSG_NOME = "Informe nome e sobrenome.";
const MSG_TELEFONE = "Telefone incompleto. Use DDD + número, ex.: (88) 99999-0000.";

const nomeCompletoSchema = z
    .string({ error: MSG_NOME })
    .trim()
    .max(120, "Nome inválido")
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, MSG_NOME)
    .transform((v) => v.replace(/\s+/g, " "));

const telefoneComDddSchema = z
    .string({ error: MSG_TELEFONE })
    .trim()
    .regex(/^[\d()+\-\s]+$/, MSG_TELEFONE)
    .refine((v) => [10, 11].includes(v.replace(/\D/g, "").length), MSG_TELEFONE);

export const atualizarMeusDadosSchema = z
    .object({
        nome: nomeCompletoSchema.optional(),
        telefone: telefoneComDddSchema.optional()
    })
    .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar");

export const cuidadorParamsSchema = z.object({ id: idSchema });

// Resposta da API: tudo, menos a senha e a lista interna de alunos fixados
export const cuidadorParaResposta = (id, dados) => {
    const { senha, alunosFixados, ...resto } = dados;
    return { _id: id, ...resto };
};
