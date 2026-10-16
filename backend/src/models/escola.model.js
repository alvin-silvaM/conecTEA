import { z } from "zod";
import { cnpjSchema, emailSchema, senhaSchema, telefoneSchema, textoSchema, OBRIGATORIO } from "../utils/validacao.js";

// Model da Escola no Firestore (coleção "escolas").
// Campos do documento: cnpj, razaoSocial, endereco{numero,rua,municipio,estado}, telefone1,
// telefone2?, email, senha (hash bcrypt), ativo.
export const COLECAO_ESCOLAS = "escolas";

const enderecoSchema = z.object(
    {
        numero: z
            .number({ error: (i) => (i.input === undefined ? OBRIGATORIO : "Endereço incompleto ou inválido") })
            .int("Endereço incompleto ou inválido")
            .positive("Endereço incompleto ou inválido"),
        rua: textoSchema("Endereço incompleto ou inválido", 200),
        municipio: textoSchema("Endereço incompleto ou inválido", 120),
        estado: textoSchema("Endereço incompleto ou inválido", 50)
    },
    { error: (i) => (i.input === undefined ? OBRIGATORIO : "Endereço incompleto") }
);

// Cadastro. Campos fora da lista (ex.: ativo, _id) são descartados: "ativo" começa sempre true.
export const cadastrarEscolaSchema = z.object({
    cnpj: cnpjSchema,
    razaoSocial: textoSchema("Razão social inválida", 200),
    endereco: enderecoSchema,
    telefone1: telefoneSchema,
    telefone2: telefoneSchema.optional(),
    email: emailSchema,
    senha: senhaSchema
});

// Edição parcial da própria escola. CNPJ e "ativo" não são editáveis. telefone2: null remove o campo.
export const atualizarEscolaSchema = z
    .object({
        razaoSocial: textoSchema("Razão social inválida", 200).optional(),
        endereco: enderecoSchema.optional(),
        telefone1: telefoneSchema.optional(),
        telefone2: telefoneSchema.nullable().optional(),
        email: emailSchema.optional(),
        senha: senhaSchema.optional()
    })
    .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar");

export const loginEscolaSchema = z.object({
    cnpj: cnpjSchema,
    senha: z.string().min(1)
});

// Resposta da API: tudo, menos a senha
export const escolaParaResposta = (id, dados) => {
    const { senha, ...resto } = dados;
    return { _id: id, ...resto };
};
